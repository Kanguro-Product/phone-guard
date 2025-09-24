// SPAM validation service with multiple providers
export interface SpamCheckResult {
  isSpam: boolean
  confidence: number
  provider: string
  details: {
    reputation: number
    reports: number
    category?: string
    reason?: string
  }
}

export interface SpamProvider {
  name: string
  checkNumber: (phoneNumber: string) => Promise<SpamCheckResult>
}

// Mock implementation of TrueCaller-like API
class TrueCallerProvider implements SpamProvider {
  name = "TrueCaller"

  async checkNumber(phoneNumber: string): Promise<SpamCheckResult> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock logic based on phone number patterns
    const lastDigits = phoneNumber.slice(-4)
    const numericValue = Number.parseInt(lastDigits)

    // Simulate different spam scenarios
    let isSpam = false
    let confidence = 0
    let reputation = 100
    let reports = 0
    let category = undefined
    let reason = undefined

    if (numericValue % 100 === 0) {
      // Numbers ending in 00 are likely spam
      isSpam = true
      confidence = 0.9
      reputation = 20
      reports = 15
      category = "telemarketing"
      reason = "Multiple user reports for telemarketing"
    } else if (numericValue % 50 === 0) {
      // Numbers ending in 50 are suspicious
      isSpam = true
      confidence = 0.6
      reputation = 45
      reports = 8
      category = "suspicious"
      reason = "Unusual calling patterns detected"
    } else if (numericValue % 25 === 0) {
      // Some numbers have low reputation but not spam
      isSpam = false
      confidence = 0.3
      reputation = 65
      reports = 2
      reason = "Few user reports, monitoring required"
    } else {
      // Most numbers are clean
      reputation = Math.max(80, 100 - (numericValue % 20))
      confidence = 0.1
    }

    return {
      isSpam,
      confidence,
      provider: this.name,
      details: {
        reputation,
        reports,
        category,
        reason,
      },
    }
  }
}

// Mock implementation of Hiya-like API
class HiyaProvider implements SpamProvider {
  name = "Hiya"

  async checkNumber(phoneNumber: string): Promise<SpamCheckResult> {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const lastDigits = phoneNumber.slice(-3)
    const numericValue = Number.parseInt(lastDigits)

    let isSpam = false
    let confidence = 0
    let reputation = 100
    let reports = 0
    let category = undefined
    let reason = undefined

    if (numericValue % 111 === 0) {
      isSpam = true
      confidence = 0.95
      reputation = 10
      reports = 25
      category = "scam"
      reason = "Confirmed scam number by multiple sources"
    } else if (numericValue % 77 === 0) {
      isSpam = true
      confidence = 0.7
      reputation = 35
      reports = 12
      category = "robocall"
      reason = "Automated calling system detected"
    } else {
      reputation = Math.max(75, 100 - (numericValue % 25))
      confidence = 0.05
    }

    return {
      isSpam,
      confidence,
      provider: this.name,
      details: {
        reputation,
        reports,
        category,
        reason,
      },
    }
  }
}

// Real Hiya API provider (basic skeleton). Falls back gracefully if request fails
export class HiyaApiProvider implements SpamProvider {
  name = "Hiya"
  private apiKey: string
  private apiSecret?: string

  constructor(apiKey: string, apiSecret?: string) {
    this.apiKey = apiKey
    this.apiSecret = apiSecret
  }

  async checkNumber(phoneNumber: string): Promise<SpamCheckResult> {
    try {
      // NOTE: Replace with real Hiya endpoint and auth when available
      const res = await fetch("https://api.hiya.com/placeholder/spam-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-API-SECRET": this.apiSecret || "",
        } as any,
        body: JSON.stringify({ phone_number: phoneNumber }),
      })

      if (!res.ok) throw new Error(`Hiya API error: ${res.status}`)
      const data: any = await res.json()

      const reputation = typeof data.reputation === "number" ? data.reputation : 70
      const reports = typeof data.reports === "number" ? data.reports : 0
      const isSpam = !!data.is_spam
      const confidence = typeof data.confidence === "number" ? data.confidence : 0.5
      const category = data.category
      const reason = data.reason || "Hiya API response"

      return {
        isSpam,
        confidence,
        provider: this.name,
        details: {
          reputation,
          reports,
          category,
          reason,
        },
      }
    } catch (e) {
      // Fallback to conservative values
      return {
        isSpam: false,
        confidence: 0.1,
        provider: this.name,
        details: {
          reputation: 70,
          reports: 0,
          reason: "Hiya API unavailable, using fallback",
        },
      }
    }
  }
}

