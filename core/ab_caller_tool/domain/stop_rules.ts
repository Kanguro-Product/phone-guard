/**
 * Stop Rules
 * 
 * Implements business rules for stopping A/B tests based on various conditions
 * including spam detection, answer rates, and other quality metrics.
 */

export type StopRuleConfig = {
  on_first_flag: {
    action: 'pause' | 'stop' | 'notify';
    pause_min?: number;
  };
  on_second_flag: {
    action: 'pause' | 'stop' | 'notify';
  };
  on_answer_rate_drop_pct: number;
  on_hangup_over_answered_pct: number;
  rate_downshift_factor: number;
};

export type TestMetrics = {
  total_calls: number;
  answered_calls: number;
  failed_calls: number;
  spam_flags: number;
  answer_rate: number;
  hangup_rate: number;
  average_call_duration: number;
  last_updated: Date;
};

export type StopRuleResult = {
  should_stop: boolean;
  should_pause: boolean;
  should_notify: boolean;
  reason: string;
  action: 'continue' | 'pause' | 'stop' | 'notify';
  metadata?: Record<string, any>;
};

export type StopRuleStats = {
  total_evaluations: number;
  stops_triggered: number;
  pauses_triggered: number;
  notifications_sent: number;
  most_common_reason: string;
};

export class StopRules {
  private config: StopRuleConfig;
  private metrics: Map<string, TestMetrics> = new Map();
  private stats: StopRuleStats = {
    total_evaluations: 0,
    stops_triggered: 0,
    pauses_triggered: 0,
    notifications_sent: 0,
    most_common_reason: ''
  };

  constructor(config: StopRuleConfig) {
    this.config = config;
  }

  /**
   * Evaluate stop rules for a test
   */
  evaluateStopRules(testId: string, currentMetrics: TestMetrics): StopRuleResult {
    this.stats.total_evaluations++;
    this.metrics.set(testId, currentMetrics);

    // Check spam flag rules
    const spamResult = this.evaluateSpamFlagRules(testId, currentMetrics);
    if (spamResult.should_stop || spamResult.should_pause) {
      return spamResult;
    }

    // Check answer rate rules
    const answerRateResult = this.evaluateAnswerRateRules(testId, currentMetrics);
    if (answerRateResult.should_stop || answerRateResult.should_pause) {
      return answerRateResult;
    }

    // Check hangup rate rules
    const hangupRateResult = this.evaluateHangupRateRules(testId, currentMetrics);
    if (hangupRateResult.should_stop || hangupRateResult.should_pause) {
      return hangupRateResult;
    }

    return {
      should_stop: false,
      should_pause: false,
      should_notify: false,
      reason: 'No stop conditions met',
      action: 'continue'
    };
  }

  /**
   * Evaluate spam flag rules
   */
  private evaluateSpamFlagRules(testId: string, metrics: TestMetrics): StopRuleResult {
    const previousMetrics = this.getPreviousMetrics(testId);
    
    if (metrics.spam_flags === 1 && (!previousMetrics || previousMetrics.spam_flags === 0)) {
      // First spam flag
      this.stats.pauses_triggered++;
      
      return {
        should_stop: false,
        should_pause: true,
        should_notify: this.config.on_first_flag.action === 'notify',
        reason: `First spam flag detected (${metrics.spam_flags} flags)`,
        action: this.config.on_first_flag.action,
        metadata: {
          spam_flags: metrics.spam_flags,
          rule: 'first_spam_flag'
        }
      };
    }
    
    if (metrics.spam_flags >= 2 && (!previousMetrics || previousMetrics.spam_flags < 2)) {
      // Second spam flag
      this.stats.stops_triggered++;
      
      return {
        should_stop: true,
        should_pause: false,
        should_notify: this.config.on_second_flag.action === 'notify',
        reason: `Second spam flag detected (${metrics.spam_flags} flags)`,
        action: this.config.on_second_flag.action,
        metadata: {
          spam_flags: metrics.spam_flags,
          rule: 'second_spam_flag'
        }
      };
    }

    return {
      should_stop: false,
      should_pause: false,
      should_notify: false,
      reason: 'No spam flag conditions met',
      action: 'continue'
    };
  }

  /**
   * Evaluate answer rate rules
   */
  private evaluateAnswerRateRules(testId: string, metrics: TestMetrics): StopRuleResult {
    const previousMetrics = this.getPreviousMetrics(testId);
    
    if (!previousMetrics) {
      return {
        should_stop: false,
        should_pause: false,
        should_notify: false,
        reason: 'No previous metrics for comparison',
        action: 'continue'
      };
    }

    const answerRateDrop = previousMetrics.answer_rate - metrics.answer_rate;
    
    if (answerRateDrop >= this.config.on_answer_rate_drop_pct) {
      this.stats.pauses_triggered++;
      
      return {
        should_stop: false,
        should_pause: true,
        should_notify: true,
        reason: `Answer rate dropped by ${answerRateDrop.toFixed(2)}% (threshold: ${this.config.on_answer_rate_drop_pct}%)`,
        action: 'pause',
        metadata: {
          current_answer_rate: metrics.answer_rate,
          previous_answer_rate: previousMetrics.answer_rate,
          drop_percentage: answerRateDrop,
          threshold: this.config.on_answer_rate_drop_pct,
          rule: 'answer_rate_drop'
        }
      };
    }

    return {
      should_stop: false,
      should_pause: false,
      should_notify: false,
      reason: 'Answer rate drop within acceptable range',
      action: 'continue'
    };
  }

