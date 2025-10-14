/**
 * Vonage Voice Adapter
 * 
 * Implements voice calling using Vonage Voice API through VAPI adapter.
 * Provides outbound calling capabilities for A/B Caller Tool.
 */

import { VoiceProvider, VoiceCallRequest, VoiceCallResponse, VoiceCallEvent } from './voice_provider';

export class VonageVoiceAdapter implements VoiceProvider {
  private apiKey: string;
  private apiSecret: string;
  private applicationId: string;
  private privateKey: string;
  private baseUrl: string;

  constructor(config: {
    apiKey: string;
    apiSecret: string;
    applicationId: string;
    privateKey: string;
    baseUrl?: string;
  }) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.applicationId = config.applicationId;
    this.privateKey = config.privateKey;
    this.baseUrl = config.baseUrl || 'https://api.nexmo.com';
  }

  /**
   * Make an outbound call using Vonage Voice API
   */
  async makeCall(request: VoiceCallRequest): Promise<VoiceCallResponse> {
    try {
      const callData = {
        to: [{ type: 'phone', number: request.to }],
        from: { type: 'phone', number: request.from },
        ncco: request.ncco,
        timeout: request.timeout || 30,
        machine_detection: request.machineDetection || 'continue',
        ring_timeout: request.ringTimeout || 30,
        answer_timeout: request.answerTimeout || 30
      };

      const response = await fetch(`${this.baseUrl}/v1/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getJwtToken()}`
        },
        body: JSON.stringify(callData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vonage API error: ${errorData.error_text || response.statusText}`);
      }

      const result = await response.json();
      
      return {
        callId: result.uuid,
        status: 'started',
        metadata: {
          provider: 'vonage',
          api_response: result
        }
      };
    } catch (error) {
      console.error('Vonage call failed:', error);
      return {
        callId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          provider: 'vonage',
          error: true
        }
      };
    }
  }

  /**
   * Get call status from Vonage
   */
  async getCallStatus(callId: string): Promise<VoiceCallResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/calls/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getJwtToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get call status: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        callId: result.uuid,
        status: this.mapVonageStatus(result.status),
        duration: result.duration,
        cost: result.cost,
        metadata: {
          provider: 'vonage',
          vonage_status: result.status,
          start_time: result.start_time,
          end_time: result.end_time
        }
      };
    } catch (error) {
      console.error('Failed to get call status:', error);
      return {
        callId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          provider: 'vonage',
          error: true
        }
      };
    }
  }

  /**
   * Hang up a call
   */
  async hangupCall(callId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/calls/${callId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getJwtToken()}`
        },
        body: JSON.stringify({ action: 'hangup' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to hangup call: ${errorData.error_text || response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to hangup call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Health check for Vonage API
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Test API connectivity by getting account balance
      const response = await fetch(`${this.baseUrl}/v1/account/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getJwtToken()}`
        }
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          healthy: false,
          latency,
          error: `API error: ${response.statusText}`
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
    supportedFeatures: string[];
    maxCallDuration: number;
    supportedCountries: string[];
    webhookSupport: boolean;
  } {
    return {
      supportedFeatures: [
        'outbound_calls',
        'machine_detection',
        'call_recording',
        'dtmf_input',
        'text_to_speech',
        'call_transfer'
      ],
      maxCallDuration: 7200, // 2 hours
      supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'AU', 'JP', 'BR'],
      webhookSupport: true
    };
  }

  /**
   * Generate JWT token for Vonage API authentication
   */
  private async getJwtToken(): Promise<string> {
    // This is a simplified JWT generation
    // In production, you should use a proper JWT library
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const payload = {
      iss: this.apiKey,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      application_id: this.applicationId
    };

    // For now, return a placeholder token
    // In production, implement proper JWT signing with the private key
    return 'placeholder_jwt_token';
  }

  /**
   * Map Vonage status to our internal status
   */
  private mapVonageStatus(vonageStatus: string): VoiceCallResponse['status'] {
    const statusMap: Record<string, VoiceCallResponse['status']> = {
      'started': 'started',
      'ringing': 'ringing',
      'answered': 'answered',
      'completed': 'completed',
      'failed': 'failed',
      'rejected': 'rejected',
      'timeout': 'timeout',
      'busy': 'busy',
      'unanswered': 'unanswered'
    };

    return statusMap[vonageStatus] || 'failed';
  }

  /**
   * Create NCCO for A/B test call
   */
  createNccoForTest(config: {
    group: 'A' | 'B';
    script: string;
    voice?: string;
    language?: string;
    attemptNumber: number;
    maxAttempts: number;
  }): any[] {
    const ncco = [
      {
        action: 'talk',
        text: config.script,
        voiceName: config.voice || 'Amy',
        language: config.language || 'en-US'
      }
    ];

    // Add attempt-specific logic
    if (config.attemptNumber === config.maxAttempts) {
      // Last attempt - add voicemail message
      ncco.push({
        action: 'talk',
        text: 'This is your final attempt. Please leave a message after the beep.',
        voiceName: config.voice || 'Amy',
        language: config.language || 'en-US'
      });
    }

    return ncco;
  }

  /**
   * Create NCCO for voicemail detection
   */
  createVoicemailNcco(config: {
    script: string;
    voice?: string;
    language?: string;
  }): any[] {
    return [
      {
        action: 'talk',
        text: config.script,
        voiceName: config.voice || 'Amy',
        language: config.language || 'en-US'
      },
      {
        action: 'record',
        eventUrl: [`${process.env.WEBHOOK_BASE_URL}/webhooks/voice/recording`],
        endOnSilence: 3,
        endOnKey: '#',
        timeOut: 10
      }
    ];
  }
}

