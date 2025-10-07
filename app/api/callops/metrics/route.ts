import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/callops/metrics - Get metrics for a test
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const testKey = searchParams.get('test_key')
    const iterationIndex = searchParams.get('iteration_index')

    if (!testKey) {
      return NextResponse.json({ error: 'test_key is required' }, { status: 400 })
    }

    // Verify test ownership
    const { data: test } = await supabase
      .from('tests')
      .select('owner_user_id')
      .eq('test_key', testKey)
      .single()

    if (!test || test.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('test_metrics')
      .select('*')
      .eq('test_key', testKey)

    if (iterationIndex !== null) {
      query = query.eq('iteration_index', parseInt(iterationIndex || '0'))
    }

    const { data: metrics, error } = await query

    if (error) {
      console.error('Error fetching metrics:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/callops/metrics - Create/update metrics for a test variant
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { test_key, iteration_index, variant_id, ...metricsData } = body

    if (!test_key || variant_id === undefined) {
      return NextResponse.json(
        { error: 'test_key and variant_id are required' },
        { status: 400 }
      )
    }

    // Verify test ownership and get test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('test_key', test_key)
      .eq('owner_user_id', user.id)
      .single()

    if (testError || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Validate that test is in ToReport status
    if (test.status !== 'ToReport' && test.status !== 'Finished') {
      return NextResponse.json(
        { error: 'Can only add metrics to tests in ToReport or Finished status' },
        { status: 400 }
      )
    }

    // Validate metrics
    if (metricsData.llamadas_contestadas > metricsData.llamadas_realizadas) {
      return NextResponse.json(
        { error: 'llamadas_contestadas cannot be greater than llamadas_realizadas' },
        { status: 400 }
      )
    }

    if (metricsData.leads_con_respuesta > metricsData.leads_llamados) {
      return NextResponse.json(
        { error: 'leads_con_respuesta cannot be greater than leads_llamados' },
        { status: 400 }
      )
    }

    if (metricsData.numeros_con_spam > metricsData.numeros_totales) {
      return NextResponse.json(
        { error: 'numeros_con_spam cannot be greater than numeros_totales' },
        { status: 400 }
      )
    }

    // Upsert metrics
    const { data: metric, error: upsertError } = await supabase
      .from('test_metrics')
      .upsert({
        test_key,
        iteration_index: iteration_index || 0,
        variant_id,
        ...metricsData
      }, {
        onConflict: 'test_key,iteration_index,variant_id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting metrics:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    // Calculate KPIs
    const { error: calcError } = await supabase.rpc('calculate_kpis', {
      metric_id: metric.id
    })

    if (calcError) {
      console.error('Error calculating KPIs:', calcError)
    }

    // Get updated metric with KPIs
    const { data: updatedMetric } = await supabase
      .from('test_metrics')
      .select('*')
      .eq('id', metric.id)
      .single()

    // Log audit
    await supabase.from('audit_log').insert({
      entity: 'Metrics',
      entity_id: `${test_key}-${iteration_index || 0}-${variant_id}`,
      action: 'Report',
      user_id: user.id,
      new_value: JSON.stringify(updatedMetric)
    })

    return NextResponse.json({ metric: updatedMetric }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
