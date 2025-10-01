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

    const credentials = {
      numverify: { 
        hasKey: !!numverify?.api_key,
        hasSecret: !!numverify?.api_secret,
        isConfigured: !!(numverify?.api_key)
      },
      openai: { 
        hasKey: !!openai?.api_key,
        hasSecret: !!openai?.api_secret,
        isConfigured: !!(openai?.api_key)
      },
      hiya: { 
        hasKey: !!hiya?.api_key,
        hasSecret: !!hiya?.api_secret,
        isConfigured: !!(hiya?.api_key)
      }
    }

    return NextResponse.json(credentials)

  } catch (error) {
    console.error("Error in credentials API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
