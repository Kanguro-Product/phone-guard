/**
 * Spam Checker Provider Interface
 * 
 * Defines the contract for spam checking services that can be integrated
 * with the A/B Caller Tool to provide real-time spam detection and scoring.
 */

export type SpamSignal = {
  score?: number;                // e.g., spam/risk score (configurable field)
  labels?: string[];             // tags/reasons
  telemetry?: Record<string, any>;
  raw?: any;
};

export type SpamCheckContext = "cli" | "lead" | "wave";

export type SpamCheckInput = {
  context: SpamCheckContext;
  cli?: string;
  lead_id?: string;
  phone?: string;
  window?: {
    horizon: string;
    granularity: string;
  };
  fields?: string[];
};

export type SpamCheckResult = {
  signal: SpamSignal;
  action: "ok" | "block" | "slow" | "warn";
  reason?: string;
  metadata?: Record<string, any>;
};

/**
 * Interface for spam checking providers
 * 
 * This interface allows the A/B Caller Tool to integrate with different
 * spam detection systems, including internal APIs, libraries, or event buses.
 */
export interface SpamCheckerProvider {
  /**
   * Evaluate spam risk for a given context
   * 
   * @param input - Evaluation context and parameters
   * @returns Promise resolving to spam signal and recommended action
   */
  evaluate(input: SpamCheckInput): Promise<SpamCheckResult>;

  /**
   * Check if the provider is available and healthy
   * 
   * @returns Promise resolving to health status
   */
  healthCheck(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
  }>;

  /**
   * Get provider configuration and capabilities
   * 
   * @returns Provider metadata and supported features
   */
  getCapabilities(): {
    supportedContexts: SpamCheckContext[];
    supportedFields: string[];
    maxWindowHorizon: string;
    minWindowGranularity: string;
  };
}

/**
 * Spam checker configuration
 */
export type SpamCheckerConfig = {
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

/**
 * Quality gate result
 */
export type QualityGateResult = {
  allowed: boolean;
  action: "ok" | "block" | "slow" | "warn";
  reason?: string;
  score?: number;
  labels?: string[];
  metadata?: Record<string, any>;
};

