/**
 * Test Runner Service
 * 
 * Orchestrates A/B test execution, including lead assignment, call scheduling,
 * quality gates, rate limiting, and metrics collection.
 */

import { LeadAssigner, Lead, AssignmentResult } from '../domain/assigner';
import { TestScheduler, ScheduledCall, WaveConfig, AttemptsPolicy, WorkdayConfig } from '../domain/scheduler';
import { QualityGate, QualityGateConfig } from '../domain/quality_gate';
import { RateLimiter, RateLimitConfig } from '../domain/rate_limiter';
import { StopRules, StopRuleConfig, TestMetrics } from '../domain/stop_rules';
import { MetricsService, CallMetrics, CallOutcome } from '../domain/metrics';
import { VoiceProvider } from '../adapters/voice/voice_provider';
import { WhatsAppProvider } from '../adapters/whatsapp/whatsapp_provider';
import { EmailProvider } from '../adapters/email/email_provider';
import { SpamCheckerProvider } from '../adapters/spam_checker/spam_checker_provider';

export type TestConfig = {
  test_name: string;
  timezone: string;
  workday: WorkdayConfig;
  groups: {
    A: { label: string; cli: string };
    B: { label: string; cli: string };
  };
  leads: Lead[];
  assignment: {
    mode: 'random_1_to_1' | 'stratified';
    block_size?: number;
  };
  attempts_policy: AttemptsPolicy;
  waves?: WaveConfig;
  nudges?: {
    whatsapp?: any;
    voicemail?: any;
    email?: any;
  };
  spam_controls?: {
    snapshot_interval_min: number;
    stop_rules: StopRuleConfig;
  };
  spam_checker?: QualityGateConfig['spam_checker'];
  compliance?: {
    max_calls_per_cli_per_hour: number;
    respect_robinson: boolean;
  };
};

export type TestStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'running' 
  | 'paused' 
  | 'stopped' 
  | 'completed' 
  | 'failed';

export type TestState = {
  test_id: string;
  status: TestStatus;
  config: TestConfig;
  assignments: AssignmentResult[];
  scheduled_calls: ScheduledCall[];
  current_metrics: TestMetrics;
  started_at?: Date;
  paused_at?: Date;
  stopped_at?: Date;
  completed_at?: Date;
  error?: string;
};

export class TestRunner {
  private voiceProvider: VoiceProvider;
  private whatsappProvider: WhatsAppProvider;
  private emailProvider: EmailProvider;
  private spamChecker: SpamCheckerProvider;
  private metricsService: MetricsService;
  private activeTests: Map<string, TestState> = new Map();

  constructor(
    voiceProvider: VoiceProvider,
    whatsappProvider: WhatsAppProvider,
    emailProvider: EmailProvider,
    spamChecker: SpamCheckerProvider,
    metricsService: MetricsService
  ) {
    this.voiceProvider = voiceProvider;
    this.whatsappProvider = whatsappProvider;
    this.emailProvider = emailProvider;
    this.spamChecker = spamChecker;
    this.metricsService = metricsService;
  }

  /**
   * Create and initialize a new test
   */
  async createTest(testId: string, config: TestConfig): Promise<TestState> {
    // Validate configuration
    this.validateConfig(config);

    // Assign leads to groups
    const assigner = new LeadAssigner(config.assignment);
    const assignments = assigner.assignLeads(config.leads);

    // Initialize test state
    const testState: TestState = {
      test_id: testId,
      status: 'draft',
      config,
      assignments,
      scheduled_calls: [],
      current_metrics: this.initializeMetrics()
    };

    this.activeTests.set(testId, testState);
    return testState;
  }

  /**
   * Start a test
   */
  async startTest(testId: string): Promise<TestState> {
    const testState = this.getTestState(testId);
    
    if (testState.status !== 'draft' && testState.status !== 'paused') {
      throw new Error(`Cannot start test with status: ${testState.status}`);
    }

    // Initialize components
    const qualityGate = this.createQualityGate(testState.config);
    const stopRules = this.createStopRules(testState.config);
    const rateLimiter = this.createRateLimiter(testState.config);
    const scheduler = this.createScheduler(testState.config, qualityGate);

    // Schedule calls
    const scheduledCalls = await this.scheduleCalls(testState, scheduler);
    
    testState.scheduled_calls = scheduledCalls;
    testState.status = 'running';
    testState.started_at = new Date();
    
    this.activeTests.set(testId, testState);

    // Start execution loop
    this.startExecutionLoop(testId, scheduler, qualityGate, stopRules, rateLimiter);

    return testState;
  }

