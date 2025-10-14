import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get A/B tests for the user
    const { data: tests, error } = await supabase
      .from('ab_tests')
      .select(`
        *,
        ab_test_leads (
          id,
          lead_id,
          phone,
          group_assignment,
          status,
          contact_attempts,
          converted_at
        ),
        ab_test_metrics (
          metric_type,
          metric_name,
          group_assignment,
          value,
          percentage
        )
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching A/B tests:', error)
      return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 })
    }

    return NextResponse.json({ tests: tests || [] })

  } catch (error) {
    console.error('Error in A/B tests API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      test_name,
      test_description,
      group_a_label,
      group_b_label,
      group_a_percentage,
      group_b_percentage,
      leads,
      number_config,
      nudges,
      spam_protection,
      compliance,
      config
    } = body

    // Validate required fields
    if (!test_name || !leads || leads.length === 0) {
      return NextResponse.json({ error: 'Test name and leads are required' }, { status: 400 })
    }

    // Generate unique test ID
    const test_id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create the test
    const { data: test, error: testError } = await supabase
      .from('ab_tests')
      .insert({
        test_id,
        test_name,
        test_description,
        group_a_label: group_a_label || 'Group A',
        group_b_label: group_b_label || 'Group B',
        group_a_percentage: group_a_percentage || 50,
        group_b_percentage: group_b_percentage || 50,
        leads: leads || [],
        number_config: number_config || {},
        nudges: nudges || {},
        spam_protection: spam_protection || {},
        compliance: compliance || {},
        config: config || {},
        created_by: user.id
      })
      .select()
      .single()

    if (testError) {
      console.error('Error creating A/B test:', testError)
      return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
    }

    // Create leads
    if (leads && leads.length > 0) {
      const leadsData = leads.map((lead: any, index: number) => ({
        test_id: test.id,
        lead_id: lead.lead_id || `lead_${index + 1}`,
        phone: lead.phone,
        group_assignment: Math.random() < (group_a_percentage || 50) / 100 ? 'A' : 'B',
        sector: lead.sector,
        province: lead.province
      }))

      const { error: leadsError } = await supabase
        .from('ab_test_leads')
        .insert(leadsData)

      if (leadsError) {
        console.error('Error creating leads:', leadsError)
        // Don't fail the entire request, just log the error
      }
    }

    // Log the event
    await supabase
      .from('ab_test_events')
      .insert({
        test_id: test.id,
        event_type: 'test_created',
        event_name: 'Test Created',
        event_data: { test_name, leads_count: leads?.length || 0 },
        triggered_by: user.id,
        description: `A/B test "${test_name}" created with ${leads?.length || 0} leads`
      })

    return NextResponse.json({ test }, { status: 201 })

  } catch (error) {
    console.error('Error in A/B tests POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}