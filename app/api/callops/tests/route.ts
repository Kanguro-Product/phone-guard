import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/callops/tests - Get all tests for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const parentTestKey = searchParams.get('parent_test_key')

    let query = supabase
      .from('tests')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (parentTestKey) {
      query = query.eq('parent_test_key', parentTestKey)
    }

    const { data: tests, error } = await query

    if (error) {
      console.error('Error fetching tests:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tests })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/callops/tests - Create a new test
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

    // Generate test key
    const { data: nextKeyData, error: keyError } = await supabase.rpc('generate_next_test_key')
    
    if (keyError) {
      console.error('Error generating test key:', keyError)
      return NextResponse.json({ error: 'Error generating test key' }, { status: 500 })
    }

    const testKey = nextKeyData as string
    const code = body.code || 'TEST'
    const dateStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const fullId = body.parent_test_key 
      ? `${body.parent_test_key}.${body.iteration_index || 1}-${code}-${dateStr}`
      : `${testKey}-${code}-${dateStr}`

    // Prepare test data
    const testData = {
      test_key: body.parent_test_key ? body.parent_test_key : testKey,
      code,
      full_id: fullId,
      name: body.name,
      alternative_name: body.alternative_name || null,
      hypothesis: body.hypothesis,
      objective: body.objective,
      design: body.design,
      variants: body.variants || [],
      sample_per_variant: body.sample_per_variant || {},
      duration_hours: body.duration_hours || 24,
      status: 'Pending',
      owner_user_id: user.id,
      parent_test_key: body.parent_test_key || null,
      iteration_index: body.iteration_index || 0,
      success_criteria: body.success_criteria,
      live_safe_fields: body.live_safe_fields || {},
      independent_variable: body.independent_variable,
      dependent_variables: body.dependent_variables || [],
      planned_start_date: body.planned_start_date || null,
      channels: body.channels || [],
      operational_notes: body.operational_notes || null,
      phone_numbers_used: body.phone_numbers_used || []
    }

    // Insert test
    const { data: test, error: insertError } = await supabase
      .from('tests')
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating test:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Log audit
    await supabase.from('audit_log').insert({
      entity: 'Test',
      entity_id: test.full_id,
      action: 'Create',
      user_id: user.id,
      new_value: JSON.stringify(testData)
    })

    return NextResponse.json({ test }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