  /**
   * Pause a test
   */
  async pauseTest(testId: string, reason?: string): Promise<TestState> {
    const testState = this.getTestState(testId);
    
    if (testState.status !== 'running') {
      throw new Error(`Cannot pause test with status: ${testState.status}`);
    }

    testState.status = 'paused';
    testState.paused_at = new Date();
    testState.error = reason;
    
    this.activeTests.set(testId, testState);
    return testState;
  }

  /**
   * Resume a paused test
   */
  async resumeTest(testId: string): Promise<TestState> {
    const testState = this.getTestState(testId);
    
    if (testState.status !== 'paused') {
      throw new Error(`Cannot resume test with status: ${testState.status}`);
    }

    testState.status = 'running';
    testState.paused_at = undefined;
    testState.error = undefined;
    
    this.activeTests.set(testId, testState);

    // Restart execution loop
    const qualityGate = this.createQualityGate(testState.config);
    const stopRules = this.createStopRules(testState.config);
    const rateLimiter = this.createRateLimiter(testState.config);
    const scheduler = this.createScheduler(testState.config, qualityGate);
    
    this.startExecutionLoop(testId, scheduler, qualityGate, stopRules, rateLimiter);

    return testState;
  }

  /**
   * Stop a test
   */
  async stopTest(testId: string, reason?: string): Promise<TestState> {
    const testState = this.getTestState(testId);
    
    if (testState.status !== 'running' && testState.status !== 'paused') {
      throw new Error(`Cannot stop test with status: ${testState.status}`);
    }

    testState.status = 'stopped';
    testState.stopped_at = new Date();
    testState.error = reason;
    
    this.activeTests.set(testId, testState);
    return testState;
  }

  /**
   * Get test status
   */
  getTestStatus(testId: string): TestState {
    return this.getTestState(testId);
  }

  /**
   * Get all tests
   */
  getAllTests(): TestState[] {
    return Array.from(this.activeTests.values());
  }

  /**
   * Delete a test
   */
  async deleteTest(testId: string): Promise<void> {
    const testState = this.activeTests.get(testId);
    
    if (testState && (testState.status === 'running' || testState.status === 'paused')) {
      throw new Error('Cannot delete a running or paused test. Stop it first.');
    }

    this.activeTests.delete(testId);
    this.metricsService.clearMetrics(testId);
  }

  /**
   * Schedule calls for a test
   */
  private async scheduleCalls(
    testState: TestState,
    scheduler: TestScheduler
  ): Promise<ScheduledCall[]> {
    const assignmentsWithCli = testState.assignments.map(assignment => ({
      lead_id: assignment.lead_id,
      phone: testState.config.leads.find(l => l.lead_id === assignment.lead_id)!.phone,
      group: assignment.group,
      cli: assignment.group === 'A' 
        ? testState.config.groups.A.cli 
        : testState.config.groups.B.cli
    }));

    return await scheduler.scheduleTestCalls(testState.test_id, assignmentsWithCli);
  }

  /**
   * Start execution loop
   */
  private async startExecutionLoop(
    testId: string,
    scheduler: TestScheduler,
    qualityGate: QualityGate,
    stopRules: StopRules,
    rateLimiter: RateLimiter
  ): Promise<void> {
    // This would typically run in a background job/worker
    // For now, we'll just set up the structure
    
    const executionInterval = setInterval(async () => {
      const testState = this.activeTests.get(testId);
      
      if (!testState || testState.status !== 'running') {
        clearInterval(executionInterval);
        return;
      }

      // Check stop rules
      const stopResult = stopRules.evaluateStopRules(testId, testState.current_metrics);
      
      if (stopResult.should_stop) {
        await this.stopTest(testId, stopResult.reason);
        clearInterval(executionInterval);
        return;
      }
      
      if (stopResult.should_pause) {
        await this.pauseTest(testId, stopResult.reason);
        clearInterval(executionInterval);
        return;
      }

      // Get next calls to execute
      const nextCalls = scheduler.getNextCalls(10);
      
      for (const call of nextCalls) {
        // Check rate limit
        const rateLimitKey = `cli_${call.cli}`;
        const rateLimitStatus = rateLimiter.isAllowed(rateLimitKey);
        
        if (!rateLimitStatus.allowed) {
          console.log(`Rate limit exceeded for ${rateLimitKey}`);
          continue;
        }

        // Execute call
        await this.executeCall(testState, call);
        
        // Mark call as completed
        scheduler.markCallCompleted(call.call_id);
      }
    }, 1000); // Check every second
  }

