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
    
    // Validate required fields
    const requiredFields = ['destinationNumber', 'derivationId', 'originNumber', 'group']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 })
      }
    }

    // Validate group
    if (!['A', 'B'].includes(body.group)) {
      return NextResponse.json({ 
        error: 'Group must be A or B' 
      }, { status: 400 })
    }

    // Get N8N webhook URL from user integrations
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'n8n')
      .eq('enabled', true)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ 
        error: 'N8N integration not configured' 
      }, { status: 400 })
    }

    const n8nWebhookUrl = integration.credentials?.webhook_url

    if (!n8nWebhookUrl) {
      return NextResponse.json({ 
        error: 'N8N webhook URL not found' 
      }, { status: 400 })
    }

    // Create simple call request
    const callRequest = {
      destinationNumber: body.destinationNumber,
      derivationId: body.derivationId,
      originNumber: body.originNumber,
      group: body.group,
      testId: body.testId,
      leadId: body.leadId
    }

    // Make the A/B call using N8N webhook
    const callerService = new SimpleVonageCallerService(n8nWebhookUrl)
    const result = await callerService.makeABCall(callRequest)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to make call' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      callId: result.callId,
      metadata: result.metadata,
      message: 'A/B call initiated successfully via N8N'
    })

  } catch (error) {
    console.error('Simple A/B Call API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Endpoint para llamadas batch
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate batch requests
    if (!Array.isArray(body.requests)) {
      return NextResponse.json({ 
        error: 'Requests must be an array' 
      }, { status: 400 })
    }

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
        error: 'N8N integration not configured' 
      }, { status: 400 })
    }

    const n8nWebhookUrl = integration.credentials?.webhook_url

    if (!n8nWebhookUrl) {
      return NextResponse.json({ 
        error: 'N8N webhook URL not found' 
      }, { status: 400 })
    }

    // Make batch calls
    const callerService = new SimpleVonageCallerService(n8nWebhookUrl)
    const results = await callerService.makeBatchABCalls(body.requests)

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.length} A/B calls via N8N`
    })

  } catch (error) {
    console.error('Batch A/B Call API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
