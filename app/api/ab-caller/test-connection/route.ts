import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SimpleVonageCallerService } from '@/core/ab_caller_tool/services/simple_vonage_caller'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { testType, derivationId, originNumber, destinationNumber } = body

    // Get N8N integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'n8n')
      .eq('enabled', true)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ 
        error: 'N8N integration not configured',
        status: 'n8n_not_configured'
      }, { status: 400 })
    }

    const n8nWebhookUrl = integration.credentials?.webhook_url

    if (!n8nWebhookUrl) {
      return NextResponse.json({ 
        error: 'N8N webhook URL not found',
        status: 'n8n_webhook_missing'
      }, { status: 400 })
    }

    // Test connection based on type
    const callerService = new SimpleVonageCallerService(n8nWebhookUrl)
    
    let testResult = {
      success: false,
      status: 'unknown',
      message: '',
      details: {}
    }

    switch (testType) {
      case 'login':
        testResult = await testLogin(callerService)
        break
      
      case 'webhook':
        testResult = await testWebhook(callerService, {
          derivationId,
          originNumber,
          destinationNumber
        })
        break
      
      case 'full_call':
        testResult = await testFullCall(callerService, {
          derivationId,
          originNumber,
          destinationNumber
        })
        break
      
      default:
        return NextResponse.json({ 
          error: 'Invalid test type' 
        }, { status: 400 })
    }

    // Log test result
    await supabase
      .from('ab_test_events')
      .insert({
        test_id: null,
        event_type: 'connection_test',
        event_data: {
          test_type: testType,
          result: testResult,
          user_id: user.id,
          timestamp: new Date().toISOString()
        }
      })

    return NextResponse.json({
      success: testResult.success,
      status: testResult.status,
      message: testResult.message,
      details: testResult.details,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      status: 'server_error'
    }, { status: 500 })
  }
}

async function testLogin(callerService: SimpleVonageCallerService) {
  try {
    const result = await callerService.login()
    
    if (result.success) {
      return {
        success: true,
        status: 'n8n_connected',
        message: 'N8N login successful',
        details: {
          login_time: new Date().toISOString(),
          response_time: '< 1s'
        }
      }
    } else {
      return {
        success: false,
        status: 'n8n_login_failed',
        message: `Login failed: ${result.error}`,
        details: {
          error: result.error,
          timestamp: new Date().toISOString()
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      status: 'n8n_connection_error',
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }
}

async function testWebhook(callerService: SimpleVonageCallerService, params: any) {
  try {
    // Test webhook with minimal payload
    const testPayload = {
      destinationNumber: params.destinationNumber || '34661216995',
      derivationId: params.derivationId,
      originNumber: params.originNumber,
      group: 'A',
      testId: 'connection_test',
      leadId: 'test_lead',
      testMode: true
    }

    const result = await callerService.makeABCall(testPayload)
    
    if (result.success) {
      return {
        success: true,
        status: 'webhook_working',
        message: 'Webhook test successful',
        details: {
          call_id: result.callId,
          test_mode: true,
          timestamp: new Date().toISOString()
        }
      }
    } else {
      return {
        success: false,
        status: 'webhook_failed',
        message: `Webhook test failed: ${result.error}`,
        details: {
          error: result.error,
          timestamp: new Date().toISOString()
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      status: 'webhook_error',
      message: `Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }
}

async function testFullCall(callerService: SimpleVonageCallerService, params: any) {
  try {
    // Test full call with real parameters
    const callRequest = {
      destinationNumber: params.destinationNumber || '34661216995',
      derivationId: params.derivationId,
      originNumber: params.originNumber,
      group: 'A',
      testId: 'full_connection_test',
      leadId: 'test_lead_full'
    }

    const result = await callerService.makeABCall(callRequest)
    
    if (result.success) {
      return {
        success: true,
        status: 'full_call_success',
        message: 'Full call test successful',
        details: {
          call_id: result.callId,
          metadata: result.metadata,
          timestamp: new Date().toISOString()
        }
      }
    } else {
      return {
        success: false,
        status: 'full_call_failed',
        message: `Full call test failed: ${result.error}`,
        details: {
          error: result.error,
          timestamp: new Date().toISOString()
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      status: 'full_call_error',
      message: `Full call error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }
}