  /**
   * Execute a single call
   */
  private async executeCall(testState: TestState, call: ScheduledCall): Promise<void> {
    try {
      const ncco = this.buildNcco(testState.config, call);
      
      const callResponse = await this.voiceProvider.makeCall({
        to: call.phone,
        from: call.cli,
        ncco,
        ringTimeout: testState.config.attempts_policy.ring_times_sec[call.attempt_number - 1] || 30
      });

      // Record call metric
      const callMetric: CallMetrics = {
        call_id: call.call_id,
        test_id: call.test_id,
        lead_id: call.lead_id,
        group: call.group,
        outcome: this.mapCallOutcome(callResponse.status),
        duration: callResponse.duration || 0,
        attempt_number: call.attempt_number,
        timestamp: new Date(),
        metadata: {
          provider_call_id: callResponse.callId,
          provider_status: callResponse.status
        }
      };

      this.metricsService.recordCallMetric(callMetric);

      // Update test metrics
      this.updateTestMetrics(testState.test_id, callMetric);

      // Send nudges if needed
      await this.handleNudges(testState, call, callMetric);
    } catch (error) {
      console.error(`Failed to execute call ${call.call_id}:`, error);
      
      // Record failed call metric
      const callMetric: CallMetrics = {
        call_id: call.call_id,
        test_id: call.test_id,
        lead_id: call.lead_id,
        group: call.group,
        outcome: 'failed',
        duration: 0,
        attempt_number: call.attempt_number,
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };

      this.metricsService.recordCallMetric(callMetric);
      this.updateTestMetrics(testState.test_id, callMetric);
    }
  }

  /**
   * Handle nudges (WhatsApp, Email, Voicemail)
   */
  private async handleNudges(
    testState: TestState,
    call: ScheduledCall,
    callMetric: CallMetrics
  ): Promise<void> {
    const nudges = testState.config.nudges;
    
    if (!nudges) {
      return;
    }

    // WhatsApp nudge
    if (nudges.whatsapp?.enabled) {
      const shouldSendWA = this.shouldSendWhatsAppNudge(nudges.whatsapp, call, callMetric);
      
      if (shouldSendWA) {
        await this.sendWhatsAppNudge(testState, call, nudges.whatsapp);
      }
    }

    // Email nudge
    if (nudges.email?.enabled) {
      const shouldSendEmail = this.shouldSendEmailNudge(nudges.email, call, callMetric);
      
      if (shouldSendEmail) {
        await this.sendEmailNudge(testState, call, nudges.email);
      }
    }
  }

  /**
   * Send WhatsApp nudge
   */
  private async sendWhatsAppNudge(
    testState: TestState,
    call: ScheduledCall,
    config: any
  ): Promise<void> {
    try {
      const message = this.whatsappProvider.createButtonMessage({
        to: call.phone,
        bodyText: config.text_template.replace('{{lead_id}}', call.lead_id),
        buttons: config.buttons || []
      });

      await this.whatsappProvider.sendMessage(message);
    } catch (error) {
      console.error('Failed to send WhatsApp nudge:', error);
    }
  }

  /**
   * Send email nudge
   */
  private async sendEmailNudge(
    testState: TestState,
    call: ScheduledCall,
    config: any
  ): Promise<void> {
    try {
      await this.emailProvider.sendEmail({
        to: call.phone, // Would need to get email from lead data
        from: config.from,
        subject: config.subject,
        html: config.html || config.template_id,
        templateId: config.template_id
      });
    } catch (error) {
      console.error('Failed to send email nudge:', error);
    }
  }

  /**
   * Helper methods
   */
  private validateConfig(config: TestConfig): void {
    if (!config.test_name || !config.timezone || !config.workday) {
      throw new Error('Invalid test configuration: missing required fields');
    }
    
    if (config.leads.length === 0) {
      throw new Error('Test must have at least one lead');
    }
  }

  private getTestState(testId: string): TestState {
    const testState = this.activeTests.get(testId);
    
    if (!testState) {
      throw new Error(`Test not found: ${testId}`);
    }
    
    return testState;
  }

