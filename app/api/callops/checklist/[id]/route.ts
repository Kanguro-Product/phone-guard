import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PATCH /api/callops/checklist/[id] - Update a checklist item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get current checklist item
    const { data: currentItem, error: fetchError } = await supabase
      .from('changes_checklist')
      .select('*, tests!inner(owner_user_id)')
      .eq('id', params.id)
      .single()

    if (fetchError || !currentItem) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    // Check ownership through test
    if ((currentItem as any).tests.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update checklist item
    const { data: updatedItem, error: updateError } = await supabase
      .from('changes_checklist')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating checklist item:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log audit
    for (const [field, newValue] of Object.entries(body)) {
      const oldValue = currentItem[field as keyof typeof currentItem]
      if (oldValue !== newValue) {
        await supabase.from('audit_log').insert({
          entity: 'Checklist',
          entity_id: params.id,
          action: 'Update',
          user_id: user.id,
          field,
          old_value: JSON.stringify(oldValue),
          new_value: JSON.stringify(newValue)
        })
      }
    }

    return NextResponse.json({ checklistItem: updatedItem })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/callops/checklist/[id] - Delete a checklist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get item before deleting
    const { data: item, error: fetchError } = await supabase
      .from('changes_checklist')
      .select('*, tests!inner(owner_user_id)')
      .eq('id', params.id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    // Check ownership
    if ((item as any).tests.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete item
    const { error: deleteError } = await supabase
      .from('changes_checklist')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting checklist item:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Log audit
    await supabase.from('audit_log').insert({
      entity: 'Checklist',
      entity_id: params.id,
      action: 'Delete',
      user_id: user.id,
      old_value: JSON.stringify(item)
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
