import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Get count of phone numbers for the user
    const { count, error: countError } = await supabase
      .from("phone_numbers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["active", "inactive"])

    if (countError) {
      console.error("Error getting numbers count:", countError)
      return NextResponse.json({ error: "Failed to get count" }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })

  } catch (error) {
    console.error("Error in numbers count API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
