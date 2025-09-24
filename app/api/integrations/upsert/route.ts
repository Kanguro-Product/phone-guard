import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { provider, api_key, api_secret, enabled } = await request.json()

    if (!provider || !api_key) {
      return NextResponse.json({ error: "provider and api_key are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try update existing
    const { data: existing } = await supabase
      .from("integrations")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .single()

    if (existing?.id) {
      const payload: any = { enabled: enabled ?? true }
      if (api_key) payload.api_key = api_key
      if (api_secret) payload.api_secret = api_secret
      const { error } = await supabase.from("integrations").update(payload).eq("id", existing.id)
      if (error) throw error
      return NextResponse.json({ success: true, id: existing.id, action: "updated" })
    }

    const { data, error } = await supabase
      .from("integrations")
      .insert({ user_id: user.id, provider, api_key, api_secret: api_secret || null, enabled: enabled ?? true })
      .select("id")
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, id: data?.id, action: "created" })
  } catch (e) {
    console.error("[v0] integrations upsert error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


