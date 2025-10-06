import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    const body = await request.json()
    const { action, phoneNumberIds, targetListId, sourceListId } = body

    console.log('Bulk action request:', { action, phoneNumberIdsCount: phoneNumberIds?.length, targetListId, sourceListId })

    if (!phoneNumberIds || !Array.isArray(phoneNumberIds) || phoneNumberIds.length === 0) {
      return NextResponse.json({ error: "Phone number IDs are required" }, { status: 400 })
    }

    // Verify that all phone numbers belong to the user
    const { data: numbers, error: numbersError } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('user_id', user.id)
      .in('id', phoneNumberIds)

    if (numbersError) {
      console.error("Error verifying phone numbers:", numbersError)
      return NextResponse.json({ error: "Failed to verify phone numbers" }, { status: 500 })
    }

    const validNumberIds = (numbers || []).map(n => n.id)

    switch (action) {
      case 'transfer_to_list':
        if (!targetListId) {
          return NextResponse.json({ error: "Target list ID is required" }, { status: 400 })
        }

        // Verify that the target list belongs to the user
        const { data: targetList, error: targetListError } = await supabase
          .from('number_lists')
          .select('id')
          .eq('id', targetListId)
          .eq('user_id', user.id)
          .single()

        if (targetListError || !targetList) {
          console.error("Error verifying target list:", targetListError)
          return NextResponse.json({ 
            error: "Target list not found or access denied", 
            details: targetListError?.message || "List not found"
          }, { status: 400 })
        }
        
        // Remove from source list if specified
        if (sourceListId) {
          await supabase
            .from('number_list_items')
            .delete()
            .eq('list_id', sourceListId)
            .in('phone_number_id', validNumberIds)
        }
        
        // Add to target list
        const itemsToInsert = validNumberIds.map(numberId => ({
          list_id: targetListId,
          phone_number_id: numberId,
          added_by: user.id,
          notes: `Transferred from bulk action on ${new Date().toUTCString()}`
        }))

        console.log('Attempting to upsert:', { 
          itemsCount: itemsToInsert.length, 
          sampleItem: itemsToInsert[0],
          targetListId,
          validNumberIdsCount: validNumberIds.length
        })

        const { error: transferError } = await supabase
          .from('number_list_items')
          .upsert(itemsToInsert, {
            onConflict: 'list_id,phone_number_id'
          })

        if (transferError) {
          console.error('Error transferring numbers:', transferError)
          console.error('Transfer details:', {
            errorCode: transferError.code,
            errorMessage: transferError.message,
            errorDetails: transferError.details,
            errorHint: transferError.hint
          })
          return NextResponse.json({ 
            error: 'Failed to transfer numbers', 
            details: transferError.message,
            action: 'transfer_to_list'
          }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          transferred: validNumberIds.length,
          action: 'transfer_to_list'
        })

      case 'remove_from_list':
        if (!sourceListId) {
          return NextResponse.json({ error: "Source list ID is required" }, { status: 400 })
        }

        const { error: removeError } = await supabase
          .from('number_list_items')
          .delete()
          .eq('list_id', sourceListId)
          .in('phone_number_id', validNumberIds)

        if (removeError) {
          console.error('Error removing numbers from list:', removeError)
          return NextResponse.json({ error: 'Failed to remove numbers from list' }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          removed: validNumberIds.length,
          action: 'remove_from_list'
        })

      case 'move_to_discarded':
        // Use RPC function to move numbers to discarded list
        const { data: movedCount, error: moveError } = await supabase
          .rpc('move_to_discarded_list', { 
            user_uuid: user.id, 
            phone_number_ids: validNumberIds 
          })

        if (moveError) {
          console.error('Error moving numbers to discarded list:', moveError)
          return NextResponse.json({ 
            error: 'Failed to move numbers to discarded list', 
            details: moveError.message 
          }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          moved: movedCount || validNumberIds.length,
          action: 'move_to_discarded'
        })

      case 'restore_from_discarded':
        // Use RPC function to restore numbers from discarded list
        const { data: restoredCount, error: restoreError } = await supabase
          .rpc('restore_from_discarded_list', { 
            user_uuid: user.id, 
            phone_number_ids: validNumberIds 
          })

        if (restoreError) {
          console.error('Error restoring numbers from discarded list:', restoreError)
          return NextResponse.json({ 
            error: 'Failed to restore numbers from discarded list', 
            details: restoreError.message 
          }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          restored: restoredCount || validNumberIds.length,
          action: 'restore_from_discarded'
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in bulk actions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
