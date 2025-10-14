/**
 * Email Provider Interface
 * 
 * Defines the contract for email services that can be integrated
 * with the A/B Caller Tool to send transactional emails.
 */

export type EmailMessageRequest = {
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
};

export type EmailMessageResponse = {
  messageId: string;
  status: 'sent' | 'delivered' | 'bounced' | 'failed';
  timestamp: string;
  error?: string;
  metadata?: Record<string, any>;
};

export type EmailWebhookEvent = {
  id: string;
  timestamp: string;
  type: 'sent' | 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked';
  to: string;
  from: string;
  subject: string;
  metadata?: Record<string, any>;
};

/**
 * Interface for email providers
 */
export interface EmailProvider {
  /**
   * Send an email message
   * 
   * @param request - Email request parameters
   * @returns Promise resolving to email response
   */
  sendEmail(request: EmailMessageRequest): Promise<EmailMessageResponse>;

  /**
   * Get email status
   * 
   * @param messageId - Message identifier
   * @returns Promise resolving to email status
   */
  getEmailStatus(messageId: string): Promise<EmailMessageResponse>;

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
  parseWebhookEvent(payload: any): EmailWebhookEvent;

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
    maxRecipients: number;
    supportedTemplates: string[];
    webhookSupport: boolean;
  };
}

