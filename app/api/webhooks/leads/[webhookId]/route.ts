import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface LeadData {
  phone: string
  name?: string
  email?: string
  company?: string
  source?: string
  notes?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const webhookId = params.webhookId
    const body = await request.json()
    
    // Validate lead data
    if (!body.phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Normalize phone number
    const normalizedPhone = body.phone.replace(/\D/g, '')
    if (normalizedPhone.length < 9) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Create lead data
    const leadData: LeadData = {
      phone: body.phone,
      name: body.name || null,
      email: body.email || null,
      company: body.company || null,
      source: body.source || 'Webhook',
      notes: body.notes || null
    }

    // Store lead in database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        user_id: user.id,
        webhook_id: webhookId,
        phone: leadData.phone,
        name: leadData.name,
        email: leadData.email,
        company: leadData.company,
        source: leadData.source,
        notes: leadData.notes,
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (leadError) {
      console.error('Error storing lead:', leadError)
      return NextResponse.json({ error: 'Failed to store lead' }, { status: 500 })
    }

    // Log webhook activity
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhookId,
        user_id: user.id,
        lead_id: lead.id,
        status: 'success',
        payload: body,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true, 
      lead_id: lead.id,
      message: 'Lead received successfully' 
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const webhookId = params.webhookId

    // Get webhook logs
    const { data: logs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('webhook_id', webhookId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (logsError) {
      console.error('Error fetching webhook logs:', logsError)
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      logs,
      webhook_id: webhookId 
    })

  } catch (error) {
    console.error('Webhook logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
