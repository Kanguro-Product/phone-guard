import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { HiyaApiProvider, NumverifyApiProvider, ChatGPTProvider, SpamValidationService } from "@/lib/spam-validation"
import { getIntegrationCredentials } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumberId, selectedAPIs } = await request.json()

    if (!phoneNumberId) {
      return NextResponse.json({ error: "Phone number ID is required" }, { status: 400 })
    }

    // Default to all APIs if none specified
    const apisToUse = selectedAPIs || { numverify: true, openai: true, hiya: true }

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

    // Build providers from integrations (Hiya/Numverify/ChatGPT), fallback to mock
    const hiya = await getIntegrationCredentials(supabase, user.id, "hiya")
    const numverify = await getIntegrationCredentials(supabase, user.id, "numverify")
    const chatgpt = await getIntegrationCredentials(supabase, user.id, "openai")
    // Load user default country for national numbers (optional future use)
    const { data: userProfile } = await supabase.from("users").select("default_country_code").eq("id", user.id).single()
    const providers = [] as any[]
    
    // Only add providers that are selected and have credentials
    if (apisToUse.hiya && hiya?.api_key) {
      providers.push(new HiyaApiProvider(hiya.api_key, hiya.api_secret))
    }
    if (apisToUse.numverify && numverify?.api_key) {
      providers.push(new NumverifyApiProvider(numverify.api_key))
    }
    if (apisToUse.openai && chatgpt?.api_key) {
      providers.push(new ChatGPTProvider(chatgpt.api_key))
    }
    
    // Use mock providers if no real APIs are configured
    let validator
    if (providers.length === 0) {
      console.log("[v0] No real APIs configured, using mock providers")
      validator = new SpamValidationService() // Uses default mock providers
    } else {
      validator = new SpamValidationService(providers)
    }

    // Perform SPAM validation
    const validationResult = await validator.validateNumber(phoneNumber.number)

    // Update phone number reputation based on validation
    const newReputationScore = Math.max(0, Math.min(100, validationResult.overallResult.details.reputation))
    const newSpamReports = phoneNumber.spam_reports + (validationResult.overallResult.isSpam ? 1 : 0)
    const newStatus = validationResult.overallResult.isSpam ? "spam" : phoneNumber.status

    // Extract individual provider scores
    const numverifyResult = validationResult.providerResults?.find((p: any) => p.provider === "Numverify")
    const openaiResult = validationResult.providerResults?.find((p: any) => p.provider === "ChatGPT")
    
    const numverifyScore = numverifyResult ? Math.max(0, Math.min(100, numverifyResult.details.reputation)) : null
    const openaiScore = openaiResult ? Math.max(0, Math.min(100, openaiResult.details.reputation)) : null
    const averageScore = numverifyScore && openaiScore ? Math.round((numverifyScore + openaiScore + newReputationScore) / 3) : null

    // Update phone number in database
    const enrichment = validationResult.providerResults?.find?.((p: any) => p.provider === "Numverify")?.details || {}

    let { error: updateError } = await supabase
      .from("phone_numbers")
      .update({
        reputation_score: newReputationScore,
        numverify_score: numverifyScore,
        openai_score: openaiScore,
        average_reputation_score: averageScore,
        status: newStatus,
        spam_reports: newSpamReports,
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
          numverify_score: numverifyScore,
          openai_score: openaiScore,
          average_reputation_score: averageScore,
          status: newStatus,
          spam_reports: newSpamReports,
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
      updatedAverageScore: averageScore,
      updatedStatus: newStatus,
    })
  } catch (error) {
    console.error("[v0] SPAM validation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
