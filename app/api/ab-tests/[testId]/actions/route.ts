import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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
    const body = await request.json()
    const { action } = body

    if (!action || !['launch', 'pause', 'resume', 'stop'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

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

    // Update test status based on action
    let updateData: any = {}
    let eventName = ''
    let eventDescription = ''

    switch (action) {
      case 'launch':
        updateData = {
          status: 'active',
          runtime_status: 'running',
          started_at: new Date().toISOString()
        }
        eventName = 'Test Launched'
        eventDescription = `A/B test "${test.test_name}" launched`
        break

      case 'pause':
        updateData = {
          runtime_status: 'paused'
        }
        eventName = 'Test Paused'
        eventDescription = `A/B test "${test.test_name}" paused`
        break

      case 'resume':
        updateData = {
          runtime_status: 'running'
        }
        eventName = 'Test Resumed'
        eventDescription = `A/B test "${test.test_name}" resumed`
        break

      case 'stop':
        updateData = {
          status: 'completed',
          runtime_status: 'stopped',
          completed_at: new Date().toISOString()
        }
        eventName = 'Test Stopped'
        eventDescription = `A/B test "${test.test_name}" stopped`
        break
    }

    // Update the test
    const { error: updateError } = await supabase
      .from('ab_tests')
      .update(updateData)
      .eq('id', test.id)

    if (updateError) {
      console.error('Error updating test:', updateError)
      return NextResponse.json({ error: 'Failed to update test' }, { status: 500 })
    }

    // Log the event
    await supabase
      .from('ab_test_events')
      .insert({
        test_id: test.id,
        event_type: 'test_action',
        event_name: eventName,
        event_data: { action, previous_status: test.status, previous_runtime_status: test.runtime_status },
        triggered_by: user.id,
        description: eventDescription
      })

    return NextResponse.json({ 
      success: true, 
      message: `Test ${action} successful`,
      test: { ...test, ...updateData }
    })

  } catch (error) {
    console.error('Error in A/B test actions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}