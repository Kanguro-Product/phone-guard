/**
 * Metrics Service
 * 
 * Collects and aggregates metrics for A/B tests including call outcomes,
 * answer rates, spam flags, and other KPIs.
 */

export type CallOutcome = 
  | 'answered' 
  | 'no_answer' 
  | 'busy' 
  | 'failed' 
  | 'rejected' 
  | 'voicemail' 
  | 'spam_blocked';

export type CallMetrics = {
  call_id: string;
  test_id: string;
  lead_id: string;
  group: 'A' | 'B';
  outcome: CallOutcome;
  duration: number;
  attempt_number: number;
  timestamp: Date;
  spam_score?: number;
  spam_labels?: string[];
  metadata?: Record<string, any>;
};

export type AggregatedMetrics = {
  test_id: string;
  group?: 'A' | 'B';
  total_calls: number;
  answered_calls: number;
  failed_calls: number;
  busy_calls: number;
  rejected_calls: number;
  voicemail_calls: number;
  spam_blocked_calls: number;
  answer_rate: number;
  connect_rate: number;
  spam_block_rate: number;
  average_duration: number;
  total_duration: number;
  spam_flags: number;
  hangup_rate: number;
  leads_contacted: number;
  leads_answered: number;
  callbacks_2h: number;
  callbacks_24h: number;
  time_window_start: Date;
  time_window_end: Date;
  last_updated: Date;
};

export type ComparisonMetrics = {
  test_id: string;
  group_a: AggregatedMetrics;
  group_b: AggregatedMetrics;
  differences: {
    answer_rate_diff: number;
    answer_rate_diff_pct: number;
    connect_rate_diff: number;
    spam_block_rate_diff: number;
    average_duration_diff: number;
    statistical_significance: boolean;
    confidence_level: number;
  };
  winner?: 'A' | 'B' | 'tie';
  recommendation: string;
  timestamp: Date;
};

export type MetricsWindow = {
  start: Date;
  end: Date;
  interval: 'hourly' | 'daily' | 'total';
};

export class MetricsService {
  private callMetrics: Map<string, CallMetrics[]> = new Map();
  private aggregatedMetrics: Map<string, AggregatedMetrics> = new Map();

  /**
   * Record a call metric
   */
  recordCallMetric(metric: CallMetrics): void {
    const testId = metric.test_id;
    
    if (!this.callMetrics.has(testId)) {
      this.callMetrics.set(testId, []);
    }
    
    this.callMetrics.get(testId)!.push(metric);
    
    // Trigger aggregation update
    this.updateAggregatedMetrics(testId);
  }

  /**
   * Get aggregated metrics for a test
   */
  getAggregatedMetrics(
    testId: string, 
    group?: 'A' | 'B', 
    window?: MetricsWindow
  ): AggregatedMetrics | null {
    const key = this.getMetricsKey(testId, group);
    const metrics = this.aggregatedMetrics.get(key);
    
    if (!metrics) {
      return null;
    }
    
    if (window) {
      return this.filterMetricsByWindow(testId, group, window);
    }
    
    return metrics;
  }

  /**
   * Get comparison metrics between groups A and B
   */
  getComparisonMetrics(testId: string, window?: MetricsWindow): ComparisonMetrics | null {
    const groupA = this.getAggregatedMetrics(testId, 'A', window);
    const groupB = this.getAggregatedMetrics(testId, 'B', window);
    
    if (!groupA || !groupB) {
      return null;
    }
    
    const differences = this.calculateDifferences(groupA, groupB);
    const winner = this.determineWinner(differences);
    const recommendation = this.generateRecommendation(differences, winner);
    
    return {
      test_id: testId,
      group_a: groupA,
      group_b: groupB,
      differences,
      winner,
      recommendation,
      timestamp: new Date()
    };
  }

  /**
   * Get real-time metrics snapshot
   */
  getRealtimeSnapshot(testId: string): {
    test_id: string;
    group_a: Partial<AggregatedMetrics>;
    group_b: Partial<AggregatedMetrics>;
    current_rate: number;
    timestamp: Date;
  } {
    const groupA = this.getAggregatedMetrics(testId, 'A');
    const groupB = this.getAggregatedMetrics(testId, 'B');
    
    // Calculate current rate (calls per hour) from last hour
    const currentRate = this.calculateCurrentRate(testId);
    
    return {
      test_id: testId,
      group_a: {
        total_calls: groupA?.total_calls || 0,
        answered_calls: groupA?.answered_calls || 0,
        answer_rate: groupA?.answer_rate || 0,
        spam_flags: groupA?.spam_flags || 0
      },
      group_b: {
        total_calls: groupB?.total_calls || 0,
        answered_calls: groupB?.answered_calls || 0,
        answer_rate: groupB?.answer_rate || 0,
        spam_flags: groupB?.spam_flags || 0
      },
      current_rate: currentRate,
      timestamp: new Date()
    };
  }

