import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("integrations")
      .select("credentials, enabled")
      .eq("user_id", user.id)
      .eq("provider", "n8n")
      .eq("enabled", true)
      .single()
    
    if (error || !data) {
      return NextResponse.json({ 
        ok: false, 
        message: "N8N integration not configured or not enabled" 
      })
    }

    const webhookUrl = data.credentials?.webhook_url
    if (!webhookUrl) {
      return NextResponse.json({ 
        ok: false, 
        message: "N8N webhook URL not configured" 
      })
    }

    // Validate URL format
    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json({ 
        ok: false, 
        message: "Invalid webhook URL format" 
      })
    }

    // Simple connectivity test - just check if URL is reachable
    try {
      const testResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: "Simple connectivity test from Phone Guard"
        }),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      // For N8N webhooks, we consider any response (even errors) as "reachable"
      // The important thing is that the URL is accessible
      return NextResponse.json({ 
        ok: true, 
        message: "N8N webhook URL is reachable",
        webhook_url: webhookUrl,
        status: testResponse.status,
        note: "Webhook is accessible. Actual functionality depends on your N8N workflow configuration."
      })

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({ 
          ok: false, 
          message: "N8N webhook timeout - check if your N8N instance is running" 
        })
      }
      
      if (error instanceof Error && error.message.includes('fetch')) {
        return NextResponse.json({ 
          ok: false, 
          message: "Cannot reach N8N webhook - check URL and N8N instance status" 
        })
      }
      
      return NextResponse.json({ 
        ok: false, 
        message: `N8N webhook error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }

  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
