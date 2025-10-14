/**
 * Test Scheduler
 * 
 * Handles scheduling and execution of A/B test calls based on waves,
 * rate limiting, and attempt policies.
 */

import { QualityGate, QualityGateInput } from './quality_gate';

export type WaveConfig = {
  enabled: boolean;
  per_group_leads: number;
  wave_size: number;
  schedule: Array<{
    start: string;
    end: string;
    target_calls_per_hour: number | 'maintain' | 'reduce';
  }>;
};

export type AttemptsPolicy = {
  max_attempts: number;
  ring_times_sec: number[];
  min_gap_after_attempts: Record<string, number>;
  max_attempts_per_hour_per_lead: number;
};

export type WorkdayConfig = {
  start: string;
  end: string;
};

export type ScheduledCall = {
  call_id: string;
  lead_id: string;
  phone: string;
  group: 'A' | 'B';
  cli: string;
  attempt_number: number;
  scheduled_time: Date;
  wave_id: string;
  test_id: string;
  priority: number;
};

export type SchedulerStats = {
  total_scheduled: number;
  pending_calls: number;
  completed_calls: number;
  failed_calls: number;
  current_rate: number; // calls per hour
  target_rate: number;
};

export class TestScheduler {
  private qualityGate: QualityGate;
  private waveConfig: WaveConfig;
  private attemptsPolicy: AttemptsPolicy;
  private workdayConfig: WorkdayConfig;
  private timezone: string;
  private scheduledCalls: Map<string, ScheduledCall> = new Map();
  private rateLimiter: RateLimiter;

