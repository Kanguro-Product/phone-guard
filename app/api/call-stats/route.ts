import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CallRotationService } from "@/lib/call-rotation"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = (searchParams.get("timeframe") as "today" | "week" | "month") || "today"

    const supabase = await createClient()

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[v0] Getting call stats for timeframe: ${timeframe}`)

    const rotationService = new CallRotationService(supabase)
    const stats = await rotationService.getCallStats(user.id, timeframe)

    if (!stats) {
      return NextResponse.json({ error: "Failed to fetch call stats" }, { status: 500 })
    }

    console.log(`[v0] Call stats retrieved:`, stats)

    return NextResponse.json({
      success: true,
      stats,
      timeframe,
    })
  } catch (error) {
    console.error("[v0] Call stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
