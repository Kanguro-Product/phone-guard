import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/callops/tests/[testId] - Get a specific test
export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: test, error } = await supabase
      .from('tests')
      .select('*')
      .eq('full_id', params.testId)
      .eq('owner_user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching test:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json({ test })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/callops/tests/[testId] - Update a test
export async function PATCH(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Get current test to check status
    const { data: currentTest, error: fetchError } = await supabase
      .from('tests')
      .select('*')
      .eq('full_id', params.testId)
      .eq('owner_user_id', user.id)
      .single()

    if (fetchError || !currentTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Check if test is running and trying to edit non-live-safe fields
    if (currentTest.status === 'Running') {
      const liveSafeFields = ['operational_notes', 'phone_numbers_used', 'live_safe_fields']
      const editedFields = Object.keys(body)
      const nonLiveSafeEdits = editedFields.filter(field => !liveSafeFields.includes(field))
      
      if (nonLiveSafeEdits.length > 0) {
        return NextResponse.json(
          { error: 'Cannot edit these fields while test is running' },
          { status: 403 }
        )
      }
    }

    // Update test
    const { data: test, error: updateError } = await supabase
      .from('tests')
      .update(body)
      .eq('full_id', params.testId)
      .eq('owner_user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating test:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log audit for each changed field
    for (const [field, newValue] of Object.entries(body)) {
      const oldValue = currentTest[field as keyof typeof currentTest]
      if (oldValue !== newValue) {
        await supabase.from('audit_log').insert({
          entity: 'Test',
          entity_id: params.testId,
          action: 'Update',
          user_id: user.id,
          field,
          old_value: JSON.stringify(oldValue),
          new_value: JSON.stringify(newValue)
        })
      }
    }

    return NextResponse.json({ test })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/callops/tests/[testId] - Delete a test
export async function DELETE(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get test before deleting for audit
    const { data: test, error: fetchError } = await supabase
      .from('tests')
      .select('*')
      .eq('full_id', params.testId)
      .eq('owner_user_id', user.id)
      .single()

    if (fetchError || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    // Don't allow deletion of running tests
    if (test.status === 'Running') {
      return NextResponse.json(
        { error: 'Cannot delete a running test. Cancel it first.' },
        { status: 403 }
      )
    }

    // Delete test (cascade will delete related records)
    const { error: deleteError } = await supabase
      .from('tests')
      .delete()
      .eq('full_id', params.testId)
      .eq('owner_user_id', user.id)

    if (deleteError) {
      console.error('Error deleting test:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Log audit
    await supabase.from('audit_log').insert({
      entity: 'Test',
      entity_id: params.testId,
      action: 'Delete',
      user_id: user.id,
      old_value: JSON.stringify(test)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
