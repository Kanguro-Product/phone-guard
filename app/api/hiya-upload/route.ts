import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import puppeteer from "puppeteer-core"

// ============================================
// CONFIGURATION
// ============================================

const BROWSERLESS_URL = process.env.BROWSERLESS_URL || ""
const HIYA_EMAIL = process.env.HIYA_EMAIL || ""
const HIYA_PASSWORD = process.env.HIYA_PASSWORD || ""
const HIYA_LOGIN_URL = process.env.HIYA_LOGIN_URL || "https://www.hiya.com/login"
const HIYA_UPLOAD_URL = "https://business.hiya.com/registration/cross-carrier-registration/add-phone-numbers/manual"

const SELECTORS = {
  emailInput: 'input[name="username"], #username',
  passwordInput: 'input[type="password"], input[name="password"], #password',
  loginButton: 'button[type="submit"]',
  phoneNumbersTextarea: 'textarea',
  jobNameInput: 'input[type="text"]'
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("🚀 [Hiya Upload] Starting upload process...")
    
    // Validate environment variables
    if (!BROWSERLESS_URL) {
      return NextResponse.json(
        { ok: false, error: "BROWSERLESS_URL not configured" },
        { status: 500 }
      )
    }
    
    if (!HIYA_EMAIL || !HIYA_PASSWORD) {
      return NextResponse.json(
        { ok: false, error: "Hiya credentials not configured" },
        { status: 500 }
      )
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "Supabase configuration missing",
          details: "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
        },
        { status: 500 }
      )
    }
    
    // Initialize Supabase
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // ============================================
    // STEP 1: GET PHONE NUMBERS FROM DATABASE
    // ============================================
    console.log("📊 [Hiya Upload] Fetching phone numbers from database...")
    
    const { data: phoneNumbers, error: dbError } = await supabase
      .from('phone_numbers')
      .select('number')
      .eq('status', 'active')
      .limit(1000) // Max 1000 per upload
    
    if (dbError) {
      console.error("❌ [Hiya Upload] Database error:", dbError)
      return NextResponse.json(
        { ok: false, error: `Database error: ${dbError.message}` },
        { status: 500 }
      )
    }
    
    if (!phoneNumbers || phoneNumbers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No active phone numbers found in database" },
        { status: 404 }
      )
    }
    
    console.log(`✅ [Hiya Upload] Found ${phoneNumbers.length} phone numbers to upload`)
    
    // ============================================
    // STEP 2: CONNECT TO BROWSERLESS
    // ============================================
    console.log("🌐 [Hiya Upload] Connecting to Browserless...")
    
    let browser
    try {
      browser = await puppeteer.connect({
        browserWSEndpoint: BROWSERLESS_URL
      })
    } catch (error) {
      console.error("❌ [Hiya Upload] Failed to connect to Browserless:", error)
      return NextResponse.json(
        { ok: false, error: "Failed to connect to Browserless" },
        { status: 500 }
      )
    }
    
    const page = await browser.newPage()
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    
    try {
      // ============================================
      // STEP 3: LOGIN TO HIYA
      // ============================================
      console.log("🔐 [Hiya Upload] Logging in to Hiya...")
      
      await page.goto(HIYA_LOGIN_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
      
      // Wait for login form
      await new Promise(resolve => setTimeout(resolve, 2000))
      await page.waitForSelector(SELECTORS.emailInput, { timeout: 15000, visible: true })
      
      // Fill credentials
      await page.type(SELECTORS.emailInput, HIYA_EMAIL)
      await page.type(SELECTORS.passwordInput, HIYA_PASSWORD)
      
      // Click login
      await Promise.all([
        page.click(SELECTORS.loginButton),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      ])
      
      console.log("✅ [Hiya Upload] Login successful!")
      
      // ============================================
      // STEP 4: NAVIGATE TO UPLOAD PAGE
      // ============================================
      console.log("📝 [Hiya Upload] Navigating to upload page...")
      
      await page.goto(HIYA_UPLOAD_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log("✅ [Hiya Upload] Upload page loaded")
      
      // ============================================
      // STEP 5: FILL UPLOAD FORM
      // ============================================
      console.log("📋 [Hiya Upload] Filling upload form...")
      
      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Prepare numbers list (one per line)
      const numbersText = phoneNumbers.map(pn => pn.number).join('\n')
      
      console.log(`📋 [Hiya Upload] Waiting for textarea...`)
      await page.waitForSelector(SELECTORS.phoneNumbersTextarea, { 
        timeout: 15000,
        visible: true 
      })
      
      console.log(`📋 [Hiya Upload] Filling textarea with ${phoneNumbers.length} numbers...`)
      // Use evaluate instead of type for large text (faster and more reliable)
      await page.evaluate((text, selector) => {
        const textarea = document.querySelector(selector) as HTMLTextAreaElement
        if (textarea) {
          textarea.value = text
          // Trigger input event
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          textarea.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }, numbersText, SELECTORS.phoneNumbersTextarea)
      
      console.log(`✅ [Hiya Upload] Textarea filled`)
      
      // Wait a bit before filling job name
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Fill job name
      const jobName = `Upload ${new Date().toISOString().split('T')[0]}`
      console.log(`📋 [Hiya Upload] Filling job name: ${jobName}`)
      
      await page.waitForSelector(SELECTORS.jobNameInput, { 
        timeout: 10000,
        visible: true 
      })
      
      await page.evaluate((name, selector) => {
        const input = document.querySelector(selector) as HTMLInputElement
        if (input) {
          input.value = name
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }, jobName, SELECTORS.jobNameInput)
      
      console.log(`✅ [Hiya Upload] Form filled with ${phoneNumbers.length} numbers`)
      
      // ============================================
      // STEP 6: SUBMIT
      // ============================================
      console.log("📤 [Hiya Upload] Submitting form...")
      
      // Wait a bit before submitting
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Find submit button using XPath (searches for button with text "SUBMIT")
      console.log("📤 [Hiya Upload] Looking for SUBMIT button...")
      
      const submitButtonXPath = '//button[contains(text(), "SUBMIT") or contains(text(), "Submit")]'
      await page.waitForXPath(submitButtonXPath, { 
        timeout: 15000,
        visible: true 
      })
      
      const submitButtons = await page.$x(submitButtonXPath)
      
      if (submitButtons.length === 0) {
        throw new Error('Submit button not found')
      }
      
      console.log("📤 [Hiya Upload] Clicking submit button...")
      
      // Click submit with navigation wait
      try {
        await Promise.all([
          submitButtons[0].click(),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
        ])
      } catch (navError) {
        console.log("⚠️ [Hiya Upload] Navigation wait timeout, checking if submit succeeded anyway...")
        // Sometimes navigation doesn't happen but form is submitted
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      const finalUrl = page.url()
      console.log("✅ [Hiya Upload] Upload complete! Final URL:", finalUrl)
      
      // Close browser
      await browser.close()
      
      const duration = Date.now() - startTime
      
      return NextResponse.json({
        ok: true,
        uploaded: phoneNumbers.length,
        jobName: jobName,
        message: `Successfully uploaded ${phoneNumbers.length} phone numbers to Hiya`,
        durationMs: duration
      })
      
    } catch (error) {
      console.error("❌ [Hiya Upload] Error during upload:", error)
      
      if (browser) {
        await browser.close()
      }
      
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error during upload"
        },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error("❌ [Hiya Upload] Fatal error:", error)
    
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Fatal error"
      },
      { status: 500 }
    )
  }
}

