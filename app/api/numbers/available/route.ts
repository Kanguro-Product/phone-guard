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
      
      // If table doesn't exist or has no data, return sample data
      const sampleNumbers = [
        {
          id: '1',
          phone: '+34604579589',
          name: 'Mobile Primary',
          average_score: 85,
          spam_status: 'clean',
          reputation_score: 92,
          call_count: 150,
          success_rate: 78,
          last_used: new Date().toISOString(),
          tags: ['mobile', 'primary']
        },
        {
          id: '2',
          phone: '+34604579590',
          name: 'Landline Backup',
          average_score: 72,
          spam_status: 'clean',
          reputation_score: 68,
          call_count: 89,
          success_rate: 65,
          last_used: new Date(Date.now() - 86400000).toISOString(),
          tags: ['landline', 'backup']
        },
        {
          id: '3',
          phone: '+34604579591',
          name: 'Mobile Secondary',
          average_score: 68,
          spam_status: 'warning',
          reputation_score: 45,
          call_count: 45,
          success_rate: 52,
          last_used: new Date(Date.now() - 172800000).toISOString(),
          tags: ['mobile', 'secondary']
        },
        {
          id: '4',
          phone: '+34604579592',
          name: 'Landline Primary',
          average_score: 91,
          spam_status: 'clean',
          reputation_score: 95,
          call_count: 200,
          success_rate: 88,
          last_used: new Date().toISOString(),
          tags: ['landline', 'primary']
        }
      ]

      return NextResponse.json({
        numbers: sampleNumbers,
        total: sampleNumbers.length,
        message: 'Using sample data - numbers table not available'
      })
    }

    // If no numbers found, return sample data
    if (!numbers || numbers.length === 0) {
      const sampleNumbers = [
        {
          id: '1',
          phone: '+34604579589',
          name: 'Mobile Primary',
          average_score: 85,
          spam_status: 'clean',
          reputation_score: 92,
          call_count: 150,
          success_rate: 78,
          last_used: new Date().toISOString(),
          tags: ['mobile', 'primary']
        },
        {
          id: '2',
          phone: '+34604579590',
          name: 'Landline Backup',
          average_score: 72,
          spam_status: 'clean',
          reputation_score: 68,
          call_count: 89,
          success_rate: 65,
          last_used: new Date(Date.now() - 86400000).toISOString(),
          tags: ['landline', 'backup']
        },
        {
          id: '3',
          phone: '+34604579591',
          name: 'Mobile Secondary',
          average_score: 68,
          spam_status: 'warning',
          reputation_score: 45,
          call_count: 45,
          success_rate: 52,
          last_used: new Date(Date.now() - 172800000).toISOString(),
          tags: ['mobile', 'secondary']
        },
        {
          id: '4',
          phone: '+34604579592',
          name: 'Landline Primary',
          average_score: 91,
          spam_status: 'clean',
          reputation_score: 95,
          call_count: 200,
          success_rate: 88,
          last_used: new Date().toISOString(),
          tags: ['landline', 'primary']
        }
      ]

      return NextResponse.json({
        numbers: sampleNumbers,
        total: sampleNumbers.length,
        message: 'Using sample data - no numbers found in database'
      })
    }

    // Transform the data to match the expected format
    const transformedNumbers = numbers.map(number => ({
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
    }))

    return NextResponse.json({
      numbers: transformedNumbers,
      total: transformedNumbers.length
    })

  } catch (error) {
    console.error('Error in numbers API:', error)
    
    // Return sample data even on error
    const sampleNumbers = [
      {
        id: '1',
        phone: '+34604579589',
        name: 'Mobile Primary',
        average_score: 85,
        spam_status: 'clean',
        reputation_score: 92,
        call_count: 150,
        success_rate: 78,
        last_used: new Date().toISOString(),
        tags: ['mobile', 'primary']
      },
      {
        id: '2',
        phone: '+34604579590',
        name: 'Landline Backup',
        average_score: 72,
        spam_status: 'clean',
        reputation_score: 68,
        call_count: 89,
        success_rate: 65,
        last_used: new Date(Date.now() - 86400000).toISOString(),
        tags: ['landline', 'backup']
      }
    ]

    return NextResponse.json({
      numbers: sampleNumbers,
      total: sampleNumbers.length,
      message: 'Using sample data due to error'
    })
  }
}
