import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get available phone numbers from the numbers table
    const { data: numbers, error } = await supabase
      .from('numbers')
      .select(`
        id,
        phone,
        name,
        average_score,
        spam_status,
        reputation_score,
        call_count,
        success_rate,
        last_used,
        tags
      `)
      .order('average_score', { ascending: false })

    if (error) {
      console.error('Error fetching numbers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch numbers' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedNumbers = numbers?.map(number => ({
      id: number.id,
      phone: number.phone,
      name: number.name,
      average_score: number.average_score || 0,
      spam_status: number.spam_status || 'clean',
      reputation_score: number.reputation_score || 0,
      call_count: number.call_count || 0,
      success_rate: number.success_rate || 0,
      last_used: number.last_used,
      tags: number.tags || []
    })) || []

    return NextResponse.json({
      numbers: transformedNumbers,
      total: transformedNumbers.length
    })

  } catch (error) {
    console.error('Error in numbers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
