import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeCount = searchParams.get('includeCount') === 'true'

    let query = supabase
      .from('number_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (includeCount) {
      query = supabase
        .from('number_lists')
        .select(`
          *,
          number_list_items(count)
        `)
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })
    }

    const { data: lists, error } = await query

    if (error) {
      console.error("Error fetching number lists:", error)
      return NextResponse.json({ error: "Failed to fetch lists" }, { status: 500 })
    }

    // Process data if including count
    if (includeCount && lists) {
      const listsWithCount = lists.map(list => ({
        ...list,
        count: Array.isArray(list.number_list_items) 
          ? list.number_list_items[0]?.count || 0
          : 0
      }))
      return NextResponse.json(listsWithCount)
    }

    return NextResponse.json(lists)
  } catch (error) {
    console.error("Error in number lists API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color, icon, phoneNumbers } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 })
    }

    // Create the list
    const { data: newList, error: listError } = await supabase
      .from('number_lists')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        icon: icon || 'Phone'
      })
      .select()
      .single()

    if (listError) {
      console.error("Error creating list:", listError)
      return NextResponse.json({ error: "Failed to create list" }, { status: 500 })
    }

    // Add phone numbers to the list if provided
    if (phoneNumbers && phoneNumbers.length > 0) {
      const itemsToInsert = phoneNumbers.map((numberId: string) => ({
        list_id: newList.id,
        phone_number_id: numberId,
        added_by: user.id
      }))

      const { error: itemsError } = await supabase
        .from('number_list_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error("Error adding numbers to list:", itemsError)
        // Don't fail the entire request if this fails
      }
    }

    return NextResponse.json(newList)
  } catch (error) {
    console.error("Error in create number list API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, color, icon } = body

    if (!id) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from('number_lists')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        icon: icon || 'Phone'
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error("Error updating list:", error)
      return NextResponse.json({ error: "Failed to update list" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update number list API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('id')

    if (!listId) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 })
    }

    // Check if this is a default list (don't allow deletion of default lists)
    const { data: list, error: listError } = await supabase
      .from('number_lists')
      .select('is_default')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single()

    if (listError) {
      console.error("Error fetching list:", listError)
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    if (list.is_default) {
      return NextResponse.json({ error: "Cannot delete default list" }, { status: 400 })
    }

    // Get all phone numbers in this list before deleting
    const { data: listItems, error: itemsError } = await supabase
      .from('number_list_items')
      .select('phone_number_id')
      .eq('list_id', listId)

    if (itemsError) {
      console.error("Error fetching list items:", itemsError)
      return NextResponse.json({ error: "Failed to fetch list items" }, { status: 500 })
    }

    // If there are numbers in the list, move them to discarded list
    if (listItems && listItems.length > 0) {
      const phoneNumberIds = listItems.map(item => item.phone_number_id)
      
      // Use RPC function to move numbers to discarded list
      const { data: movedCount, error: moveError } = await supabase
        .rpc('move_to_discarded_list', { 
          user_uuid: user.id, 
          phone_number_ids: phoneNumberIds 
        })

      if (moveError) {
        console.error('Error moving numbers to discarded list:', moveError)
        return NextResponse.json({ 
          error: 'Failed to move numbers to discarded list', 
          details: moveError.message 
        }, { status: 500 })
      }
    }

    // Now delete the list
    const { error } = await supabase
      .from('number_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', user.id)

    if (error) {
      console.error("Error deleting list:", error)
      return NextResponse.json({ error: "Failed to delete list" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      movedNumbers: listItems?.length || 0,
      message: listItems && listItems.length > 0 
        ? `${listItems.length} números movidos a "Números Descartados"`
        : "Lista eliminada sin números"
    })
  } catch (error) {
    console.error("Error in delete number list API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
