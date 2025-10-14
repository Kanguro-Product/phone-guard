/**
 * Meta WhatsApp Cloud API Adapter
 * 
 * Implements WhatsApp messaging using Meta WhatsApp Cloud API.
 * Provides outbound messaging capabilities for A/B Caller Tool.
 */

import { WhatsAppProvider, WhatsAppMessageRequest, WhatsAppMessageResponse, WhatsAppWebhookEvent } from './whatsapp_provider';
import crypto from 'crypto';

export class MetaWhatsAppCloudAdapter implements WhatsAppProvider {
  private accessToken: string;
  private phoneNumberId: string;
  private verifyToken: string;
  private appSecret: string;
  private graphVersion: string;
  private baseUrl: string;

  constructor(config: {
    accessToken: string;
    phoneNumberId: string;
    verifyToken: string;
    appSecret: string;
    graphVersion?: string;
    baseUrl?: string;
  }) {
    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
    this.verifyToken = config.verifyToken;
    this.appSecret = config.appSecret;
    this.graphVersion = config.graphVersion || 'v18.0';
    this.baseUrl = config.baseUrl || 'https://graph.facebook.com';
  }

  /**
   * Send a WhatsApp message using Meta Cloud API
   */
  async sendMessage(request: WhatsAppMessageRequest): Promise<WhatsAppMessageResponse> {
    try {
      const url = `${this.baseUrl}/${this.graphVersion}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: request.to,
        type: request.message.type,
        ...request.message
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Meta API error: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      return {
        messageId: result.messages[0].id,
        status: 'sent',
        timestamp: new Date().toISOString(),
        metadata: {
          provider: 'meta_whatsapp',
          api_response: result
        }
      };
    } catch (error) {
      console.error('Meta WhatsApp message failed:', error);
      return {
        messageId: '',
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          provider: 'meta_whatsapp',
          error: true
        }
      };
    }
  }

  /**
   * Get message status from Meta API
   */
  async getMessageStatus(messageId: string): Promise<WhatsAppMessageResponse> {
    try {
      const url = `${this.baseUrl}/${this.graphVersion}/${messageId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get message status: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        messageId: result.id,
        status: this.mapMetaStatus(result.status),
        timestamp: result.timestamp,
        metadata: {
          provider: 'meta_whatsapp',
          meta_status: result.status
        }
      };
    } catch (error) {
      console.error('Failed to get message status:', error);
      return {
        messageId,
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          provider: 'meta_whatsapp',
          error: true
        }
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.appSecret)
        .update(payload)
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Parse webhook event from Meta
   */
  parseWebhookEvent(payload: any): WhatsAppWebhookEvent {
    try {
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (changes?.field !== 'messages') {
        throw new Error('Not a messages webhook');
      }

      // Handle message events
      if (value?.messages) {
        const message = value.messages[0];
        return {
          id: message.id,
          timestamp: message.timestamp,
          type: 'message',
          from: message.from,
          to: value.metadata?.phone_number_id,
          message: {
            id: message.id,
            type: message.type,
            text: message.text,
            button: message.button
          }
        };
      }

      // Handle status events
      if (value?.statuses) {
        const status = value.statuses[0];
        return {
          id: status.id,
          timestamp: status.timestamp,
          type: 'status',
          from: status.recipient_id,
          to: value.metadata?.phone_number_id,
          status: {
            id: status.id,
            status: status.status,
            timestamp: status.timestamp,
            recipient_id: status.recipient_id
          }
        };
      }

      throw new Error('Unknown webhook event type');
    } catch (error) {
      console.error('Failed to parse webhook event:', error);
      return {
        id: '',
        timestamp: new Date().toISOString(),
        type: 'error',
        from: '',
        to: '',
        error: {
          code: 400,
          title: 'Parse Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Health check for Meta API
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Test API connectivity by getting app info
      const url = `${this.baseUrl}/${this.graphVersion}/${this.phoneNumberId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
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
    maxMessageLength: number;
    supportedTemplates: string[];
    webhookSupport: boolean;
  } {
    return {
      supportedFeatures: [
        'text_messages',
        'template_messages',
        'interactive_messages',
        'media_messages',
        'button_messages',
        'list_messages',
        'location_messages',
        'contact_messages'
      ],
      maxMessageLength: 4096,
      supportedTemplates: [
        'text_template',
        'media_template',
        'interactive_template'
      ],
      webhookSupport: true
    };
  }

  /**
   * Map Meta status to our internal status
   */
  private mapMetaStatus(metaStatus: string): WhatsAppMessageResponse['status'] {
    const statusMap: Record<string, WhatsAppMessageResponse['status']> = {
      'sent': 'sent',
      'delivered': 'delivered',
      'read': 'read',
      'failed': 'failed'
    };

    return statusMap[metaStatus] || 'failed';
  }

  /**
   * Create text message for A/B test nudge
   */
  createTextMessage(config: {
    to: string;
    text: string;
  }): WhatsAppMessageRequest {
    return {
      to: config.to,
      message: {
        type: 'text',
        text: {
          body: config.text
        }
      }
    };
  }

  /**
   * Create template message for A/B test nudge
   */
  createTemplateMessage(config: {
    to: string;
    templateName: string;
    language: string;
    components?: any[];
  }): WhatsAppMessageRequest {
    return {
      to: config.to,
      message: {
        type: 'template',
        template: {
          name: config.templateName,
          language: {
            code: config.language
          },
          components: config.components || []
        }
      }
    };
  }

  /**
   * Create interactive button message for A/B test nudge
   */
  createButtonMessage(config: {
    to: string;
    headerText?: string;
    bodyText: string;
    footerText?: string;
    buttons: Array<{
      id: string;
      title: string;
    }>;
  }): WhatsAppMessageRequest {
    return {
      to: config.to,
      message: {
        type: 'interactive',
        interactive: {
          type: 'button',
          header: config.headerText ? {
            type: 'text',
            text: config.headerText
          } : undefined,
          body: {
            text: config.bodyText
          },
          footer: config.footerText ? {
            text: config.footerText
          } : undefined,
          action: {
            buttons: config.buttons.map(button => ({
              type: 'reply' as const,
              reply: {
                id: button.id,
                title: button.title
              }
            }))
          }
        }
      }
    };
  }
}

