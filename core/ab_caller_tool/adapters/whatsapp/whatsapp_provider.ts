/**
 * WhatsApp Provider Interface
 * 
 * Defines the contract for WhatsApp messaging services that can be integrated
 * with the A/B Caller Tool to send WhatsApp messages.
 */

export type WhatsAppMessageRequest = {
  to: string;
  message: {
    type: 'text' | 'template' | 'interactive';
    text?: {
      body: string;
    };
    template?: {
      name: string;
      language: {
        code: string;
      };
      components?: any[];
    };
    interactive?: {
      type: 'button' | 'list';
      header?: {
        type: 'text';
        text: string;
      };
      body: {
        text: string;
      };
      footer?: {
        text: string;
      };
      action: {
        buttons?: Array<{
          type: 'reply';
          reply: {
            id: string;
            title: string;
          };
        }>;
        sections?: Array<{
          title: string;
          rows: Array<{
            id: string;
            title: string;
            description?: string;
          }>;
        }>;
      };
    };
  };
};

export type WhatsAppMessageResponse = {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  error?: string;
  metadata?: Record<string, any>;
};

export type WhatsAppWebhookEvent = {
  id: string;
  timestamp: string;
  type: 'message' | 'status' | 'error';
  from: string;
  to: string;
  message?: {
    id: string;
    type: string;
    text?: {
      body: string;
    };
    button?: {
      text: string;
      payload: string;
    };
  };
  status?: {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
  };
  error?: {
    code: number;
    title: string;
    message: string;
  };
};

/**
 * Interface for WhatsApp messaging providers
 */
export interface WhatsAppProvider {
  /**
   * Send a WhatsApp message
   * 
   * @param request - Message request parameters
   * @returns Promise resolving to message response
   */
  sendMessage(request: WhatsAppMessageRequest): Promise<WhatsAppMessageResponse>;

  /**
   * Get message status
   * 
   * @param messageId - Message identifier
   * @returns Promise resolving to message status
   */
  getMessageStatus(messageId: string): Promise<WhatsAppMessageResponse>;

  /**
   * Verify webhook signature
   * 
   * @param payload - Webhook payload
   * @param signature - Webhook signature
   * @returns Whether signature is valid
   */
  verifyWebhookSignature(payload: string, signature: string): boolean;

  /**
   * Parse webhook event
   * 
   * @param payload - Webhook payload
   * @returns Parsed webhook event
   */
  parseWebhookEvent(payload: any): WhatsAppWebhookEvent;

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
    maxMessageLength: number;
    supportedTemplates: string[];
    webhookSupport: boolean;
  };
}