  /**
   * Get time series metrics
   */
  getTimeSeriesMetrics(
    testId: string,
    interval: 'hourly' | 'daily',
    start: Date,
    end: Date
  ): Array<{
    timestamp: Date;
    group_a: Partial<AggregatedMetrics>;
    group_b: Partial<AggregatedMetrics>;
  }> {
    const timeSeries: Array<{
      timestamp: Date;
      group_a: Partial<AggregatedMetrics>;
      group_b: Partial<AggregatedMetrics>;
    }> = [];
    
    const intervalMs = interval === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    for (let timestamp = start.getTime(); timestamp <= end.getTime(); timestamp += intervalMs) {
      const windowStart = new Date(timestamp);
      const windowEnd = new Date(timestamp + intervalMs);
      
      const groupA = this.filterMetricsByWindow(testId, 'A', {
        start: windowStart,
        end: windowEnd,
        interval
      });
      
      const groupB = this.filterMetricsByWindow(testId, 'B', {
        start: windowStart,
        end: windowEnd,
        interval
      });
      
      timeSeries.push({
        timestamp: windowStart,
        group_a: groupA || {},
        group_b: groupB || {}
      });
    }
    
    return timeSeries;
  }

  /**
   * Export metrics to CSV format
   */
  exportMetricsToCsv(testId: string): string {
    const callMetrics = this.callMetrics.get(testId) || [];
    
    const headers = [
      'call_id',
      'test_id',
      'lead_id',
      'group',
      'outcome',
      'duration',
      'attempt_number',
      'timestamp',
      'spam_score',
      'spam_labels'
    ];
    
    const rows = callMetrics.map(metric => [
      metric.call_id,
      metric.test_id,
      metric.lead_id,
      metric.group,
      metric.outcome,
      metric.duration,
      metric.attempt_number,
      metric.timestamp.toISOString(),
      metric.spam_score || '',
      (metric.spam_labels || []).join(';')
    ]);
    
    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }

  /**
   * Update aggregated metrics
   */
  private updateAggregatedMetrics(testId: string): void {
    // Update overall metrics
    this.updateAggregatedMetricsForGroup(testId, undefined);
    
    // Update group A metrics
    this.updateAggregatedMetricsForGroup(testId, 'A');
    
    // Update group B metrics
    this.updateAggregatedMetricsForGroup(testId, 'B');
  }

  /**
   * Update aggregated metrics for a specific group
   */
  private updateAggregatedMetricsForGroup(
    testId: string,
    group?: 'A' | 'B'
  ): void {
    const callMetrics = this.callMetrics.get(testId) || [];
    const filteredMetrics = group 
      ? callMetrics.filter(m => m.group === group)
      : callMetrics;
    
    if (filteredMetrics.length === 0) {
      return;
    }
    
    const totalCalls = filteredMetrics.length;
    const answeredCalls = filteredMetrics.filter(m => m.outcome === 'answered').length;
    const failedCalls = filteredMetrics.filter(m => m.outcome === 'failed').length;
    const busyCalls = filteredMetrics.filter(m => m.outcome === 'busy').length;
    const rejectedCalls = filteredMetrics.filter(m => m.outcome === 'rejected').length;
    const voicemailCalls = filteredMetrics.filter(m => m.outcome === 'voicemail').length;
    const spamBlockedCalls = filteredMetrics.filter(m => m.outcome === 'spam_blocked').length;
    
    const answerRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
    const connectRate = totalCalls > 0 
      ? ((answeredCalls + voicemailCalls) / totalCalls) * 100 
      : 0;
    const spamBlockRate = totalCalls > 0 ? (spamBlockedCalls / totalCalls) * 100 : 0;
    
    const totalDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = answeredCalls > 0 
      ? filteredMetrics
          .filter(m => m.outcome === 'answered')
          .reduce((sum, m) => sum + m.duration, 0) / answeredCalls
      : 0;
    
    const spamFlags = filteredMetrics.filter(m => 
      m.spam_labels && m.spam_labels.length > 0
    ).length;
    
    const hangupRate = answeredCalls > 0
      ? (filteredMetrics.filter(m => m.outcome === 'answered' && m.duration < 10).length / answeredCalls) * 100
      : 0;
    
    const uniqueLeads = new Set(filteredMetrics.map(m => m.lead_id)).size;
    const uniqueAnsweredLeads = new Set(
      filteredMetrics.filter(m => m.outcome === 'answered').map(m => m.lead_id)
    ).size;
    
    const timestamps = filteredMetrics.map(m => m.timestamp);
    const timeWindowStart = new Date(Math.min(...timestamps.map(t => t.getTime())));
    const timeWindowEnd = new Date(Math.max(...timestamps.map(t => t.getTime())));
    
    const aggregated: AggregatedMetrics = {
      test_id: testId,
      group,
      total_calls: totalCalls,
      answered_calls: answeredCalls,
      failed_calls: failedCalls,
      busy_calls: busyCalls,
      rejected_calls: rejectedCalls,
      voicemail_calls: voicemailCalls,
      spam_blocked_calls: spamBlockedCalls,
      answer_rate: answerRate,
      connect_rate: connectRate,
      spam_block_rate: spamBlockRate,
      average_duration: averageDuration,
      total_duration: totalDuration,
      spam_flags: spamFlags,
      hangup_rate: hangupRate,
      leads_contacted: uniqueLeads,
      leads_answered: uniqueAnsweredLeads,
      callbacks_2h: 0, // Would be calculated from callback data
      callbacks_24h: 0, // Would be calculated from callback data
      time_window_start: timeWindowStart,
      time_window_end: timeWindowEnd,
      last_updated: new Date()
    };
    
    const key = this.getMetricsKey(testId, group);
    this.aggregatedMetrics.set(key, aggregated);
  }

