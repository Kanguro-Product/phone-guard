/**
 * Quality Gate
 * 
 * Applies spam checker and business rules before making calls or launching waves.
 * This is the core component that integrates spam detection with A/B testing logic.
 */

import { SpamCheckerProvider, SpamCheckInput, QualityGateResult } from '../adapters/spam_checker/spam_checker_provider';

export type QualityGateConfig = {
  spam_checker: {
    enabled: boolean;
    policy: "pre_call_gate" | "pre_wave_gate" | "post_event_eval" | "mixed";
    signal_source: "internal_api" | "lib" | "event_bus";
    scoring_field: string;
    labels_field: string;
    thresholds: {
      block_above: number;
      slow_above: number;
      warn_above: number;
    };
    windowing: {
      horizon: string;
      granularity: string;
    };
    actions: {
      block: "skip_call" | "pause_cli" | "reassign" | "queue_review";
      slow: "downshift_rate" | "notify";
      warn: "log_only" | "notify";
    };
    telemetry_fields: string[];
  };
};

export type QualityGateInput = {
  context: "cli" | "lead" | "wave";
  cli?: string;
  lead_id?: string;
  phone?: string;
  test_id?: string;
  wave_id?: string;
};

export class QualityGate {
  private spamChecker: SpamCheckerProvider;
  private config: QualityGateConfig;

  constructor(spamChecker: SpamCheckerProvider, config: QualityGateConfig) {
    this.spamChecker = spamChecker;
    this.config = config;
  }

