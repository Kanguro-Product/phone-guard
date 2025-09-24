// Call rotation service for managing phone number selection in cadences
export interface RotationResult {
  phoneNumberId: string
  phoneNumber: string
  strategy: string
  reason: string
  metadata?: any
}

export interface CallLogEntry {
  phoneNumberId: string
  cadenceId?: string
  destinationNumber: string
  status: "success" | "failed" | "busy" | "no_answer" | "spam_detected"
  duration?: number
  cost?: number
  metadata?: any
}

export class CallRotationService {
  private supabase: any
  // Optionally, we could inject a Vonage client later

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient
  }

  async getNextPhoneNumber(cadenceId: string, userId: string): Promise<RotationResult | null> {
    console.log(`[v0] Getting next phone number for cadence: ${cadenceId}`)

    try {
      // Get cadence details
      const { data: cadence, error: cadenceError } = await this.supabase
        .from("cadences")
        .select("*")
        .eq("id", cadenceId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .single()

      if (cadenceError || !cadence) {
        console.error("[v0] Cadence not found or inactive:", cadenceError)
        return null
      }

      if (!cadence.phone_numbers || cadence.phone_numbers.length === 0) {
        console.error("[v0] No phone numbers in cadence")
        return null
      }

      // Get phone numbers details
      const { data: phoneNumbers, error: numbersError } = await this.supabase
        .from("phone_numbers")
        .select("*")
        .in("id", cadence.phone_numbers)
        .eq("user_id", userId)
        .eq("status", "active")

      if (numbersError || !phoneNumbers || phoneNumbers.length === 0) {
        console.error("[v0] No active phone numbers available:", numbersError)
        return null
      }

      console.log(`[v0] Found ${phoneNumbers.length} active numbers for rotation`)

      // Apply rotation strategy
      let selectedNumber
      let reason = ""

      switch (cadence.rotation_strategy) {
        case "random":
          selectedNumber = this.selectRandom(phoneNumbers)
          reason = "Random selection from available numbers"
          break

        case "reputation_based":
          selectedNumber = this.selectByReputation(phoneNumbers)
          reason = "Selected number with highest reputation score"
          break

        case "round_robin":
        default:
          selectedNumber = await this.selectRoundRobin(phoneNumbers, cadenceId)
          reason = "Round-robin rotation based on last usage"
          break
      }

      if (!selectedNumber) {
        console.error("[v0] No number selected by rotation strategy")
        return null
      }

      // Update last_checked timestamp
      await this.supabase
        .from("phone_numbers")
        .update({ last_checked: new Date().toISOString() })
        .eq("id", selectedNumber.id)

      console.log(`[v0] Selected number: ${selectedNumber.number} using ${cadence.rotation_strategy} strategy`)

      return {
        phoneNumberId: selectedNumber.id,
        phoneNumber: selectedNumber.number,
        strategy: cadence.rotation_strategy,
        reason,
        metadata: {
          provider: selectedNumber.provider,
          reputation: selectedNumber.reputation_score,
          cadenceName: cadence.name,
        },
      }
    } catch (error) {
      console.error("[v0] Error in phone number rotation:", error)
      return null
    }
  }

  private selectRandom(phoneNumbers: any[]): any {
    const randomIndex = Math.floor(Math.random() * phoneNumbers.length)
    return phoneNumbers[randomIndex]
  }

  private selectByReputation(phoneNumbers: any[]): any {
    // Sort by reputation score (highest first), then by random for ties
    const sorted = phoneNumbers.sort((a, b) => {
      if (b.reputation_score === a.reputation_score) {
        return Math.random() - 0.5 // Random for ties
      }
      return b.reputation_score - a.reputation_score
    })
    return sorted[0]
  }

  private async selectRoundRobin(phoneNumbers: any[], cadenceId: string): Promise<any> {
    // Get the last used number for this cadence
    const { data: lastCall } = await this.supabase
      .from("calls")
      .select("phone_number_id")
      .eq("cadence_id", cadenceId)
      .order("call_time", { ascending: false })
      .limit(1)
      .single()

    if (!lastCall) {
      // No previous calls, select first number
      return phoneNumbers[0]
    }

    // Find current number index
    const currentIndex = phoneNumbers.findIndex((n) => n.id === lastCall.phone_number_id)

    if (currentIndex === -1) {
      // Last used number not in current list, select first
      return phoneNumbers[0]
    }

    // Select next number in rotation
    const nextIndex = (currentIndex + 1) % phoneNumbers.length
    return phoneNumbers[nextIndex]
  }

  async logCall(callData: CallLogEntry, userId: string): Promise<boolean> {
    console.log(`[v0] Logging call:`, callData)

    try {
      // Insert call log
      const { error: callError } = await this.supabase.from("calls").insert({
        phone_number_id: callData.phoneNumberId,
        cadence_id: callData.cadenceId,
        destination_number: callData.destinationNumber,
        status: callData.status,
        duration: callData.duration,
        cost: callData.cost,
        call_time: new Date().toISOString(),
        metadata: callData.metadata,
        user_id: userId,
      })

      if (callError) {
        console.error("[v0] Error logging call:", callError)
        return false
      }

      // Update phone number reputation based on call result
      await this.updatePhoneReputation(callData.phoneNumberId, callData.status, userId)

      console.log("[v0] Call logged successfully")
      return true
    } catch (error) {
      console.error("[v0] Error in call logging:", error)
      return false
    }
  }

  private async updatePhoneReputation(phoneNumberId: string, callStatus: string, userId: string) {
    try {
      // Use the database function we created earlier
      const { error } = await this.supabase.rpc("update_phone_reputation", {
        phone_id: phoneNumberId,
        call_status: callStatus,
        user_id_param: userId,
      })

      if (error) {
        console.error("[v0] Error updating phone reputation:", error)
      } else {
        console.log(`[v0] Updated reputation for phone ${phoneNumberId} based on ${callStatus}`)
      }
    } catch (error) {
      console.error("[v0] Error calling reputation update function:", error)
    }
  }

  async getCallStats(userId: string, timeframe: "today" | "week" | "month" = "today") {
    console.log(`[v0] Getting call stats for ${timeframe}`)

    try {
      const startDate = new Date()

      switch (timeframe) {
        case "week":
          startDate.setDate(startDate.getDate() - 7)
          break
        case "month":
          startDate.setDate(startDate.getDate() - 30)
          break
        case "today":
        default:
          startDate.setHours(0, 0, 0, 0)
          break
      }

      const { data: calls, error } = await this.supabase
        .from("calls")
        .select("*")
        .eq("user_id", userId)
        .gte("call_time", startDate.toISOString())

      if (error) {
        console.error("[v0] Error fetching call stats:", error)
        return null
      }

      const stats = {
        total: calls.length,
        successful: calls.filter((c) => c.status === "success").length,
        failed: calls.filter((c) => c.status === "failed").length,
        spam: calls.filter((c) => c.status === "spam_detected").length,
        busy: calls.filter((c) => c.status === "busy").length,
        noAnswer: calls.filter((c) => c.status === "no_answer").length,
        totalDuration: calls.reduce((sum, c) => sum + (c.duration || 0), 0),
        totalCost: calls.reduce((sum, c) => sum + (c.cost || 0), 0),
        successRate: calls.length > 0 ? (calls.filter((c) => c.status === "success").length / calls.length) * 100 : 0,
      }

      console.log(`[v0] Call stats for ${timeframe}:`, stats)
      return stats
    } catch (error) {
      console.error("[v0] Error calculating call stats:", error)
      return null
    }
  }
}