  /**
   * Filter metrics by time window
   */
  private filterMetricsByWindow(
    testId: string,
    group?: 'A' | 'B',
    window?: MetricsWindow
  ): AggregatedMetrics | null {
    if (!window) {
      return this.getAggregatedMetrics(testId, group);
    }
    
    const callMetrics = this.callMetrics.get(testId) || [];
    const filteredMetrics = callMetrics.filter(m => {
      const matchesGroup = group ? m.group === group : true;
      const inWindow = m.timestamp >= window.start && m.timestamp <= window.end;
      return matchesGroup && inWindow;
    });
    
    if (filteredMetrics.length === 0) {
      return null;
    }
    
    // Create temporary test ID for this window
    const tempTestId = `${testId}_${window.start.getTime()}_${window.end.getTime()}`;
    this.callMetrics.set(tempTestId, filteredMetrics.map(m => ({ ...m, test_id: tempTestId })));
    this.updateAggregatedMetricsForGroup(tempTestId, group);
    
    const result = this.aggregatedMetrics.get(this.getMetricsKey(tempTestId, group));
    
    // Clean up temporary data
    this.callMetrics.delete(tempTestId);
    this.aggregatedMetrics.delete(this.getMetricsKey(tempTestId, group));
    
    return result || null;
  }

  /**
   * Calculate differences between groups
   */
  private calculateDifferences(groupA: AggregatedMetrics, groupB: AggregatedMetrics): ComparisonMetrics['differences'] {
    const answerRateDiff = groupA.answer_rate - groupB.answer_rate;
    const answerRateDiffPct = groupB.answer_rate > 0 
      ? (answerRateDiff / groupB.answer_rate) * 100 
      : 0;
    
    const connectRateDiff = groupA.connect_rate - groupB.connect_rate;
    const spamBlockRateDiff = groupA.spam_block_rate - groupB.spam_block_rate;
    const averageDurationDiff = groupA.average_duration - groupB.average_duration;
    
    // Simple statistical significance check (chi-square test would be more accurate)
    const minSampleSize = 30;
    const statisticalSignificance = 
      groupA.total_calls >= minSampleSize &&
      groupB.total_calls >= minSampleSize &&
      Math.abs(answerRateDiffPct) >= 10; // 10% difference threshold
    
    const confidenceLevel = statisticalSignificance ? 95 : 0;
    
    return {
      answer_rate_diff: answerRateDiff,
      answer_rate_diff_pct: answerRateDiffPct,
      connect_rate_diff: connectRateDiff,
      spam_block_rate_diff: spamBlockRateDiff,
      average_duration_diff: averageDurationDiff,
      statistical_significance: statisticalSignificance,
      confidence_level: confidenceLevel
    };
  }

  /**
   * Determine winner based on differences
   */
  private determineWinner(differences: ComparisonMetrics['differences']): 'A' | 'B' | 'tie' {
    if (!differences.statistical_significance) {
      return 'tie';
    }
    
    if (Math.abs(differences.answer_rate_diff_pct) < 5) {
      return 'tie';
    }
    
    return differences.answer_rate_diff > 0 ? 'A' : 'B';
  }

  /**
   * Generate recommendation based on comparison
   */
  private generateRecommendation(
    differences: ComparisonMetrics['differences'],
    winner: 'A' | 'B' | 'tie'
  ): string {
    if (!differences.statistical_significance) {
      return 'Continue test to reach statistical significance (minimum 30 calls per group)';
    }
    
    if (winner === 'tie') {
      return 'No significant difference between groups. Consider test inconclusive.';
    }
    
    const improvement = Math.abs(differences.answer_rate_diff_pct).toFixed(1);
    return `Group ${winner} shows ${improvement}% improvement in answer rate. Consider adopting Group ${winner} strategy.`;
  }

  /**
   * Calculate current rate (calls per hour)
   */
  private calculateCurrentRate(testId: string): number {
    const callMetrics = this.callMetrics.get(testId) || [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCalls = callMetrics.filter(m => m.timestamp >= oneHourAgo);
    return recentCalls.length;
  }

  /**
   * Get metrics key for storage
   */
  private getMetricsKey(testId: string, group?: 'A' | 'B'): string {
    return group ? `${testId}_${group}` : testId;
  }

  /**
   * Clear metrics for a test
   */
  clearMetrics(testId: string): void {
    this.callMetrics.delete(testId);
    this.aggregatedMetrics.delete(testId);
    this.aggregatedMetrics.delete(`${testId}_A`);
    this.aggregatedMetrics.delete(`${testId}_B`);
  }

  /**
   * Get all test IDs
   */
  getAllTestIds(): string[] {
    return Array.from(this.callMetrics.keys());
  }
}