  /**
   * Evaluate if a call should be allowed based on spam detection and business rules
   */
  async evaluateCall(input: QualityGateInput): Promise<QualityGateResult> {
    if (!this.config.spam_checker.enabled) {
      return {
        allowed: true,
        action: "ok",
        reason: "Spam checker disabled"
      };
    }

    try {
      // Determine evaluation policy
      const shouldEvaluate = this.shouldEvaluate(input.context);
      
      if (!shouldEvaluate) {
        return {
          allowed: true,
          action: "ok",
          reason: "No evaluation required for this context"
        };
      }

      // Prepare spam check input
      const spamCheckInput: SpamCheckInput = {
        context: input.context,
        cli: input.cli,
        lead_id: input.lead_id,
        phone: input.phone,
        window: this.config.spam_checker.windowing,
        fields: this.config.spam_checker.telemetry_fields
      };

      // Get spam signal
      const spamResult = await this.spamChecker.evaluate(spamCheckInput);
      
      // Apply business rules
      const result = this.applyBusinessRules(spamResult, input);
      
      return result;
    } catch (error) {
      console.error('Quality gate evaluation failed:', error);
      
      // On error, allow the call but log the issue
      return {
        allowed: true,
        action: "ok",
        reason: "Quality gate error, allowing call",
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Evaluate if a wave should be launched based on spam detection
   */
  async evaluateWave(input: QualityGateInput): Promise<QualityGateResult> {
    if (!this.config.spam_checker.enabled) {
      return {
        allowed: true,
        action: "ok",
        reason: "Spam checker disabled"
      };
    }

    try {
      // For wave evaluation, we check at the wave level
      const spamCheckInput: SpamCheckInput = {
        context: "wave",
        window: this.config.spam_checker.windowing,
        fields: this.config.spam_checker.telemetry_fields
      };

      const spamResult = await this.spamChecker.evaluate(spamCheckInput);
      const result = this.applyBusinessRules(spamResult, input);
      
      return result;
    } catch (error) {
      console.error('Quality gate wave evaluation failed:', error);
      
      return {
        allowed: true,
        action: "ok",
        reason: "Quality gate error, allowing wave",
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Determine if evaluation should be performed based on policy
   */
  private shouldEvaluate(context: "cli" | "lead" | "wave"): boolean {
    const { policy } = this.config.spam_checker;

    switch (policy) {
      case "pre_call_gate":
        return context === "lead" || context === "cli";
      case "pre_wave_gate":
        return context === "wave";
      case "post_event_eval":
        return false; // This would be handled after the call
      case "mixed":
        return true; // Evaluate all contexts
      default:
        return false;
    }
  }

  /**
   * Apply business rules based on spam checker results
   */
  private applyBusinessRules(
    spamResult: any,
    input: QualityGateInput
  ): QualityGateResult {
    const { action } = spamResult;
    const { actions } = this.config.spam_checker;

    switch (action) {
      case "block":
        return this.handleBlockAction(spamResult, input);
      case "slow":
        return this.handleSlowAction(spamResult, input);
      case "warn":
        return this.handleWarnAction(spamResult, input);
      default:
        return {
          allowed: true,
          action: "ok",
          reason: spamResult.reason || "No issues detected",
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: spamResult.metadata
        };
    }
  }

  /**
   * Handle block action
   */
  private handleBlockAction(
    spamResult: any,
    input: QualityGateInput
  ): QualityGateResult {
    const { actions } = this.config.spam_checker;
    const blockAction = actions.block;

    switch (blockAction) {
      case "skip_call":
        return {
          allowed: false,
          action: "block",
          reason: `Call blocked: ${spamResult.reason}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: {
            ...spamResult.metadata,
            block_reason: "spam_detected",
            block_action: "skip_call"
          }
        };
      
      case "pause_cli":
        return {
          allowed: false,
          action: "block",
          reason: `CLI paused: ${spamResult.reason}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: {
            ...spamResult.metadata,
            block_reason: "spam_detected",
            block_action: "pause_cli",
            cli: input.cli
          }
        };
      
      case "reassign":
        return {
          allowed: false,
          action: "block",
          reason: `Call reassigned: ${spamResult.reason}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: {
            ...spamResult.metadata,
            block_reason: "spam_detected",
            block_action: "reassign"
          }
        };
      
      case "queue_review":
        return {
          allowed: false,
          action: "block",
          reason: `Call queued for review: ${spamResult.reason}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: {
            ...spamResult.metadata,
            block_reason: "spam_detected",
            block_action: "queue_review"
          }
        };
      
      default:
        return {
          allowed: false,
          action: "block",
          reason: `Unknown block action: ${blockAction}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: spamResult.metadata
        };
    }
  }

  /**
   * Handle slow action
   */
  private handleSlowAction(
    spamResult: any,
    input: QualityGateInput
  ): QualityGateResult {
    const { actions } = this.config.spam_checker;
    const slowAction = actions.slow;

    switch (slowAction) {
      case "downshift_rate":
        return {
          allowed: true,
          action: "slow",
          reason: `Rate downshifted: ${spamResult.reason}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: {
            ...spamResult.metadata,
            slow_reason: "spam_detected",
            slow_action: "downshift_rate"
          }
        };
      
      case "notify":
        return {
          allowed: true,
          action: "slow",
          reason: `Notification sent: ${spamResult.reason}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: {
            ...spamResult.metadata,
            slow_reason: "spam_detected",
            slow_action: "notify"
          }
        };
      
      default:
        return {
          allowed: true,
          action: "slow",
          reason: `Unknown slow action: ${slowAction}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: spamResult.metadata
        };
    }
  }

  /**
   * Handle warn action
   */
  private handleWarnAction(
    spamResult: any,
    input: QualityGateInput
  ): QualityGateResult {
    const { actions } = this.config.spam_checker;
    const warnAction = actions.warn;

    switch (warnAction) {
      case "log_only":
        return {
          allowed: true,
          action: "warn",
          reason: `Warning logged: ${spamResult.reason}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: {
            ...spamResult.metadata,
            warn_reason: "spam_detected",
            warn_action: "log_only"
          }
        };
      
      case "notify":
        return {
          allowed: true,
          action: "warn",
          reason: `Warning notification sent: ${spamResult.reason}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: {
            ...spamResult.metadata,
            warn_reason: "spam_detected",
            warn_action: "notify"
          }
        };
      
      default:
        return {
          allowed: true,
          action: "warn",
          reason: `Unknown warn action: ${warnAction}`,
          score: spamResult.signal?.score,
          labels: spamResult.signal?.labels,
          metadata: spamResult.metadata
        };
    }
  }

  /**
   * Get quality gate statistics
   */
  async getStatistics(): Promise<{
    total_evaluations: number;
    blocked_calls: number;
    slowed_calls: number;
    warned_calls: number;
    allowed_calls: number;
    error_rate: number;
  }> {
    // This would typically query a metrics database
    // For now, return mock data
    return {
      total_evaluations: 0,
      blocked_calls: 0,
      slowed_calls: 0,
      warned_calls: 0,
      allowed_calls: 0,
      error_rate: 0
    };
  }
}

