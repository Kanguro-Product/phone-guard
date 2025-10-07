import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/callops/tests/[testId]/actions - Perform actions on a test (start, cancel)
export async function POST(
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
    const { action, reason } = body // action: 'start', 'cancel'

    // Get current test
    const { data: test, error: fetchError } = await supabase
      .from('tests')
      .select('*')
      .eq('full_id', params.testId)
      .eq('owner_user_id', user.id)
      .single()

    if (fetchError || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case 'start':
        // Can only start pending tests
        if (test.status !== 'Pending') {
          return NextResponse.json(
            { error: 'Can only start pending tests' },
            { status: 400 }
          )
        }

        updateData = {
          status: 'Running',
          started_at: new Date().toISOString()
        }
        break

      case 'cancel':
        // Can only cancel running tests
        if (test.status !== 'Running') {
          return NextResponse.json(
            { error: 'Can only cancel running tests' },
            { status: 400 }
          )
        }

        if (!reason || reason.trim().length < 10) {
          return NextResponse.json(
            { error: 'Cancellation requires a reason (min 10 characters)' },
            { status: 400 }
          )
        }

        updateData = {
          status: 'Canceled',
          ended_at: new Date().toISOString(),
          operational_notes: test.operational_notes 
            ? `${test.operational_notes}\n\nCANCELED: ${reason}`
            : `CANCELED: ${reason}`
        }
        break

      case 'finish':
        // Can only finish tests that are ToReport
        if (test.status !== 'ToReport') {
          return NextResponse.json(
            { error: 'Can only finish tests in ToReport status' },
            { status: 400 }
          )
        }

        updateData = {
          status: 'Finished'
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update test
    const { data: updatedTest, error: updateError } = await supabase
      .from('tests')
      .update(updateData)
      .eq('full_id', params.testId)
      .eq('owner_user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating test:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log audit
    await supabase.from('audit_log').insert({
      entity: 'State',
      entity_id: params.testId,
      action: action.charAt(0).toUpperCase() + action.slice(1),
      user_id: user.id,
      old_value: test.status,
      new_value: updateData.status,
      field: 'status'
    })

    return NextResponse.json({ test: updatedTest })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
