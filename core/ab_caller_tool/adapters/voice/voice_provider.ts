/**
 * Voice Provider Interface
 * 
 * Defines the contract for voice calling services that can be integrated
 * with the A/B Caller Tool to make outbound calls.
 */

export type VoiceCallRequest = {
  to: string;
  from: string;
  ncco: any[];
  timeout?: number;
  machineDetection?: 'continue' | 'hangup';
  ringTimeout?: number;
  answerTimeout?: number;
};

export type VoiceCallResponse = {
  callId: string;
  status: 'started' | 'ringing' | 'answered' | 'completed' | 'failed' | 'rejected' | 'timeout' | 'busy' | 'unanswered';
  duration?: number;
  cost?: number;
  error?: string;
  metadata?: Record<string, any>;
};

export type VoiceCallEvent = {
  callId: string;
  event: 'started' | 'ringing' | 'answered' | 'completed' | 'failed' | 'rejected' | 'timeout' | 'busy' | 'unanswered';
  timestamp: string;
  duration?: number;
  metadata?: Record<string, any>;
};

/**
 * Interface for voice calling providers
 */
export interface VoiceProvider {
  /**
   * Make an outbound call
   * 
   * @param request - Call request parameters
   * @returns Promise resolving to call response
   */
  makeCall(request: VoiceCallRequest): Promise<VoiceCallResponse>;

  /**
   * Get call status
   * 
   * @param callId - Call identifier
   * @returns Promise resolving to call status
   */
  getCallStatus(callId: string): Promise<VoiceCallResponse>;

  /**
   * Hang up a call
   * 
   * @param callId - Call identifier
   * @returns Promise resolving to hangup result
   */
  hangupCall(callId: string): Promise<{ success: boolean; error?: string }>;

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
    supportedFeatures: string[];
    maxCallDuration: number;
    supportedCountries: string[];
    webhookSupport: boolean;
  };
}