  constructor(
    qualityGate: QualityGate,
    waveConfig: WaveConfig,
    attemptsPolicy: AttemptsPolicy,
    workdayConfig: WorkdayConfig,
    timezone: string
  ) {
    this.qualityGate = qualityGate;
    this.waveConfig = waveConfig;
    this.attemptsPolicy = attemptsPolicy;
    this.workdayConfig = workdayConfig;
    this.timezone = timezone;
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Schedule calls for a test
   */
  async scheduleTestCalls(
    testId: string,
    assignments: Array<{
      lead_id: string;
      phone: string;
      group: 'A' | 'B';
      cli: string;
    }>
  ): Promise<ScheduledCall[]> {
    const scheduledCalls: ScheduledCall[] = [];

    if (!this.waveConfig.enabled) {
      // Schedule all calls immediately
      for (const assignment of assignments) {
        const calls = await this.scheduleLeadCalls(testId, assignment);
        scheduledCalls.push(...calls);
      }
    } else {
      // Schedule calls in waves
      const waves = this.createWaves(assignments);
      
      for (const [waveIndex, wave] of waves.entries()) {
        const waveId = `${testId}_wave_${waveIndex + 1}`;
        const waveCalls = await this.scheduleWaveCalls(testId, waveId, wave);
        scheduledCalls.push(...waveCalls);
      }
    }

    // Store scheduled calls
    for (const call of scheduledCalls) {
      this.scheduledCalls.set(call.call_id, call);
    }

    return scheduledCalls;
  }

  /**
   * Schedule calls for a single lead
   */
  private async scheduleLeadCalls(
    testId: string,
    assignment: {
      lead_id: string;
      phone: string;
      group: 'A' | 'B';
      cli: string;
    }
  ): Promise<ScheduledCall[]> {
    const calls: ScheduledCall[] = [];
    const now = new Date();

    for (let attempt = 1; attempt <= this.attemptsPolicy.max_attempts; attempt++) {
      const callId = `${testId}_${assignment.lead_id}_${attempt}`;
      
      // Calculate scheduled time based on attempt gaps
      const scheduledTime = this.calculateScheduledTime(now, attempt);
      
      // Check if within workday hours
      if (!this.isWithinWorkday(scheduledTime)) {
        continue; // Skip calls outside workday
      }

      // Quality gate check
      const qualityResult = await this.qualityGate.evaluateCall({
        context: 'lead',
        lead_id: assignment.lead_id,
        phone: assignment.phone,
        test_id: testId
      });

      if (!qualityResult.allowed) {
        console.log(`Call blocked by quality gate: ${qualityResult.reason}`);
        continue;
      }

      const call: ScheduledCall = {
        call_id: callId,
        lead_id: assignment.lead_id,
        phone: assignment.phone,
        group: assignment.group,
        cli: assignment.cli,
        attempt_number: attempt,
        scheduled_time: scheduledTime,
        wave_id: 'immediate',
        test_id: testId,
        priority: this.calculatePriority(attempt, assignment.group)
      };

      calls.push(call);
    }

    return calls;
  }

  /**
   * Create waves from assignments
   */
  private createWaves(assignments: Array<{
    lead_id: string;
    phone: string;
    group: 'A' | 'B';
    cli: string;
  }>): Array<Array<{
    lead_id: string;
    phone: string;
    group: 'A' | 'B';
    cli: string;
  }>> {
    const waves: Array<Array<{
      lead_id: string;
      phone: string;
      group: 'A' | 'B';
      cli: string;
    }>> = [];
    
    const waveSize = this.waveConfig.wave_size;
    
    for (let i = 0; i < assignments.length; i += waveSize) {
      waves.push(assignments.slice(i, i + waveSize));
    }
    
    return waves;
  }

  /**
   * Schedule calls for a wave
   */
  private async scheduleWaveCalls(
    testId: string,
    waveId: string,
    waveAssignments: Array<{
      lead_id: string;
      phone: string;
      group: 'A' | 'B';
      cli: string;
    }>
  ): Promise<ScheduledCall[]> {
    const calls: ScheduledCall[] = [];
    
    // Get wave schedule
    const waveSchedule = this.getWaveSchedule(waveId);
    
    for (const assignment of waveAssignments) {
      const leadCalls = await this.scheduleLeadCalls(testId, assignment);
      
      // Adjust timing based on wave schedule
      for (const call of leadCalls) {
        call.wave_id = waveId;
        call.scheduled_time = this.adjustForWaveSchedule(call.scheduled_time, waveSchedule);
        calls.push(call);
      }
    }

    return calls;
  }

  /**
   * Get wave schedule
   */
  private getWaveSchedule(waveId: string): {
    start: string;
    end: string;
    target_calls_per_hour: number | 'maintain' | 'reduce';
  } {
    // For now, use the first schedule entry
    // In production, this would be more sophisticated
    return this.waveConfig.schedule[0] || {
      start: '09:00',
      end: '17:00',
      target_calls_per_hour: 10
    };
  }

  /**
   * Calculate scheduled time for an attempt
   */
  private calculateScheduledTime(baseTime: Date, attempt: number): Date {
    const gapKey = `after_${attempt}`;
    const gapMinutes = this.attemptsPolicy.min_gap_after_attempts[gapKey] || 0;
    
    return new Date(baseTime.getTime() + gapMinutes * 60 * 1000);
  }

  /**
   * Check if time is within workday
   */
  private isWithinWorkday(time: Date): boolean {
    const hour = time.getHours();
    const minute = time.getMinutes();
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    return timeString >= this.workdayConfig.start && timeString <= this.workdayConfig.end;
  }

  /**
   * Calculate call priority
   */
  private calculatePriority(attempt: number, group: 'A' | 'B'): number {
    // Higher priority for earlier attempts and group A
    const attemptPriority = (this.attemptsPolicy.max_attempts - attempt + 1) * 10;
    const groupPriority = group === 'A' ? 5 : 0;
    
    return attemptPriority + groupPriority;
  }

  /**
   * Adjust time for wave schedule
   */
  private adjustForWaveSchedule(
    scheduledTime: Date,
    waveSchedule: {
      start: string;
      end: string;
      target_calls_per_hour: number | 'maintain' | 'reduce';
    }
  ): Date {
    // For now, just return the scheduled time
    // In production, this would adjust based on wave schedule
    return scheduledTime;
  }

  /**
   * Get next calls to execute
   */
  getNextCalls(limit: number = 10): ScheduledCall[] {
    const now = new Date();
    
    return Array.from(this.scheduledCalls.values())
      .filter(call => call.scheduled_time <= now)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  /**
   * Mark call as completed
   */
  markCallCompleted(callId: string): void {
    this.scheduledCalls.delete(callId);
  }

  /**
   * Mark call as failed
   */
  markCallFailed(callId: string, reason: string): void {
    const call = this.scheduledCalls.get(callId);
    if (call) {
      // Could implement retry logic here
      this.scheduledCalls.delete(callId);
    }
  }

  /**
   * Get scheduler statistics
   */
  getStats(): SchedulerStats {
    const totalScheduled = this.scheduledCalls.size;
    const now = new Date();
    
    const pendingCalls = Array.from(this.scheduledCalls.values())
      .filter(call => call.scheduled_time > now).length;
    
    const completedCalls = 0; // This would come from a database
    const failedCalls = 0; // This would come from a database
    
    return {
      total_scheduled: totalScheduled,
      pending_calls: pendingCalls,
      completed_calls: completedCalls,
      failed_calls: failedCalls,
      current_rate: 0, // This would be calculated from recent calls
      target_rate: 10 // This would come from configuration
    };
  }
}

/**
 * Rate Limiter
 * 
 * Implements token bucket algorithm for rate limiting calls.
 */
class RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private capacity: number;
  private refillRate: number; // tokens per second

  constructor(capacity: number = 100, refillRate: number = 10) {
    this.capacity = capacity;
    this.refillRate = refillRate;
  }

  /**
   * Check if call is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key) || { tokens: this.capacity, lastRefill: now };
    
    // Refill tokens
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    // Check if we have enough tokens
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.buckets.set(key, bucket);
      return true;
    }
    
    return false;
  }

  /**
   * Get remaining tokens
   */
  getRemainingTokens(key: string): number {
    const bucket = this.buckets.get(key);
    return bucket ? bucket.tokens : this.capacity;
  }
}