// Numverify API provider (carrier/line-type/location). It doesn't return spam,
// but we derive a conservative reputation from line_type and presence of carrier.
export class NumverifyApiProvider implements SpamProvider {
  name = "Numverify"
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async checkNumber(phoneNumber: string): Promise<SpamCheckResult> {
    try {
      // Clean number per docs. International recommended; national needs country_code
      const numeric = phoneNumber.replace(/[^0-9]/g, "")
      const url = new URL("https://apilayer.net/api/validate")
      url.searchParams.set("access_key", this.apiKey)
      url.searchParams.set("number", numeric)
      // Heuristic: if user passed a national number (no '+'), hint a default country
      if (!phoneNumber.startsWith("+")) {
        // Default to Spain (ES) for national numbers in this app; adjust if needed
        url.searchParams.set("country_code", "ES")
      }
      // optionally: url.searchParams.set("format", "1")

      const res = await fetch(url.toString(), {
        headers: { "Content-Type": "application/json" },
        method: "GET",
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`Numverify API error: ${res.status}`)
      const data: any = await res.json()

      const valid = !!data.valid
      const lineType: string | undefined = data.line_type
      const carrier: string | undefined = data.carrier
      const location: string | undefined = data.location
      const countryName: string | undefined = data.country_name
      const countryCode: string | undefined = data.country_code

      // Derive a simple reputation score
      let reputation = 70
      if (valid) reputation += 10
      if (lineType === "mobile") reputation += 10
      if (lineType === "voip") reputation -= 10
      if (!carrier) reputation -= 10
      reputation = Math.max(0, Math.min(100, reputation))

      return {
        isSpam: false,
        confidence: 0.3,
        provider: this.name,
        details: {
          reputation,
          reports: 0,
          category: lineType,
          reason: `Carrier: ${carrier || "unknown"}; Location: ${location || countryName || "unknown"}`,
          carrier: carrier || null,
          line_type: lineType || null,
          country_name: countryName || null,
          country_code: countryCode || null,
          location: location || null,
        },
      }
    } catch (e) {
      return {
        isSpam: false,
        confidence: 0.1,
        provider: this.name,
        details: {
          reputation: 60,
          reports: 0,
          reason: "Numverify API unavailable, using fallback",
        },
      }
    }
  }
}

// Spam validation service
export class SpamValidationService {
  private providers: SpamProvider[]

  constructor(providers?: SpamProvider[]) {
    this.providers = providers && providers.length > 0 ? providers : [new TrueCallerProvider(), new HiyaProvider()]
  }

  async validateNumber(phoneNumber: string): Promise<{
    overallResult: SpamCheckResult
    providerResults: SpamCheckResult[]
  }> {
    console.log(`[v0] Starting SPAM validation for ${phoneNumber}`)

    try {
      // Check with all providers in parallel
      const results = await Promise.allSettled(this.providers.map((provider) => provider.checkNumber(phoneNumber)))

      const providerResults: SpamCheckResult[] = []

      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        if (result.status === "fulfilled") {
          providerResults.push(result.value)
          console.log(`[v0] ${this.providers[i].name} result:`, result.value)
        } else {
          console.error(`[v0] ${this.providers[i].name} failed:`, result.reason)
          // Add fallback result for failed provider
          providerResults.push({
            isSpam: false,
            confidence: 0,
            provider: this.providers[i].name,
            details: {
              reputation: 50,
              reports: 0,
              reason: "Provider unavailable",
            },
          })
        }
      }

      // Calculate overall result
      const overallResult = this.calculateOverallResult(providerResults)
      console.log(`[v0] Overall SPAM validation result:`, overallResult)

      return {
        overallResult,
        providerResults,
      }
    } catch (error) {
      console.error("[v0] SPAM validation error:", error)
      throw error
    }
  }

  private calculateOverallResult(results: SpamCheckResult[]): SpamCheckResult {
    if (results.length === 0) {
      return {
        isSpam: false,
        confidence: 0,
        provider: "combined",
        details: {
          reputation: 50,
          reports: 0,
          reason: "No validation data available",
        },
      }
    }

    // Weight results by confidence and provider reliability
    let totalWeight = 0
    let weightedSpamScore = 0
    let totalReports = 0
    let minReputation = 100
    let maxConfidence = 0
    const reasons: string[] = []

    results.forEach((result) => {
      const weight = result.confidence > 0 ? result.confidence : 0.1
      totalWeight += weight
      weightedSpamScore += result.isSpam ? weight : 0
      totalReports += result.details.reports
      minReputation = Math.min(minReputation, result.details.reputation)
      maxConfidence = Math.max(maxConfidence, result.confidence)

      if (result.details.reason) {
        reasons.push(`${result.provider}: ${result.details.reason}`)
      }
    })

    const spamProbability = totalWeight > 0 ? weightedSpamScore / totalWeight : 0
    const isSpam = spamProbability > 0.5
    const confidence = maxConfidence

    return {
      isSpam,
      confidence,
      provider: "combined",
      details: {
        reputation: minReputation,
        reports: totalReports,
        reason: reasons.join("; ") || "Combined analysis from multiple providers",
      },
    }
  }
}

// Singleton instance
export const spamValidator = new SpamValidationService()
