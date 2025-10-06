import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { spamValidator } from "@/lib/spam-validation"

export async function POST(request: NextRequest) {
  try {
    const { selectedAPIs } = await request.json()

    const supabase = await createClient()

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Default to all APIs if none specified
    const apisToUse = selectedAPIs || { numverify: true, openai: true, hiya: true }

    console.log(`[v0] Starting bulk SPAM validation for user: ${user.id}`)

    // Get all active phone numbers for the user
    const { data: phoneNumbers, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "inactive"])

    if (phoneError) {
      return NextResponse.json({ error: "Failed to fetch phone numbers" }, { status: 500 })
    }

    if (!phoneNumbers || phoneNumbers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No phone numbers to validate",
        results: [],
      })
    }

    console.log(`[v0] Found ${phoneNumbers.length} numbers to validate`)

    const results = []

    // Process numbers in batches to avoid overwhelming the APIs
    const batchSize = 3
    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, i + batchSize)

        const batchPromises = batch.map(async (phoneNumber) => {
        try {
          console.log(`[v0] Validating number: ${phoneNumber.number}`)

          const validationResult = await spamValidator.validateNumber(phoneNumber.number, apisToUse)

          // Update phone number reputation
          const newReputationScore = Math.max(0, Math.min(100, validationResult.overallResult.details.reputation))
          
          // Extract individual provider scores
          const numverifyResult = validationResult.providerResults?.find((p: any) => p.provider === "Numverify")
          const openaiResult = validationResult.providerResults?.find((p: any) => p.provider === "ChatGPT")
          
          const numverifyScore = numverifyResult ? Math.max(0, Math.min(100, numverifyResult.details.reputation)) : null
          const openaiScore = openaiResult ? Math.max(0, Math.min(100, openaiResult.details.reputation)) : null
          const averageScore = numverifyScore && openaiScore ? Math.round((numverifyScore + openaiScore + newReputationScore) / 3) : null

          const newStatus = validationResult.overallResult.isSpam ? "spam" : phoneNumber.status
          
          // Extract enrichment data from Numverify
          const enrichment = validationResult.providerResults?.find?.((p: any) => p.provider === "Numverify")?.details || {}
          
          console.log(`📝 [Bulk] Enrichment for ${phoneNumber.number}:`, {
            carrier: enrichment.carrier,
            line_type: enrichment.line_type,
            location: enrichment.location,
            numverifyScore,
            openaiScore
          })

          const updateData = {
            reputation_score: newReputationScore,
            numverify_score: numverifyScore,
            openai_score: openaiScore,
            average_reputation_score: averageScore,
            status: newStatus,
            spam_reports: validationResult.overallResult.details.reports,
            last_checked: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            carrier: enrichment.carrier || null,
            line_type: enrichment.line_type || null,
            country_code: enrichment.country_code || null,
            country_name: enrichment.country_name || null,
            location: enrichment.location || null,
          }

          // Update in database with enrichment data
          const { error: updateError } = await supabase
            .from("phone_numbers")
            .update(updateData)
            .eq("id", phoneNumber.id)
          
          if (updateError) {
            console.error(`❌ [Bulk] Error updating ${phoneNumber.number}:`, updateError)
          } else {
            console.log(`✅ [Bulk] Successfully updated ${phoneNumber.number}`)
          }

          // Log reputation change
          await supabase.from("reputation_logs").insert({
            phone_number_id: phoneNumber.id,
            old_score: phoneNumber.reputation_score,
            new_score: newReputationScore,
            reason: `Bulk validation: ${validationResult.overallResult.details.reason}`,
            source: "api_check",
            user_id: user.id,
          })

          return {
            phoneNumber: phoneNumber.number,
            success: true,
            oldReputation: phoneNumber.reputation_score,
            newReputation: newReputationScore,
            oldStatus: phoneNumber.status,
            newStatus: newStatus,
            isSpam: validationResult.overallResult.isSpam,
            confidence: validationResult.overallResult.confidence,
          }
        } catch (error) {
          console.error(`[v0] Error validating ${phoneNumber.number}:`, error)
          return {
            phoneNumber: phoneNumber.number,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add delay between batches to be respectful to APIs
      if (i + batchSize < phoneNumbers.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    const successCount = results.filter((r) => r.success).length
    const spamCount = results.filter((r) => r.success && r.isSpam).length

    console.log(
      `[v0] Bulk validation complete: ${successCount}/${phoneNumbers.length} successful, ${spamCount} spam detected`,
    )

    return NextResponse.json({
      success: true,
      message: `Validated ${successCount} of ${phoneNumbers.length} numbers`,
      spamDetected: spamCount,
      results,
    })
  } catch (error) {
    console.error("[v0] Bulk validation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
