import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listId } = params
    const { searchParams } = new URL(request.url)
    const includeAll = searchParams.get('includeAll') === 'true'

    if (includeAll) {
      // Return all numbers with a flag indicating if they're in the list
      const { data: allNumbers, error: numbersError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (numbersError) {
        console.error("Error fetching phone numbers:", numbersError)
        return NextResponse.json({ error: "Failed to fetch numbers" }, { status: 500 })
      }

      // Get list items
      const { data: listItems, error: itemsError } = await supabase
        .from('number_list_items')
        .select('phone_number_id')
        .eq('list_id', listId)

      if (itemsError) {
        console.error("Error fetching list items:", itemsError)
        return NextResponse.json({ error: "Failed to fetch list items" }, { status: 500 })
      }

      const includedNumberIds = new Set(
        (listItems || []).map(item => item.phone_number_id)
      )

      const numbersWithFlags = (allNumbers || []).map(number => ({
        ...number,
        in_list: includedNumberIds.has(number.id)
      }))

      return NextResponse.json(numbersWithFlags)
    }

    // Get numbers that are specifically in this list
    const { data: numbers, error } = await supabase
      .from('phone_numbers')
      .select(`
        *,
        number_list_items!inner(
          list_id,
          notes,
          added_at
        )
      `)
      .eq('user_id', user.id)
      .eq('number_list_items.list_id', listId)
      .order('number_list_items.added_at', { ascending: false })

    if (error) {
      console.error('Error fetching list numbers:', error)
      return NextResponse.json({ error: 'Failed to fetch list numbers' }, { status: 500 })
    }

    // Process the data to remove the inner join references
    const processedNumbers = (numbers || []).map(number => ({
      ...number,
      list_notes: number.number_list_items?.[0]?.notes || null,
      added_to_list_at: number.number_list_items?.[0]?.added_at || null,
      number_list_items: undefined // Remove the original array
    }))

    return NextResponse.json(processedNumbers)
  } catch (error) {
    console.error('Error in list numbers API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listId } = params
    const body = await request.json()
    const { phoneNumberIds, notes } = body

    if (!phoneNumberIds || !Array.isArray(phoneNumberIds) || phoneNumberIds.length === 0) {
      return NextResponse.json({ error: "Phone number IDs are required" }, { status: 400 })
    }

    // Check that all phone numbers belong to the user
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
    const itemsToInsert = validNumberIds.map(numberId => ({
      list_id: listId,
      phone_number_id: numberId,
      added_by: user.id,
      notes: notes || null
    }))

    const { error } = await supabase
      .from('number_list_items')
      .insert(itemsToInsert)
      .onConflict('list_id,phone_number_id', {
        ignoreDuplicates: true
      })

    if (error) {
      console.error('Error adding numbers to list:', error)
      return NextResponse.json({ error: 'Failed to add numbers to list' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      added: validNumberIds.length,
      skipped: phoneNumberIds.length - validNumberIds.length
    })
  } catch (error) {
    console.error('Error in add numbers to list API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listId } = params
    const { searchParams } = new URL(request.url)
    const phoneNumberIds = searchParams.get('phoneNumberIds')?.split(',')

    if (!phoneNumberIds || phoneNumberIds.length === 0) {
      return NextResponse.json({ error: "Phone number IDs are required" }, { status: 400 })
    }

    const { error } = await supabase
      .from('number_list_items')
      .delete()
      .eq('list_id', listId)
      .in('phone_number_id', phoneNumberIds)

    if (error) {
      console.error('Error removing numbers from list:', error)
      return NextResponse.json({ error: 'Failed to remove numbers from list' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in remove numbers from list API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
