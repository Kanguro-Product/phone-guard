/**
 * Simple Vonage A/B Caller Service
 * 
 * Integración simple con N8N webhook para llamadas A/B usando derivationId.
 * Solo maneja login inicial y llamada al webhook de N8N.
 */

export interface SimpleCallRequest {
  destinationNumber: string
  derivationId: string
  originNumber: string
  group: 'A' | 'B'
  testId?: string
  leadId?: string
}

export interface SimpleCallResponse {
  success: boolean
  callId?: string
  error?: string
  metadata?: {
    group: 'A' | 'B'
    derivationId: string
    destinationNumber: string
    originNumber: string
    timestamp: string
  }
}

export class SimpleVonageCallerService {
  private n8nWebhookUrl: string

  constructor(n8nWebhookUrl: string) {
    this.n8nWebhookUrl = n8nWebhookUrl
  }

  /**
   * Hacer login inicial para autenticación (simplificado)
   */
  async login(): Promise<{ success: boolean; error?: string }> {
    // Para N8N webhooks simples, no necesitamos login
    return { success: true }
  }

  /**
   * Hacer llamada A/B usando webhook de N8N
   */
  async makeABCall(request: SimpleCallRequest): Promise<SimpleCallResponse> {
    try {
      // 1. Login inicial
      const loginResult = await this.login()
      if (!loginResult.success) {
        return {
          success: false,
          error: `Login failed: ${loginResult.error}`
        }
      }

      // 2. Construir payload para N8N
      const n8nPayload = {
        destinationNumber: request.destinationNumber,
        derivationId: request.derivationId,
        originNumber: request.originNumber,
        group: request.group,
        testId: request.testId,
        leadId: request.leadId,
        timestamp: new Date().toISOString()
      }

      // 3. Llamar al webhook de N8N
      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(n8nPayload)
      })

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        success: result.success || true,
        callId: result.callId,
        metadata: {
          group: request.group,
          derivationId: request.derivationId,
          destinationNumber: request.destinationNumber,
          originNumber: request.originNumber,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Call failed'
      }
    }
  }

  /**
   * Hacer múltiples llamadas A/B (batch)
   */
  async makeBatchABCalls(requests: SimpleCallRequest[]): Promise<SimpleCallResponse[]> {
    // Login inicial una sola vez
    const loginResult = await this.login()
    if (!loginResult.success) {
      return requests.map(() => ({
        success: false,
        error: `Login failed: ${loginResult.error}`
      }))
    }

    // Procesar llamadas en paralelo
    const promises = requests.map(request => this.makeABCall(request))
    return Promise.all(promises)
  }
}
