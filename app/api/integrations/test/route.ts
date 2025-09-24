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
      .select("api_key, api_secret, enabled")
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

    return NextResponse.json({ ok: false, message: "Unknown provider" }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


