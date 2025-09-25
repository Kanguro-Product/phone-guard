import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getIntegrationCredentials } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get credentials for all APIs
    const [numverify, openai, hiya] = await Promise.all([
      getIntegrationCredentials(supabase, user.id, "numverify"),
      getIntegrationCredentials(supabase, user.id, "openai"),
      getIntegrationCredentials(supabase, user.id, "hiya")
    ])

    const quotas = {
      numverify: { remaining: null, total: null, loading: false },
      openai: { remaining: null, total: null, loading: false },
      hiya: { remaining: null, total: null, loading: false }
    }

    // Check Numverify quota
    if (numverify?.api_key) {
      try {
        // Numverify doesn't have a direct quota endpoint, so we'll simulate it
        // In a real implementation, you'd need to track usage in your database
        quotas.numverify = {
          remaining: "N/A", // Numverify uses monthly limits
          total: "N/A",
          loading: false
        }
      } catch (error) {
        console.error("Error fetching Numverify quota:", error)
      }
    }

    // Check OpenAI quota (using usage API)
    if (openai?.api_key) {
      try {
        const response = await fetch("https://api.openai.com/v1/usage", {
          headers: {
            "Authorization": `Bearer ${openai.api_key}`,
            "Content-Type": "application/json"
          }
        })
        if (response.ok) {
          const data = await response.json()
          // OpenAI shows usage in dollars
          quotas.openai = {
            remaining: `$${data.total_usage ? (100 - data.total_usage).toFixed(2) : 'N/A'}`,
            total: "$100.00", // Assuming $100 monthly limit
            loading: false
          }
        } else {
          // If usage API fails, show generic info
          quotas.openai = {
            remaining: "Créditos disponibles",
            total: "N/A",
            loading: false
          }
        }
      } catch (error) {
        console.error("Error fetching OpenAI quota:", error)
        quotas.openai = {
          remaining: "Error al obtener",
          total: "N/A",
          loading: false
        }
      }
    }

    // Hiya is coming soon, so no quota check needed
    quotas.hiya = {
      remaining: null,
      total: null,
      loading: false
    }

    return NextResponse.json(quotas)

  } catch (error) {
    console.error("Error in quota API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
