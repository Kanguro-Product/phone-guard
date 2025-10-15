/**
 * Vonage A/B Caller Service
 * 
 * Service for making A/B test calls using Vonage Voice API with derivationId.
 * Integrates with the existing Phone Guard system and A/B Caller Tool.
 */

import { createClient } from '@/lib/supabase/server'

export interface ABCallRequest {
  testId: string
  leadId: string
  destinationNumber: string
  group: 'A' | 'B'
  derivationId: string
  originNumber: string
  apiKey: string
  userId: string
}

export interface ABCallResponse {
  success: boolean
  callId?: string
  error?: string
  metadata?: {
    testId: string
    leadId: string
    group: 'A' | 'B'
    derivationId: string
    originNumber: string
    destinationNumber: string
    timestamp: string
  }
}

export interface VonageCallPayload {
  to: Array<{
    type: 'phone'
    number: string
  }>
  from: {
    type: 'phone'
    number: string
  }
  ncco: Array<{
    action: 'connect'
    endpoint: Array<{
      type: 'sip'
      uri: string
    }>
    eventUrl: string[]
  }>
}

export class VonageABCallerService {
  private supabase: any
  private vonageApiUrl = 'https://api.nexmo.com/v1/calls'

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Make an A/B test call using Vonage Voice API with derivationId
   */
  async makeABCall(request: ABCallRequest): Promise<ABCallResponse> {
    try {
      // Validate request
      const validation = await this.validateRequest(request)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Get test configuration
      const testConfig = await this.getTestConfiguration(request.testId, request.userId)
      if (!testConfig) {
        return {
          success: false,
          error: 'Test configuration not found'
        }
      }

      // Build Vonage call payload
      const callPayload = this.buildCallPayload(request, testConfig)

      // Make the call to Vonage API
      const vonageResponse = await this.callVonageAPI(callPayload, request.apiKey)

      if (!vonageResponse.success) {
        return {
          success: false,
          error: vonageResponse.error
        }
      }

      // Log the call attempt
      await this.logCallAttempt(request, vonageResponse.callId, 'started')

      return {
        success: true,
        callId: vonageResponse.callId,
        metadata: {
          testId: request.testId,
          leadId: request.leadId,
          group: request.group,
          derivationId: request.derivationId,
          originNumber: request.originNumber,
          destinationNumber: request.destinationNumber,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('AB Call error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Build Vonage call payload with derivationId
   */
  private buildCallPayload(request: ABCallRequest, testConfig: any): VonageCallPayload {
    const sipUri = `sip:${request.derivationId}@kanguro-derivations.sip-eu.vonage.com`
    const eventUrl = `https://api.test.kanguro.com/api/v1/callBot/callback/${request.derivationId}?api-key=${request.apiKey}`

    return {
      to: [{
        type: 'phone',
        number: request.destinationNumber
      }],
      from: {
        type: 'phone',
        number: request.originNumber
      },
      ncco: [{
        action: 'connect',
        endpoint: [{
          type: 'sip',
          uri: sipUri
        }],
        eventUrl: [eventUrl]
      }]
    }
  }

  /**
   * Call Vonage Voice API
   */
  private async callVonageAPI(payload: VonageCallPayload, apiKey: string): Promise<{ success: boolean; callId?: string; error?: string }> {
    try {
      const response = await fetch(this.vonageApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: `Vonage API error: ${errorData.error_text || response.statusText}`
        }
      }

      const result = await response.json()
      return {
        success: true,
        callId: result.uuid
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Vonage API call failed'
      }
    }
  }

  /**
   * Validate A/B call request
   */
  private async validateRequest(request: ABCallRequest): Promise<{ valid: boolean; error?: string }> {
    // Check required fields
    if (!request.testId || !request.leadId || !request.destinationNumber || !request.derivationId || !request.originNumber) {
      return { valid: false, error: 'Missing required fields' }
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(request.destinationNumber)) {
      return { valid: false, error: 'Invalid destination phone number format' }
    }

    // Check if test exists and is active
    const { data: test, error: testError } = await this.supabase
      .from('ab_tests')
      .select('*')
      .eq('test_id', request.testId)
      .eq('user_id', request.userId)
      .eq('status', 'running')
      .single()

    if (testError || !test) {
      return { valid: false, error: 'Test not found or not running' }
    }

    // Check if lead exists and is assigned to test
    const { data: lead, error: leadError } = await this.supabase
      .from('ab_test_leads')
      .select('*')
      .eq('lead_id', request.leadId)
      .eq('test_id', request.testId)
      .single()

    if (leadError || !lead) {
      return { valid: false, error: 'Lead not found or not assigned to test' }
    }

    return { valid: true }
  }

  /**
   * Get test configuration
   */
  private async getTestConfiguration(testId: string, userId: string): Promise<any> {
    const { data: test, error } = await this.supabase
      .from('ab_tests')
      .select('*')
      .eq('test_id', testId)
      .eq('user_id', userId)
      .single()

    if (error || !test) {
      return null
    }

    return test.config
  }

  /**
   * Log call attempt in database
   */
  private async logCallAttempt(request: ABCallRequest, callId: string, status: string): Promise<void> {
    try {
      await this.supabase
        .from('ab_test_call_attempts')
        .insert({
          test_id: request.testId,
          lead_id: request.leadId,
          group: request.group,
          call_id: callId,
          origin_number: request.originNumber,
          destination_number: request.destinationNumber,
          derivation_id: request.derivationId,
          status: status,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging call attempt:', error)
    }
  }

  /**
   * Update call status from Vonage webhook
   */
  async updateCallStatus(callId: string, status: string, metadata?: any): Promise<void> {
    try {
      await this.supabase
        .from('ab_test_call_attempts')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
          metadata: metadata
        })
        .eq('call_id', callId)
    } catch (error) {
      console.error('Error updating call status:', error)
    }
  }

  /**
   * Get call statistics for A/B test
   */
  async getTestStatistics(testId: string, userId: string): Promise<any> {
    try {
      const { data: calls, error } = await this.supabase
        .from('ab_test_call_attempts')
        .select('*')
        .eq('test_id', testId)

      if (error) {
        throw new Error('Failed to fetch call statistics')
      }

      // Calculate statistics by group
      const groupA = calls.filter(call => call.group === 'A')
      const groupB = calls.filter(call => call.group === 'B')

      return {
        groupA: {
          total: groupA.length,
          answered: groupA.filter(call => call.status === 'answered').length,
          failed: groupA.filter(call => call.status === 'failed').length,
          answerRate: groupA.length > 0 ? (groupA.filter(call => call.status === 'answered').length / groupA.length) * 100 : 0
        },
        groupB: {
          total: groupB.length,
          answered: groupB.filter(call => call.status === 'answered').length,
          failed: groupB.filter(call => call.status === 'failed').length,
          answerRate: groupB.length > 0 ? (groupB.filter(call => call.status === 'answered').length / groupB.length) * 100 : 0
        }
      }
    } catch (error) {
      console.error('Error getting test statistics:', error)
      return null
    }
  }
}
