import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumberId } = await request.json()

    if (!phoneNumberId) {
      return NextResponse.json({ error: "Phone number ID is required" }, { status: 400 })
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

    // Update the phone number status to 'deprecated' instead of deleting
    const { data, error } = await supabase
      .from("phone_numbers")
      .update({ 
        status: "deprecated",
        updated_at: new Date().toISOString()
      })
      .eq("id", phoneNumberId)
      .eq("user_id", user.id)
      .select()

    if (error) {
      console.error("Error deprecating phone number:", error)
      return NextResponse.json({ error: "Failed to deprecate phone number" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Número marcado como en desuso",
      phoneNumber: data[0]
    })

  } catch (error) {
    console.error("Error in deprecate API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
