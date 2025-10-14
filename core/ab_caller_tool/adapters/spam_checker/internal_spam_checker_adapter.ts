/**
 * Internal Spam Checker Adapter
 * 
 * Integrates with the existing Phone Guard spam validation system
 * to provide real-time spam detection for A/B Caller Tool.
 */

import { SpamCheckerProvider, SpamCheckInput, SpamCheckResult, SpamCheckContext } from './spam_checker_provider';
import { createClient } from '../../../../lib/supabase/server';

export class InternalSpamCheckerAdapter implements SpamCheckerProvider {
  private supabase: any;
  private config: any;

  constructor(config: any) {
    this.config = config;
    this.supabase = null; // Will be initialized when needed
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase;
  }

  /**
   * Evaluate spam risk using internal Phone Guard spam validation
   */
  async evaluate(input: SpamCheckInput): Promise<SpamCheckResult> {
    try {
      // Get spam data based on context
      const spamData = await this.getSpamData(input);
      
      if (!spamData) {
        return {
          signal: { score: 0, labels: [] },
          action: "ok",
          reason: "No spam data available"
        };
      }

      // Extract score and labels based on configuration
      const score = this.extractScore(spamData);
      const labels = this.extractLabels(spamData);
      
      // Determine action based on thresholds
      const action = this.determineAction(score);
      
      return {
        signal: {
          score,
          labels,
          telemetry: this.extractTelemetry(spamData),
          raw: spamData
        },
        action,
        reason: this.getActionReason(action, score, labels),
        metadata: {
          context: input.context,
          timestamp: new Date().toISOString(),
          source: 'internal_spam_checker'
        }
      };
    } catch (error) {
      console.error('Spam checker evaluation failed:', error);
      return {
        signal: { score: 0, labels: [] },
        action: "ok",
        reason: "Evaluation failed, allowing call"
      };
    }
  }

  /**
   * Get spam data from Phone Guard database
   */
  private async getSpamData(input: SpamCheckInput): Promise<any> {
    const { context, cli, lead_id, phone } = input;

    switch (context) {
      case 'cli':
        return await this.getCliSpamData(cli!);
      case 'lead':
        return await this.getLeadSpamData(lead_id!, phone!);
      case 'wave':
        return await this.getWaveSpamData();
      default:
        return null;
    }
  }

