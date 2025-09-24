import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { HiyaApiProvider, NumverifyApiProvider, SpamValidationService } from "@/lib/spam-validation"
import { getIntegrationCredentials } from "@/lib/utils"

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

    // Get phone number
    const { data: phoneNumber, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("id", phoneNumberId)
      .eq("user_id", user.id)
      .single()

    if (phoneError || !phoneNumber) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 })
    }

    console.log(`[v0] Validating phone number: ${phoneNumber.number}`)

    // Build providers from integrations (Hiya/Numverify), fallback to mock
    const hiya = await getIntegrationCredentials(supabase, user.id, "hiya")
    const numverify = await getIntegrationCredentials(supabase, user.id, "numverify")
    // Load user default country for national numbers (optional future use)
    const { data: userProfile } = await supabase.from("users").select("default_country_code").eq("id", user.id).single()
    const providers = [] as any[]
    if (hiya?.api_key) providers.push(new HiyaApiProvider(hiya.api_key, hiya.api_secret))
    if (numverify?.api_key) providers.push(new NumverifyApiProvider(numverify.api_key))
    const selected = providers.length > 0 ? providers : undefined
    const validator = new SpamValidationService(selected)

    // Perform SPAM validation
    const validationResult = await validator.validateNumber(phoneNumber.number)

    // Update phone number reputation based on validation
    const newReputationScore = Math.max(0, Math.min(100, validationResult.overallResult.details.reputation))

    const newStatus = validationResult.overallResult.isSpam ? "spam" : phoneNumber.status

    // Update phone number in database
    const enrichment = validationResult.providerResults?.find?.((p: any) => p.provider === "Numverify")?.details || {}

    let { error: updateError } = await supabase
      .from("phone_numbers")
      .update({
        reputation_score: newReputationScore,
        status: newStatus,
        spam_reports: validationResult.overallResult.details.reports,
        last_checked: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        carrier: enrichment.carrier || null,
        line_type: enrichment.category || null,
        country_code: enrichment.country_code || null,
        country_name: enrichment.country_name || null,
        location: enrichment.location || null,
      })
      .eq("id", phoneNumberId)

    // Fallback for environments without enrichment columns applied yet
    if (updateError) {
      console.warn("[v0] Update with enrichment failed, retrying minimal update:", updateError)
      const retry = await supabase
        .from("phone_numbers")
        .update({
          reputation_score: newReputationScore,
          status: newStatus,
          spam_reports: validationResult.overallResult.details.reports,
          last_checked: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", phoneNumberId)

      if (retry.error) {
        console.error("[v0] Error updating phone number (retry):", retry.error)
        return NextResponse.json({ error: "Failed to update phone number" }, { status: 500 })
      }
    }

    // Log reputation change
    const { error: logError } = await supabase.from("reputation_logs").insert({
      phone_number_id: phoneNumberId,
      old_score: phoneNumber.reputation_score,
      new_score: newReputationScore,
      reason: `SPAM validation: ${validationResult.overallResult.details.reason}`,
      source: "api_check",
      user_id: user.id,
    })

    if (logError) {
      console.error("[v0] Error logging reputation change:", logError)
    }

    return NextResponse.json({
      success: true,
      validation: validationResult,
      updatedReputation: newReputationScore,
      updatedStatus: newStatus,
    })
  } catch (error) {
    console.error("[v0] SPAM validation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
