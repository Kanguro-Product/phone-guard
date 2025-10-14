import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { testId } = params

    // Get the test
    const { data: test, error: testError } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('test_id', testId)
      .eq('created_by', user.id)
      .single()

    if (testError || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Get leads data
    const { data: leads, error: leadsError } = await supabase
      .from('ab_test_leads')
      .select('*')
      .eq('test_id', test.id)

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    // Get call attempts data
    const { data: callAttempts, error: attemptsError } = await supabase
      .from('ab_test_call_attempts')
      .select('*')
      .eq('test_id', test.id)

    if (attemptsError) {
      console.error('Error fetching call attempts:', attemptsError)
      return NextResponse.json({ error: 'Failed to fetch call attempts' }, { status: 500 })
    }

    // Calculate metrics
    const groupA = leads?.filter(lead => lead.group_assignment === 'A') || []
    const groupB = leads?.filter(lead => lead.group_assignment === 'B') || []

    const groupAMetrics = calculateGroupMetrics(groupA, callAttempts || [])
    const groupBMetrics = calculateGroupMetrics(groupB, callAttempts || [])

    const metrics = {
      test_id: testId,
      test_name: test.test_name,
      status: test.status,
      runtime_status: test.runtime_status,
      created_at: test.created_at,
      started_at: test.started_at,
      completed_at: test.completed_at,
      group_a: {
        label: test.group_a_label,
        ...groupAMetrics
      },
      group_b: {
        label: test.group_b_label,
        ...groupBMetrics
      },
      overall: {
        total_leads: leads?.length || 0,
        total_calls: callAttempts?.length || 0,
        total_answered: callAttempts?.filter(attempt => attempt.call_status === 'answered').length || 0,
        total_converted: leads?.filter(lead => lead.status === 'converted').length || 0
      }
    }

    // Update current_metrics in the test
    await supabase
      .from('ab_tests')
      .update({ current_metrics: metrics })
      .eq('id', test.id)

    return NextResponse.json({ metrics })

  } catch (error) {
    console.error('Error in A/B test metrics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateGroupMetrics(leads: any[], callAttempts: any[]) {
  const totalLeads = leads.length
  const leadsContacted = leads.filter(lead => lead.contact_attempts > 0).length
  const totalCalls = callAttempts.filter(attempt => 
    leads.some(lead => lead.id === attempt.lead_id)
  ).length
  const answeredCalls = callAttempts.filter(attempt => 
    attempt.call_status === 'answered' && 
    leads.some(lead => lead.id === attempt.lead_id)
  ).length
  const convertedLeads = leads.filter(lead => lead.status === 'converted').length

  const answerRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0
  const conversionRate = leadsContacted > 0 ? (convertedLeads / leadsContacted) * 100 : 0

  // Calculate average call duration
  const answeredAttempts = callAttempts.filter(attempt => 
    attempt.call_status === 'answered' && 
    leads.some(lead => lead.id === attempt.lead_id)
  )
  const avgCallDuration = answeredAttempts.length > 0 
    ? answeredAttempts.reduce((sum, attempt) => sum + (attempt.call_duration || 0), 0) / answeredAttempts.length
    : 0

  // Calculate spam metrics
  const spamCheckedAttempts = callAttempts.filter(attempt => 
    attempt.spam_checked && 
    leads.some(lead => lead.id === attempt.lead_id)
  )
  const avgSpamScore = spamCheckedAttempts.length > 0
    ? spamCheckedAttempts.reduce((sum, attempt) => sum + (attempt.spam_score || 0), 0) / spamCheckedAttempts.length
    : 0
  const spamBlockRate = totalCalls > 0 
    ? (callAttempts.filter(attempt => attempt.spam_action === 'block' && leads.some(lead => lead.id === attempt.lead_id)).length / totalCalls) * 100
    : 0

  return {
    total_leads: totalLeads,
    leads_contacted: leadsContacted,
    total_calls: totalCalls,
    answered_calls: answeredCalls,
    answer_rate: Math.round(answerRate * 100) / 100,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    avg_call_duration: Math.round(avgCallDuration),
    avg_spam_score: Math.round(avgSpamScore * 100) / 100,
    spam_block_rate: Math.round(spamBlockRate * 100) / 100,
    converted_leads: convertedLeads
  }
}