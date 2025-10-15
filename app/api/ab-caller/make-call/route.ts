import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VonageABCallerService } from '@/core/ab_caller_tool/services/vonage_ab_caller'

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
    const requiredFields = ['testId', 'leadId', 'destinationNumber', 'group', 'derivationId', 'originNumber']
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

    // Get Vonage API key from user integrations
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'vonage')
      .eq('enabled', true)
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ 
        error: 'Vonage integration not configured' 
      }, { status: 400 })
    }

    const apiKey = integration.credentials?.api_key
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Vonage API key not found' 
      }, { status: 400 })
    }

    // Create A/B call request
    const abCallRequest = {
      testId: body.testId,
      leadId: body.leadId,
      destinationNumber: body.destinationNumber,
      group: body.group,
      derivationId: body.derivationId,
      originNumber: body.originNumber,
      apiKey: apiKey,
      userId: user.id
    }

    // Make the A/B call
    const abCallerService = new VonageABCallerService()
    const result = await abCallerService.makeABCall(abCallRequest)

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to make call' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      callId: result.callId,
      metadata: result.metadata,
      message: 'A/B call initiated successfully'
    })

  } catch (error) {
    console.error('A/B Call API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('testId')

    if (!testId) {
      return NextResponse.json({ 
        error: 'Test ID is required' 
      }, { status: 400 })
    }

    // Get test statistics
    const abCallerService = new VonageABCallerService()
    const statistics = await abCallerService.getTestStatistics(testId, user.id)

    if (!statistics) {
      return NextResponse.json({ 
        error: 'Failed to get test statistics' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      statistics,
      testId
    })

  } catch (error) {
    console.error('A/B Call statistics error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