  /**
   * Get spam data for a specific CLI
   */
  private async getCliSpamData(cli: string): Promise<any> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('phone_numbers')
      .select(`
        id,
        number,
        reputation_score,
        spam_detected_by,
        spam_reason,
        hiya_score,
        hiya_label,
        numverify_score,
        openai_score,
        average_reputation_score,
        status,
        created_at,
        updated_at
      `)
      .eq('number', cli)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      cli: data.number,
      reputation_score: data.reputation_score,
      spam_detected_by: data.spam_detected_by,
      spam_reason: data.spam_reason,
      hiya_score: data.hiya_score,
      hiya_label: data.hiya_label,
      numverify_score: data.numverify_score,
      openai_score: data.openai_score,
      average_reputation_score: data.average_reputation_score,
      status: data.status
    };
  }

  /**
   * Get spam data for a specific lead
   */
  private async getLeadSpamData(lead_id: string, phone: string): Promise<any> {
    // Check if the phone number exists in our database
    const supabase = await this.getSupabase();
    const { data: phoneData, error: phoneError } = await supabase
      .from('phone_numbers')
      .select(`
        id,
        number,
        reputation_score,
        spam_detected_by,
        spam_reason,
        hiya_score,
        hiya_label,
        numverify_score,
        openai_score,
        average_reputation_score,
        status
      `)
      .eq('number', phone)
      .single();

    if (phoneError || !phoneData) {
      // Phone not in database, return neutral data
      return {
        lead_id,
        phone,
        reputation_score: 50, // Neutral score
        spam_detected_by: null,
        spam_reason: null,
        hiya_score: null,
        hiya_label: null,
        numverify_score: null,
        openai_score: null,
        average_reputation_score: 50,
        status: 'unknown'
      };
    }

    return {
      lead_id,
      phone: phoneData.number,
      reputation_score: phoneData.reputation_score,
      spam_detected_by: phoneData.spam_detected_by,
      spam_reason: phoneData.spam_reason,
      hiya_score: phoneData.hiya_score,
      hiya_label: phoneData.hiya_label,
      numverify_score: phoneData.numverify_score,
      openai_score: phoneData.openai_score,
      average_reputation_score: phoneData.average_reputation_score,
      status: phoneData.status
    };
  }

  /**
   * Get spam data for the current wave
   */
  private async getWaveSpamData(): Promise<any> {
    // Get recent spam events and statistics
    const supabase = await this.getSupabase();
    const { data: spamEvents, error } = await supabase
      .from('spam_events')
      .select(`
        id,
        phone_number,
        spam_detected_by,
        spam_reason,
        created_at
      `)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return null;
    }

    // Calculate wave-level metrics
    const totalEvents = spamEvents.length;
    const spamRate = totalEvents > 0 ? (spamEvents.filter(e => e.spam_detected_by).length / totalEvents) * 100 : 0;
    
    return {
      total_events: totalEvents,
      spam_rate: spamRate,
      recent_events: spamEvents.slice(0, 10),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Extract score from spam data based on configuration
   */
  private extractScore(spamData: any): number {
    const scoringField = this.config.scoring_field;
    
    switch (scoringField) {
      case 'reputation_score':
        return spamData.reputation_score || 50;
      case 'hiya_score':
        return spamData.hiya_score || 50;
      case 'numverify_score':
        return spamData.numverify_score || 50;
      case 'openai_score':
        return spamData.openai_score || 50;
      case 'average_reputation_score':
        return spamData.average_reputation_score || 50;
      case 'spam_rate':
        return spamData.spam_rate || 0;
      default:
        return 50; // Neutral score
    }
  }

  /**
   * Extract labels from spam data based on configuration
   */
  private extractLabels(spamData: any): string[] {
    const labelsField = this.config.labels_field;
    const labels: string[] = [];

    // Add spam detection labels
    if (spamData.spam_detected_by) {
      labels.push(`detected_by_${spamData.spam_detected_by}`);
    }

    if (spamData.spam_reason) {
      labels.push(`reason_${spamData.spam_reason}`);
    }

    if (spamData.hiya_label) {
      labels.push(`hiya_${spamData.hiya_label}`);
    }

    // Add status-based labels
    if (spamData.status) {
      labels.push(`status_${spamData.status}`);
    }

    return labels;
  }

  /**
   * Extract telemetry fields from spam data
   */
  private extractTelemetry(spamData: any): Record<string, any> {
    const telemetry: Record<string, any> = {};
    
    this.config.telemetry_fields.forEach(field => {
      if (spamData[field] !== undefined) {
        telemetry[field] = spamData[field];
      }
    });

    return telemetry;
  }

  /**
   * Determine action based on score and thresholds
   */
  private determineAction(score: number): "ok" | "block" | "slow" | "warn" {
    const { thresholds } = this.config;

    if (score >= thresholds.block_above) {
      return "block";
    } else if (score >= thresholds.slow_above) {
      return "slow";
    } else if (score >= thresholds.warn_above) {
      return "warn";
    } else {
      return "ok";
    }
  }

  /**
   * Get reason for the determined action
   */
  private getActionReason(action: string, score: number, labels: string[]): string {
    switch (action) {
      case "block":
        return `Score ${score} exceeds block threshold, labels: ${labels.join(', ')}`;
      case "slow":
        return `Score ${score} exceeds slow threshold, labels: ${labels.join(', ')}`;
      case "warn":
        return `Score ${score} exceeds warn threshold, labels: ${labels.join(', ')}`;
      default:
        return `Score ${score} within acceptable range`;
    }
  }

  /**
   * Health check for the spam checker
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      const supabase = await this.getSupabase();
      const { error } = await supabase
        .from('phone_numbers')
        .select('id')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        return {
          healthy: false,
          latency,
          error: error.message
        };
      }

      return {
        healthy: true,
        latency
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): {
    supportedContexts: SpamCheckContext[];
    supportedFields: string[];
    maxWindowHorizon: string;
    minWindowGranularity: string;
  } {
    return {
      supportedContexts: ['cli', 'lead', 'wave'],
      supportedFields: [
        'reputation_score',
        'spam_detected_by',
        'spam_reason',
        'hiya_score',
        'hiya_label',
        'numverify_score',
        'openai_score',
        'average_reputation_score',
        'status',
        'spam_rate'
      ],
      maxWindowHorizon: '24h',
      minWindowGranularity: '1m'
    };
  }
}

