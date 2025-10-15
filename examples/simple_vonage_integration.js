/**
 * Simple Vonage A/B Caller Integration
 * 
 * Ejemplo de integración simple con N8N webhook para llamadas A/B.
 * Solo maneja login inicial y llamada al webhook de N8N.
 */

class SimpleVonageABCaller {
  constructor(n8nWebhookUrl, apiKey) {
    this.n8nWebhookUrl = n8nWebhookUrl
    this.apiKey = apiKey
  }

  /**
   * Hacer login inicial para autenticación
   */
  async login() {
    try {
      const response = await fetch(`${this.n8nWebhookUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          action: 'login',
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`)
      }

      const result = await response.json()
      return { success: result.success || true }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    }
  }

  /**
   * Hacer llamada A/B usando webhook de N8N
   */
  async makeABCall({ destinationNumber, derivationId, originNumber, group, testId, leadId }) {
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
        destinationNumber,
        derivationId,
        originNumber,
        group,
        testId,
        leadId,
        timestamp: new Date().toISOString()
      }

      // 3. Llamar al webhook de N8N
      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
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
          group,
          derivationId,
          destinationNumber,
          originNumber,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Call failed'
      }
    }
  }

  /**
   * Hacer múltiples llamadas A/B (batch)
   */
  async makeBatchABCalls(requests) {
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

// Ejemplo de uso
async function ejemploUso() {
  // Configuración
  const n8nWebhookUrl = 'https://n8n.test.kanguro.com/webhook/ab-test-call'
  const apiKey = 'tu_api_key_aqui'

  // Crear instancia
  const caller = new SimpleVonageABCaller(n8nWebhookUrl, apiKey)

  // Ejemplo 1: Llamada individual A/B
  const resultadoIndividual = await caller.makeABCall({
    destinationNumber: '34661216995',
    derivationId: 'mobile-derivation-001', // Para Group A (mobile)
    originNumber: '34604579589',
    group: 'A',
    testId: 'test_123',
    leadId: 'lead_456'
  })

  console.log('Resultado individual:', resultadoIndividual)

  // Ejemplo 2: Llamadas batch A/B
  const requests = [
    {
      destinationNumber: '34661216995',
      derivationId: 'mobile-derivation-001', // Group A
      originNumber: '34604579589',
      group: 'A',
      testId: 'test_123',
      leadId: 'lead_456'
    },
    {
      destinationNumber: '34661216995',
      derivationId: 'landline-derivation-002', // Group B
      originNumber: '34604579589',
      group: 'B',
      testId: 'test_123',
      leadId: 'lead_456'
    }
  ]

  const resultadosBatch = await caller.makeBatchABCalls(requests)
  console.log('Resultados batch:', resultadosBatch)
}

// Ejemplo de configuración A/B
const configuracionesAB = {
  groupA: {
    derivationId: 'mobile-derivation-001',
    originNumber: '34604579589',
    strategy: 'mobile-first'
  },
  groupB: {
    derivationId: 'landline-derivation-002',
    originNumber: '34604579589',
    strategy: 'landline-focused'
  }
}

// Función para hacer llamada A/B parametrizada
async function llamadaABParametrizada(destinationNumber, group, testId, leadId) {
  const caller = new SimpleVonageABCaller(
    'https://n8n.test.kanguro.com/webhook/ab-test-call',
    'tu_api_key_aqui'
  )

  const config = group === 'A' ? configuracionesAB.groupA : configuracionesAB.groupB

  return await caller.makeABCall({
    destinationNumber,
    derivationId: config.derivationId,
    originNumber: config.originNumber,
    group,
    testId,
    leadId
  })
}

// Exportar para uso en otros módulos
module.exports = {
  SimpleVonageABCaller,
  configuracionesAB,
  llamadaABParametrizada
}

// Ejecutar ejemplo si es el archivo principal
if (require.main === module) {
  ejemploUso().catch(console.error)
}
