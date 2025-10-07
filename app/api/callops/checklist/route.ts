import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/callops/checklist - Get checklist for a test iteration
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
      .from('changes_checklist')
      .select('*')
      .eq('test_key', testKey)

    if (iterationIndex !== null) {
      query = query.eq('iteration_index', parseInt(iterationIndex || '0'))
    }

    const { data: checklist, error } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching checklist:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ checklist })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/callops/checklist - Create a checklist item
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
    const { test_key, iteration_index, item, category, semaforo, comment } = body

    if (!test_key || !item || !category) {
      return NextResponse.json(
        { error: 'test_key, item, and category are required' },
        { status: 400 }
      )
    }

    // Verify test ownership
    const { data: test } = await supabase
      .from('tests')
      .select('owner_user_id')
      .eq('test_key', test_key)
      .eq('owner_user_id', user.id)
      .single()

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Insert checklist item
    const { data: checklistItem, error: insertError } = await supabase
      .from('changes_checklist')
      .insert({
        test_key,
        iteration_index: iteration_index || 0,
        item,
        category,
        semaforo: semaforo || 'Gris',
        comment
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating checklist item:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Log audit
    await supabase.from('audit_log').insert({
      entity: 'Checklist',
      entity_id: checklistItem.id,
      action: 'Create',
      user_id: user.id,
      new_value: JSON.stringify(checklistItem)
    })

    return NextResponse.json({ checklistItem }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/callops/checklist/[id] is in a separate file