  private createQualityGate(config: TestConfig): QualityGate {
    const qualityGateConfig: QualityGateConfig = {
      spam_checker: config.spam_checker || {
        enabled: false,
        policy: 'pre_call_gate',
        signal_source: 'internal_api',
        scoring_field: 'risk_score',
        labels_field: 'labels',
        thresholds: {
          block_above: 80,
          slow_above: 60,
          warn_above: 40
        },
        windowing: {
          horizon: '1h',
          granularity: '10m'
        },
        actions: {
          block: 'skip_call',
          slow: 'downshift_rate',
          warn: 'log_only'
        },
        telemetry_fields: []
      }
    };

    return new QualityGate(this.spamChecker, qualityGateConfig);
  }

  private createStopRules(config: TestConfig): StopRules {
    const stopRuleConfig: StopRuleConfig = config.spam_controls?.stop_rules || {
      on_first_flag: { action: 'pause', pause_min: 30 },
      on_second_flag: { action: 'stop' },
      on_answer_rate_drop_pct: 20,
      on_hangup_over_answered_pct: 50,
      rate_downshift_factor: 0.5
    };

    return new StopRules(stopRuleConfig);
  }

  private createRateLimiter(config: TestConfig): RateLimiter {
    const rateLimitConfig: RateLimitConfig = {
      max_calls_per_hour: config.compliance?.max_calls_per_cli_per_hour || 100,
      burst_capacity: 10,
      refill_rate: (config.compliance?.max_calls_per_cli_per_hour || 100) / 3600,
      downshift_factor: 0.5
    };

    return new RateLimiter(rateLimitConfig);
  }

  private createScheduler(config: TestConfig, qualityGate: QualityGate): TestScheduler {
    const waveConfig: WaveConfig = config.waves || {
      enabled: false,
      per_group_leads: 0,
      wave_size: 0,
      schedule: []
    };

    return new TestScheduler(
      qualityGate,
      waveConfig,
      config.attempts_policy,
      config.workday,
      config.timezone
    );
  }

  private initializeMetrics(): TestMetrics {
    return {
      total_calls: 0,
      answered_calls: 0,
      failed_calls: 0,
      spam_flags: 0,
      answer_rate: 0,
      hangup_rate: 0,
      average_call_duration: 0,
      last_updated: new Date()
    };
  }

  private updateTestMetrics(testId: string, callMetric: CallMetrics): void {
    const testState = this.activeTests.get(testId);
    
    if (!testState) {
      return;
    }

    const metrics = testState.current_metrics;
    
    metrics.total_calls++;
    
    if (callMetric.outcome === 'answered') {
      metrics.answered_calls++;
    } else if (callMetric.outcome === 'failed') {
      metrics.failed_calls++;
    }
    
    if (callMetric.spam_labels && callMetric.spam_labels.length > 0) {
      metrics.spam_flags++;
    }
    
    metrics.answer_rate = metrics.total_calls > 0 
      ? (metrics.answered_calls / metrics.total_calls) * 100 
      : 0;
    
    metrics.last_updated = new Date();
    
    this.activeTests.set(testId, testState);
  }

  private mapCallOutcome(status: string): CallOutcome {
    const outcomeMap: Record<string, CallOutcome> = {
      'answered': 'answered',
      'completed': 'answered',
      'unanswered': 'no_answer',
      'timeout': 'no_answer',
      'busy': 'busy',
      'failed': 'failed',
      'rejected': 'rejected'
    };

    return outcomeMap[status] || 'failed';
  }

  private buildNcco(config: TestConfig, call: ScheduledCall): any[] {
    // Basic NCCO for testing
    return [
      {
        action: 'talk',
        text: `This is a test call for ${config.test_name}, attempt ${call.attempt_number}`,
        voiceName: 'Amy',
        language: 'en-US'
      }
    ];
  }

  private shouldSendWhatsAppNudge(config: any, call: ScheduledCall, metric: CallMetrics): boolean {
    if (!config.when) {
      return false;
    }

    const whenPattern = config.when.match(/after_attempt_(\d+)_fail/);
    
    if (whenPattern) {
      const attemptNumber = parseInt(whenPattern[1], 10);
      return call.attempt_number === attemptNumber && metric.outcome !== 'answered';
    }

    return false;
  }

  private shouldSendEmailNudge(config: any, call: ScheduledCall, metric: CallMetrics): boolean {
    // Similar logic to WhatsApp nudge
    return false; // Placeholder
  }
}

