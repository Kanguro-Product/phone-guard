import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CallRotationService } from "@/lib/call-rotation"

export async function POST(request: NextRequest) {
  try {
    const callData = await request.json()

    const requiredFields = ["phoneNumberId", "destinationNumber", "status"]
    for (const field of requiredFields) {
      if (!callData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate status
    const validStatuses = ["success", "failed", "busy", "no_answer", "spam_detected"]
    if (!validStatuses.includes(callData.status)) {
      return NextResponse.json({ error: "Invalid call status" }, { status: 400 })
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

    console.log(`[v0] Logging call:`, callData)

    const rotationService = new CallRotationService(supabase)
    const success = await rotationService.logCall(callData, user.id)

    if (!success) {
      return NextResponse.json({ error: "Failed to log call" }, { status: 500 })
    }

    console.log(`[v0] Call logged successfully`)

    return NextResponse.json({
      success: true,
      message: "Call logged successfully",
    })
  } catch (error) {
    console.error("[v0] Log call API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
