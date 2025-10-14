/**
 * Transactional Email Adapter
 * 
 * Generic implementation for transactional email services (SendGrid, Resend, etc.)
 * Provides email capabilities for A/B Caller Tool nudges.
 */

import { EmailProvider, EmailMessageRequest, EmailMessageResponse, EmailWebhookEvent } from './email_provider';
import crypto from 'crypto';

export class TransactionalEmailAdapter implements EmailProvider {
  private apiKey: string;
  private apiEndpoint: string;
  private webhookSecret: string;
  private provider: 'sendgrid' | 'resend' | 'mailgun' | 'generic';

  constructor(config: {
    apiKey: string;
    apiEndpoint?: string;
    webhookSecret?: string;
    provider?: 'sendgrid' | 'resend' | 'mailgun' | 'generic';
  }) {
    this.apiKey = config.apiKey;
    this.apiEndpoint = config.apiEndpoint || this.getDefaultEndpoint(config.provider || 'generic');
    this.webhookSecret = config.webhookSecret || '';
    this.provider = config.provider || 'generic';
  }

  /**
   * Send an email message
   */
  async sendEmail(request: EmailMessageRequest): Promise<EmailMessageResponse> {
    try {
      const payload = this.buildPayload(request);
      const headers = this.buildHeaders();

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Email API error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      return {
        messageId: this.extractMessageId(result),
        status: 'sent',
        timestamp: new Date().toISOString(),
        metadata: {
          provider: this.provider,
          api_response: result
        }
      };
    } catch (error) {
      console.error('Email send failed:', error);
      return {
        messageId: '',
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          provider: this.provider,
          error: true
        }
      };
    }
  }

  /**
   * Get email status
   */
  async getEmailStatus(messageId: string): Promise<EmailMessageResponse> {
    try {
      // Most email providers don't provide a direct status endpoint
      // This would typically rely on webhook events
      return {
        messageId,
        status: 'sent',
        timestamp: new Date().toISOString(),
        metadata: {
          provider: this.provider,
          note: 'Status tracking via webhooks'
        }
      };
    } catch (error) {
      console.error('Failed to get email status:', error);
      return {
        messageId,
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          provider: this.provider,
          error: true
        }
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('No webhook secret configured, skipping verification');
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('base64');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): EmailWebhookEvent {
    try {
      // Parse based on provider format
      switch (this.provider) {
        case 'sendgrid':
          return this.parseSendGridWebhook(payload);
        case 'resend':
          return this.parseResendWebhook(payload);
        case 'mailgun':
          return this.parseMailgunWebhook(payload);
        default:
          return this.parseGenericWebhook(payload);
      }
    } catch (error) {
      console.error('Failed to parse webhook event:', error);
      return {
        id: '',
        timestamp: new Date().toISOString(),
        type: 'failed',
        to: '',
        from: '',
        subject: '',
        metadata: {
          error: true,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Test API connectivity with a lightweight request
      const response = await fetch(this.apiEndpoint, {
        method: 'HEAD',
        headers: this.buildHeaders()
      });

      const latency = Date.now() - startTime;

      return {
        healthy: response.ok,
        latency,
        error: response.ok ? undefined : `API returned ${response.status}`
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
    maxRecipients: number;
    supportedTemplates: string[];
    webhookSupport: boolean;
  } {
    return {
      supportedFeatures: [
        'html_emails',
        'text_emails',
        'templates',
        'attachments',
        'tracking',
        'webhooks'
      ],
      maxRecipients: 1000,
      supportedTemplates: ['transactional', 'marketing', 'notification'],
      webhookSupport: true
    };
  }

  /**
   * Build API payload based on provider
   */
  private buildPayload(request: EmailMessageRequest): any {
    switch (this.provider) {
      case 'sendgrid':
        return this.buildSendGridPayload(request);
      case 'resend':
        return this.buildResendPayload(request);
      case 'mailgun':
        return this.buildMailgunPayload(request);
      default:
        return this.buildGenericPayload(request);
    }
  }

  /**
   * Build headers
   */
  private buildHeaders(): HeadersInit {
    switch (this.provider) {
      case 'sendgrid':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        };
      case 'resend':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        };
      case 'mailgun':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`api:${this.apiKey}`).toString('base64')}`
        };
      default:
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        };
    }
  }

  /**
   * Get default endpoint for provider
   */
  private getDefaultEndpoint(provider: string): string {
    switch (provider) {
      case 'sendgrid':
        return 'https://api.sendgrid.com/v3/mail/send';
      case 'resend':
        return 'https://api.resend.com/emails';
      case 'mailgun':
        return 'https://api.mailgun.net/v3/messages';
      default:
        return 'https://api.example.com/send';
    }
  }

  /**
   * Extract message ID from response
   */
  private extractMessageId(result: any): string {
    switch (this.provider) {
      case 'sendgrid':
        return result.message_id || result['x-message-id'] || '';
      case 'resend':
        return result.id || '';
      case 'mailgun':
        return result.id || '';
      default:
        return result.id || result.messageId || '';
    }
  }

  /**
   * Build SendGrid payload
   */
  private buildSendGridPayload(request: EmailMessageRequest): any {
    return {
      personalizations: [{
        to: [{ email: request.to }],
        subject: request.subject
      }],
      from: { email: request.from },
      content: [
        { type: 'text/html', value: request.html || '' },
        { type: 'text/plain', value: request.text || '' }
      ].filter(c => c.value),
      template_id: request.templateId
    };
  }

  /**
   * Build Resend payload
   */
  private buildResendPayload(request: EmailMessageRequest): any {
    return {
      to: request.to,
      from: request.from,
      subject: request.subject,
      html: request.html,
      text: request.text,
      template_id: request.templateId,
      template_data: request.templateData
    };
  }

  /**
   * Build Mailgun payload
   */
  private buildMailgunPayload(request: EmailMessageRequest): any {
    return {
      to: request.to,
      from: request.from,
      subject: request.subject,
      html: request.html,
      text: request.text,
      template: request.templateId,
      'h:X-Mailgun-Variables': JSON.stringify(request.templateData || {})
    };
  }

  /**
   * Build generic payload
   */
  private buildGenericPayload(request: EmailMessageRequest): any {
    return {
      to: request.to,
      from: request.from,
      subject: request.subject,
      html: request.html,
      text: request.text,
      templateId: request.templateId,
      templateData: request.templateData,
      attachments: request.attachments
    };
  }

  /**
   * Parse SendGrid webhook
   */
  private parseSendGridWebhook(payload: any): EmailWebhookEvent {
    const event = Array.isArray(payload) ? payload[0] : payload;
    return {
      id: event.sg_message_id || '',
      timestamp: event.timestamp || new Date().toISOString(),
      type: this.mapSendGridEventType(event.event),
      to: event.email || '',
      from: event.from || '',
      subject: event.subject || '',
      metadata: event
    };
  }

  /**
   * Parse Resend webhook
   */
  private parseResendWebhook(payload: any): EmailWebhookEvent {
    return {
      id: payload.data?.email_id || '',
      timestamp: payload.created_at || new Date().toISOString(),
      type: this.mapResendEventType(payload.type),
      to: payload.data?.to || '',
      from: payload.data?.from || '',
      subject: payload.data?.subject || '',
      metadata: payload
    };
  }

  /**
   * Parse Mailgun webhook
   */
  private parseMailgunWebhook(payload: any): EmailWebhookEvent {
    return {
      id: payload['event-data']?.id || '',
      timestamp: payload['event-data']?.timestamp || new Date().toISOString(),
      type: this.mapMailgunEventType(payload['event-data']?.event),
      to: payload['event-data']?.recipient || '',
      from: payload['event-data']?.sender || '',
      subject: payload['event-data']?.subject || '',
      metadata: payload
    };
  }

  /**
   * Parse generic webhook
   */
  private parseGenericWebhook(payload: any): EmailWebhookEvent {
    return {
      id: payload.id || payload.messageId || '',
      timestamp: payload.timestamp || new Date().toISOString(),
      type: payload.type || payload.event || 'sent',
      to: payload.to || '',
      from: payload.from || '',
      subject: payload.subject || '',
      metadata: payload
    };
  }

  /**
   * Map SendGrid event type
   */
  private mapSendGridEventType(eventType: string): EmailWebhookEvent['type'] {
    const mapping: Record<string, EmailWebhookEvent['type']> = {
      'processed': 'sent',
      'delivered': 'delivered',
      'bounce': 'bounced',
      'dropped': 'failed',
      'open': 'opened',
      'click': 'clicked'
    };
    return mapping[eventType] || 'sent';
  }

  /**
   * Map Resend event type
   */
  private mapResendEventType(eventType: string): EmailWebhookEvent['type'] {
    const mapping: Record<string, EmailWebhookEvent['type']> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.bounced': 'bounced',
      'email.failed': 'failed',
      'email.opened': 'opened',
      'email.clicked': 'clicked'
    };
    return mapping[eventType] || 'sent';
  }

  /**
   * Map Mailgun event type
   */
  private mapMailgunEventType(eventType: string): EmailWebhookEvent['type'] {
    const mapping: Record<string, EmailWebhookEvent['type']> = {
      'accepted': 'sent',
      'delivered': 'delivered',
      'failed': 'failed',
      'bounced': 'bounced',
      'opened': 'opened',
      'clicked': 'clicked'
    };
    return mapping[eventType] || 'sent';
  }
}
