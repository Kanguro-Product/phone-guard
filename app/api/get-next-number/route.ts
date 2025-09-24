import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CallRotationService } from "@/lib/call-rotation"

export async function POST(request: NextRequest) {
  try {
    const { cadenceId } = await request.json()

    if (!cadenceId) {
      return NextResponse.json({ error: "Cadence ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[v0] Getting next number for cadence: ${cadenceId}`)

    const rotationService = new CallRotationService(supabase)
    const result = await rotationService.getNextPhoneNumber(cadenceId, user.id)

    if (!result) {
      return NextResponse.json({ error: "No phone number available for rotation" }, { status: 404 })
    }

    console.log(`[v0] Next number selected:`, result)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error("[v0] Get next number API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
