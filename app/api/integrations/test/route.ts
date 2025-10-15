import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json()
    if (!provider) return NextResponse.json({ error: "provider is required" }, { status: 400 })

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("integrations")
      .select("api_key, api_secret, enabled, credentials")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .eq("enabled", true)
      .single()
    if (error || !data) return NextResponse.json({ error: "No enabled credentials" }, { status: 400 })

    if (provider === "numverify") {
      const url = new URL("https://apilayer.net/api/countries")
      url.searchParams.set("access_key", data.api_key)
      const res = await fetch(url.toString(), { method: "GET", cache: "no-store" })
      if (!res.ok) return NextResponse.json({ ok: false, status: res.status })
      const body = await res.json()
      return NextResponse.json({ ok: true, sample: Object.keys(body || {}).slice(0, 3) })
    }

    if (provider === "hiya") {
      // No public ping; simulate success if key exists
      return NextResponse.json({ ok: true, message: "Hiya credentials present" })
    }

    if (provider === "vonage") {
      // Without configuring Vonage server-side client, just confirm presence
      return NextResponse.json({ ok: true, message: "Vonage credentials present" })
    }

    if (provider === "openai") {
      // Test OpenAI API with a simple request
      const testResponse = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${data.api_key}`,
          "Content-Type": "application/json",
        },
      })
      
      if (!testResponse.ok) {
        return NextResponse.json({ ok: false, status: testResponse.status, message: "OpenAI API test failed" })
      }
      
      const models = await testResponse.json()
      return NextResponse.json({ 
        ok: true, 
        message: "OpenAI API connection successful",
        models: models.data?.slice(0, 3).map((m: any) => m.id) || []
      })
    }

    if (provider === "n8n") {
      // Test N8N webhook with a real POST request
      const webhookUrl = data.credentials?.webhook_url
      if (!webhookUrl) {
        return NextResponse.json({ ok: false, message: "N8N webhook URL not configured" })
      }

      // Validate URL format first
      try {
        new URL(webhookUrl)
      } catch {
        return NextResponse.json({ 
          ok: false, 
          message: "Invalid webhook URL format" 
        })
      }

      try {
        const testPayload = {
          test: true,
          timestamp: new Date().toISOString(),
          message: "Connection test from Phone Guard",
          destinationNumber: "34661216995",
          derivationId: "test-derivation-001",
          originNumber: "34604579589",
          group: "A",
          testId: "connection_test",
          leadId: "test_lead"
        }

        const testResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testPayload),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        const responseText = await testResponse.text()
        let responseData = null
        
        try {
          responseData = JSON.parse(responseText)
        } catch {
          // If response is not JSON, that's okay for N8N webhooks
        }

        if (testResponse.ok) {
          return NextResponse.json({ 
            ok: true, 
            message: "N8N webhook connection successful",
            webhook_url: webhookUrl,
            response_status: testResponse.status,
            response_data: responseData || responseText
          })
        } else {
          // Provide specific error messages based on status code
          let errorMessage = `N8N webhook test failed: ${testResponse.status} ${testResponse.statusText}`
          
          if (testResponse.status === 404) {
            errorMessage = "N8N webhook not found - check if the workflow URL is correct and the workflow is active"
          } else if (testResponse.status === 401) {
            errorMessage = "N8N webhook authentication failed - check if the workflow requires authentication"
          } else if (testResponse.status === 500) {
            errorMessage = "N8N webhook internal error - check your N8N workflow configuration"
          } else if (testResponse.status === 403) {
            errorMessage = "N8N webhook access forbidden - check N8N permissions"
          }
          
          return NextResponse.json({ 
            ok: false, 
            status: testResponse.status, 
            message: errorMessage,
            response_data: responseData || responseText,
            troubleshooting: {
              status_404: "Make sure the N8N workflow is active and the URL is correct",
              status_401: "Check if the workflow requires authentication",
              status_500: "Check your N8N workflow configuration and logs",
              status_403: "Check N8N permissions and workflow settings"
            }
          })
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return NextResponse.json({ 
            ok: false, 
            message: "N8N webhook timeout - webhook may be slow or unresponsive" 
          })
        }
        
        if (error instanceof Error && error.message.includes('fetch')) {
          return NextResponse.json({ 
            ok: false, 
            message: "Cannot reach N8N webhook - check if N8N instance is running and accessible" 
          })
        }
        
        return NextResponse.json({ 
          ok: false, 
          message: `N8N webhook error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        })
      }
    }

    if (provider === "whatsapp" || provider === "email" || provider === "sms") {
      // For these providers, just confirm credentials are present
      return NextResponse.json({ 
        ok: true, 
        message: `${provider} credentials present` 
      })
    }

    return NextResponse.json({ ok: false, message: "Unknown provider" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