  /**
   * Evaluate hangup rate rules
   */
  private evaluateHangupRateRules(testId: string, metrics: TestMetrics): StopRuleResult {
    const hangupRate = metrics.hangup_rate;
    
    if (hangupRate >= this.config.on_hangup_over_answered_pct) {
      this.stats.pauses_triggered++;
      
      return {
        should_stop: false,
        should_pause: true,
        should_notify: true,
        reason: `Hangup rate ${hangupRate.toFixed(2)}% exceeds threshold ${this.config.on_hangup_over_answered_pct}%`,
        action: 'pause',
        metadata: {
          hangup_rate: hangupRate,
          threshold: this.config.on_hangup_over_answered_pct,
          rule: 'hangup_rate_exceeded'
        }
      };
    }

    return {
      should_stop: false,
      should_pause: false,
      should_notify: false,
      reason: 'Hangup rate within acceptable range',
      action: 'continue'
    };
  }

  /**
   * Get previous metrics for comparison
   */
  private getPreviousMetrics(testId: string): TestMetrics | null {
    // In production, this would query a database
    // For now, return null to simulate no previous data
    return null;
  }

  /**
   * Update metrics for a test
   */
  updateMetrics(testId: string, metrics: Partial<TestMetrics>): void {
    const currentMetrics = this.metrics.get(testId) || {
      total_calls: 0,
      answered_calls: 0,
      failed_calls: 0,
      spam_flags: 0,
      answer_rate: 0,
      hangup_rate: 0,
      average_call_duration: 0,
      last_updated: new Date()
    };

    const updatedMetrics: TestMetrics = {
      ...currentMetrics,
      ...metrics,
      last_updated: new Date()
    };

    this.metrics.set(testId, updatedMetrics);
  }

  /**
   * Get stop rule statistics
   */
  getStats(): StopRuleStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      total_evaluations: 0,
      stops_triggered: 0,
      pauses_triggered: 0,
      notifications_sent: 0,
      most_common_reason: ''
    };
  }

  /**
   * Get configuration
   */
  getConfig(): StopRuleConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StopRuleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get metrics for a test
   */
  getMetrics(testId: string): TestMetrics | null {
    return this.metrics.get(testId) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, TestMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Clear metrics for a test
   */
  clearMetrics(testId: string): void {
    this.metrics.delete(testId);
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Stop Rule Evaluator
 * 
 * Evaluates multiple stop rules and determines the appropriate action.
 */
export class StopRuleEvaluator {
  private stopRules: StopRules;
  private qualityGate: any; // QualityGate instance

  constructor(stopRules: StopRules, qualityGate: any) {
    this.stopRules = stopRules;
    this.qualityGate = qualityGate;
  }

  /**
   * Evaluate all stop conditions
   */
  async evaluateAllConditions(
    testId: string,
    currentMetrics: TestMetrics
  ): Promise<StopRuleResult> {
    // Evaluate stop rules
    const stopRuleResult = this.stopRules.evaluateStopRules(testId, currentMetrics);
    
    if (stopRuleResult.should_stop || stopRuleResult.should_pause) {
      return stopRuleResult;
    }

    // Evaluate quality gate conditions
    const qualityResult = await this.qualityGate.evaluateWave({
      context: 'wave',
      test_id: testId
    });

    if (!qualityResult.allowed) {
      return {
        should_stop: qualityResult.action === 'block',
        should_pause: qualityResult.action === 'slow',
        should_notify: qualityResult.action === 'warn',
        reason: `Quality gate: ${qualityResult.reason}`,
        action: qualityResult.action === 'block' ? 'stop' : 'pause',
        metadata: {
          ...qualityResult.metadata,
          source: 'quality_gate'
        }
      };
    }

    return {
      should_stop: false,
      should_pause: false,
      should_notify: false,
      reason: 'All conditions passed',
      action: 'continue'
    };
  }

  /**
   * Get comprehensive evaluation report
   */
  async getEvaluationReport(testId: string): Promise<{
    test_id: string;
    current_metrics: TestMetrics | null;
    stop_rule_result: StopRuleResult;
    quality_gate_result: any;
    recommendation: string;
    timestamp: Date;
  }> {
    const currentMetrics = this.stopRules.getMetrics(testId);
    const stopRuleResult = currentMetrics 
      ? this.stopRules.evaluateStopRules(testId, currentMetrics)
      : {
          should_stop: false,
          should_pause: false,
          should_notify: false,
          reason: 'No metrics available',
          action: 'continue' as const
        };

    const qualityGateResult = await this.qualityGate.evaluateWave({
      context: 'wave',
      test_id: testId
    });

    let recommendation = 'Continue test';
    if (stopRuleResult.should_stop) {
      recommendation = 'Stop test immediately';
    } else if (stopRuleResult.should_pause) {
      recommendation = 'Pause test for review';
    } else if (!qualityGateResult.allowed) {
      recommendation = 'Review quality gate conditions';
    }

    return {
      test_id: testId,
      current_metrics: currentMetrics,
      stop_rule_result: stopRuleResult,
      quality_gate_result: qualityGateResult,
      recommendation,
      timestamp: new Date()
    };
  }
}
