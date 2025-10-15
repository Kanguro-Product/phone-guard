import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VonageABCallerService } from '@/core/ab_caller_tool/services/vonage_ab_caller'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    console.log('Vonage webhook received:', body)

    // Extract call information from Vonage webhook
    const {
      uuid: callId,
      status,
      direction,
      from,
      to,
      duration,
      start_time,
      end_time,
      network,
      price,
      rate
    } = body

    if (!callId) {
      return NextResponse.json({ 
        error: 'Call ID is required' 
      }, { status: 400 })
    }

    // Find the call attempt in our database
    const { data: callAttempt, error: callError } = await supabase
      .from('ab_test_call_attempts')
      .select('*')
      .eq('call_id', callId)
      .single()

    if (callError || !callAttempt) {
      console.log('Call attempt not found in database:', callId)
      return NextResponse.json({ 
        success: true, 
        message: 'Call not found in A/B test database' 
      })
    }

    // Update call status
    const abCallerService = new VonageABCallerService()
    await abCallerService.updateCallStatus(callId, status, {
      direction,
      from,
      to,
      duration,
      start_time,
      end_time,
      network,
      price,
      rate,
      webhook_received_at: new Date().toISOString()
    })

    // Log the event
    await supabase
      .from('ab_test_events')
      .insert({
        test_id: callAttempt.test_id,
        lead_id: callAttempt.lead_id,
        event_type: 'voice_event',
        event_data: {
          call_id: callId,
          status,
          direction,
          from,
          to,
          duration,
          start_time,
          end_time,
          network,
          price,
          rate
        },
        created_at: new Date().toISOString()
      })

    // Update test metrics if call is completed
    if (status === 'completed' || status === 'answered' || status === 'failed') {
      await updateTestMetrics(callAttempt.test_id, callAttempt.group, status, duration)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    })

  } catch (error) {
    console.error('Vonage webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

/**
 * Update test metrics when call is completed
 */
async function updateTestMetrics(testId: string, group: string, status: string, duration?: number) {
  try {
    const supabase = await createClient()

    // Get current metrics
    const { data: currentMetrics, error: metricsError } = await supabase
      .from('ab_test_metrics')
      .select('*')
      .eq('test_id', testId)
      .eq('group', group)
      .single()

    if (metricsError || !currentMetrics) {
      // Create new metrics record
      await supabase
        .from('ab_test_metrics')
        .insert({
          test_id: testId,
          group: group,
          total_calls: 1,
          answered_calls: status === 'answered' ? 1 : 0,
          failed_calls: status === 'failed' ? 1 : 0,
          total_duration: duration || 0,
          average_duration: duration || 0,
          answer_rate: status === 'answered' ? 100 : 0,
          updated_at: new Date().toISOString()
        })
    } else {
      // Update existing metrics
      const newTotalCalls = currentMetrics.total_calls + 1
      const newAnsweredCalls = currentMetrics.answered_calls + (status === 'answered' ? 1 : 0)
      const newFailedCalls = currentMetrics.failed_calls + (status === 'failed' ? 1 : 0)
      const newTotalDuration = currentMetrics.total_duration + (duration || 0)
      const newAnswerRate = (newAnsweredCalls / newTotalCalls) * 100
      const newAverageDuration = newTotalDuration / newAnsweredCalls || 0

      await supabase
        .from('ab_test_metrics')
        .update({
          total_calls: newTotalCalls,
          answered_calls: newAnsweredCalls,
          failed_calls: newFailedCalls,
          total_duration: newTotalDuration,
          average_duration: newAverageDuration,
          answer_rate: newAnswerRate,
          updated_at: new Date().toISOString()
        })
        .eq('test_id', testId)
        .eq('group', group)
    }
  } catch (error) {
    console.error('Error updating test metrics:', error)
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Vonage webhook endpoint is healthy' 
  })
}
