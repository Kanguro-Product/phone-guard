import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import puppeteer from "puppeteer-core"

// ============================================
// CONFIGURATION
// ============================================

const BROWSERLESS_URL = process.env.BROWSERLESS_URL || ""
const HIYA_EMAIL = process.env.HIYA_EMAIL || ""
const HIYA_PASSWORD = process.env.HIYA_PASSWORD || ""
const HIYA_LOGIN_URL = process.env.HIYA_LOGIN_URL || "https://www.hiya.com/login"
const HIYA_TRACKED_URL = process.env.HIYA_TRACKED_URL || "https://dashboard.hiya.com/tracked"
const MAX_PER_RUN = parseInt(process.env.MAX_PER_RUN || "200")
const RATE_LIMIT_MINUTES = parseInt(process.env.RATE_LIMIT_MINUTES || "5")

// ============================================
// SELECTOR CONFIGURATION
// 🎯 ADJUST THESE AFTER FIRST RUN
// ============================================
const SELECTORS = {
  // Login page selectors
  emailInput: 'input[type="email"], input[name="email"], #email',
  passwordInput: 'input[type="password"], input[name="password"], #password',
  loginButton: 'button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")',
  
  // Tracked numbers page selectors
  tableRows: 'table tbody tr, .table-row, [role="row"]',
  
  // Column selectors (adjust based on actual HTML structure)
  // Example: if columns are: Phone | Label | Score | Last Seen
  phoneCell: 'td:nth-child(1), [data-column="phone"]',
  labelCell: 'td:nth-child(2), [data-column="label"]',
  scoreCell: 'td:nth-child(3), [data-column="score"]',
  lastSeenCell: 'td:nth-child(4), [data-column="last_seen"]',
  
  // Pagination
  nextPageButton: 'button:has-text("Next"), .pagination-next, [aria-label="Next page"]'
}

// ============================================
// SPAM DETECTION KEYWORDS
// ============================================
const SPAM_KEYWORDS = [
  'spam',
  'scam',
  'fraud',
  'robocall',
  'telemarketer',
  'suspicious',
  'blocked',
  'reported'
]

// ============================================
// TYPES
// ============================================
interface ScrapedRow {
  phone: string
  label: string | null
  score: number | null
  last_seen: string | null
  is_spam: boolean
  raw: any
}

// ============================================
// MAIN API HANDLER
// ============================================
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("🚀 [Hiya Scrape] Starting scraping process...")
    
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
    
    // Initialize Supabase with service role
    const supabase = await createClient()
    
    // Get authenticated user (for logging purposes)
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null
    
    // ============================================
    // STEP 1: RATE LIMIT CHECK
    // ============================================
    console.log("⏰ [Hiya Scrape] Checking rate limit...")
    
    const { data: lastRun, error: lastRunError } = await supabase
      .rpc('get_last_hiya_scrape')
      .single()
    
    if (!lastRunError && lastRun) {
      const minutesSinceLastRun = lastRun.minutes_since_last_run || 999
      
      if (minutesSinceLastRun < RATE_LIMIT_MINUTES) {
        const minutesRemaining = Math.ceil(RATE_LIMIT_MINUTES - minutesSinceLastRun)
        
        return NextResponse.json(
          {
            ok: false,
            error: `Rate limit exceeded. Please wait ${minutesRemaining} more minute(s).`,
            retryAfterMinutes: minutesRemaining
          },
          { status: 429 }
        )
      }
    }
    
    console.log("✅ [Hiya Scrape] Rate limit OK, proceeding...")
    
    // ============================================
    // STEP 2: CHECK PREVIEW MODE AND DIAGNOSTIC MODE
    // ============================================
    const isPreview = request.nextUrl.searchParams.get('preview') === 'true'
    const isDiagnostic = request.nextUrl.searchParams.get('diagnostic') === 'true'
    
    if (isPreview) {
      console.log("👁️ [Hiya Scrape] Preview mode enabled (first row only)")
    }
    
    if (isDiagnostic) {
      console.log("🔍 [Hiya Scrape] Diagnostic mode enabled")
    }
    
    // ============================================
    // STEP 3: DIAGNOSTIC MODE - CHECK CONFIGURATION
    // ============================================
    if (isDiagnostic) {
      console.log("🔍 [Hiya Scrape] Running diagnostic checks...")
      
      const diagnostic = {
        envVars: false,
        browserlessUrl: false,
        hiyaCredentials: false,
        browserlessConnection: false,
        database: false,
        errors: [] as string[],
        suggestions: [] as string[]
      }
      
      // Check environment variables
      if (BROWSERLESS_URL && HIYA_EMAIL && HIYA_PASSWORD) {
        diagnostic.envVars = true
      } else {
        diagnostic.errors.push("Faltan variables de entorno")
        if (!BROWSERLESS_URL) diagnostic.suggestions.push("Configura BROWSERLESS_URL en Vercel")
        if (!HIYA_EMAIL) diagnostic.suggestions.push("Configura HIYA_EMAIL en Vercel")
        if (!HIYA_PASSWORD) diagnostic.suggestions.push("Configura HIYA_PASSWORD en Vercel")
      }
      
      // Check Browserless URL format
      if (BROWSERLESS_URL) {
        if (BROWSERLESS_URL.startsWith('wss://') && BROWSERLESS_URL.includes('token=')) {
          diagnostic.browserlessUrl = true
        } else {
          diagnostic.errors.push("BROWSERLESS_URL tiene formato incorrecto")
          diagnostic.suggestions.push("Formato correcto: wss://chrome.browserless.io?token=TU_TOKEN")
        }
      }
      
      // Check Hiya credentials
      if (HIYA_EMAIL && HIYA_PASSWORD) {
        if (HIYA_EMAIL.includes('@') && HIYA_PASSWORD.length > 0) {
          diagnostic.hiyaCredentials = true
        } else {
          diagnostic.errors.push("Credenciales de Hiya inválidas")
          diagnostic.suggestions.push("Verifica que HIYA_EMAIL sea un email válido y HIYA_PASSWORD no esté vacío")
        }
      }
      
      // Test database connection
      try {
        const { data, error } = await supabase
          .from('hiya_numbers')
          .select('count')
          .limit(1)
        
        if (!error) {
          diagnostic.database = true
        } else {
          diagnostic.errors.push(`Error de base de datos: ${error.message}`)
          diagnostic.suggestions.push("Verifica que las tablas hiya_numbers y hiya_runs existan en Supabase")
        }
      } catch (error) {
        diagnostic.errors.push("No se pudo conectar a la base de datos")
        diagnostic.suggestions.push("Verifica la configuración de Supabase")
      }
      
      // Test Browserless connection
      if (diagnostic.browserlessUrl) {
        try {
          const browser = await puppeteer.connect({
            browserWSEndpoint: BROWSERLESS_URL,
            timeout: 10000 // 10 second timeout for diagnostic
          })
          
          await browser.close()
          diagnostic.browserlessConnection = true
        } catch (error) {
          diagnostic.errors.push(`Error conectando a Browserless: ${error instanceof Error ? error.message : 'Unknown error'}`)
          diagnostic.suggestions.push("Verifica que tu token de Browserless sea válido y tengas horas disponibles")
        }
      }
      
      return NextResponse.json({
        ok: true,
        diagnostic: diagnostic
      })
    }
    
    // ============================================
    // STEP 4: CONNECT TO BROWSERLESS
    // ============================================
    console.log("🌐 [Hiya Scrape] Connecting to Browserless...")
    
    let browser
    try {
      browser = await puppeteer.connect({
        browserWSEndpoint: BROWSERLESS_URL
      })
    } catch (error) {
      console.error("❌ [Hiya Scrape] Failed to connect to Browserless:", error)
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to connect to Browserless. Check your BROWSERLESS_URL."
        },
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
      // STEP 4: LOGIN TO HIYA
      // ============================================
      console.log("🔐 [Hiya Scrape] Navigating to login page...")
      
      await page.goto(HIYA_LOGIN_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
      
      console.log("📝 [Hiya Scrape] Entering credentials...")
      
      // Wait for login form
      await page.waitForSelector(SELECTORS.emailInput, { timeout: 10000 })
      
      // Fill email
      await page.type(SELECTORS.emailInput, HIYA_EMAIL)
      
      // Fill password
      await page.type(SELECTORS.passwordInput, HIYA_PASSWORD)
      
      // Click login button
      console.log("🔑 [Hiya Scrape] Submitting login form...")
      await Promise.all([
        page.click(SELECTORS.loginButton),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      ])
      
      // Check if login was successful
      const currentUrl = page.url()
      if (currentUrl.includes('login') || currentUrl.includes('error')) {
        throw new Error('Login failed. Check credentials or handle MFA/CAPTCHA manually.')
      }
      
      console.log("✅ [Hiya Scrape] Login successful!")
      
      // ============================================
      // STEP 5: NAVIGATE TO TRACKED NUMBERS
      // ============================================
      console.log("📊 [Hiya Scrape] Navigating to tracked numbers page...")
      
      await page.goto(HIYA_TRACKED_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
      
      // Wait for table to load
      await page.waitForSelector(SELECTORS.tableRows, { timeout: 10000 })
      
      console.log("✅ [Hiya Scrape] Table loaded!")
      
      // ============================================
      // STEP 6: SCRAPE DATA
      // ============================================
      console.log("🔍 [Hiya Scrape] Extracting data from table...")
      
      const scrapedRows: ScrapedRow[] = []
      let pagesScraped = 0
      let hasMorePages = true
      
      while (hasMorePages && scrapedRows.length < MAX_PER_RUN) {
        // Extract rows from current page
        const rowsData = await page.evaluate((selectors) => {
          const rows = document.querySelectorAll(selectors.tableRows)
          const data: any[] = []
          
          rows.forEach((row) => {
            const phoneEl = row.querySelector(selectors.phoneCell)
            const labelEl = row.querySelector(selectors.labelCell)
            const scoreEl = row.querySelector(selectors.scoreCell)
            const lastSeenEl = row.querySelector(selectors.lastSeenCell)
            
            if (phoneEl) {
              data.push({
                phone: phoneEl.textContent?.trim() || '',
                label: labelEl?.textContent?.trim() || null,
                score: scoreEl?.textContent?.trim() || null,
                lastSeen: lastSeenEl?.textContent?.trim() || null,
                rawHtml: row.outerHTML
              })
            }
          })
          
          return data
        }, SELECTORS)
        
        console.log(`📄 [Hiya Scrape] Found ${rowsData.length} rows on page ${pagesScraped + 1}`)
        
        // Process rows
        for (const row of rowsData) {
          if (scrapedRows.length >= MAX_PER_RUN) break
          
          // Determine if spam based on keywords
          const textToCheck = `${row.label || ''} ${row.score || ''}`.toLowerCase()
          const isSpam = SPAM_KEYWORDS.some(keyword => textToCheck.includes(keyword))
          
          // Parse score if it's a number
          const scoreValue = row.score ? parseFloat(row.score) : null
          
          scrapedRows.push({
            phone: row.phone,
            label: row.label,
            score: scoreValue,
            last_seen: row.lastSeen,
            is_spam: isSpam,
            raw: row
          })
          
          // If preview mode, stop after first row
          if (isPreview && scrapedRows.length === 1) {
            hasMorePages = false
            break
          }
        }
        
        pagesScraped++
        
        // Check if there's a next page button
        if (!isPreview && scrapedRows.length < MAX_PER_RUN) {
          try {
            const nextButton = await page.$(SELECTORS.nextPageButton)
            
            if (nextButton) {
              const isDisabled = await page.evaluate((btn) => {
                return btn.hasAttribute('disabled') || 
                       btn.classList.contains('disabled') ||
                       btn.getAttribute('aria-disabled') === 'true'
              }, nextButton)
              
              if (!isDisabled) {
                console.log("➡️ [Hiya Scrape] Navigating to next page...")
                await nextButton.click()
                await page.waitForTimeout(2000) // Wait for page to load
                await page.waitForSelector(SELECTORS.tableRows, { timeout: 10000 })
              } else {
                hasMorePages = false
              }
            } else {
              hasMorePages = false
            }
          } catch (error) {
            console.log("ℹ️ [Hiya Scrape] No more pages available")
            hasMorePages = false
          }
        } else {
          hasMorePages = false
        }
      }
      
      console.log(`✅ [Hiya Scrape] Scraped ${scrapedRows.length} total rows`)
      
      // ============================================
      // STEP 7: PREVIEW MODE - RETURN FIRST ROW
      // ============================================
      if (isPreview) {
        await browser.close()
        
        return NextResponse.json({
          ok: true,
          preview: true,
          firstRow: scrapedRows[0] || null,
          message: "Preview mode: Use this data to adjust selectors in SELECTORS config"
        })
      }
      
      // ============================================
      // STEP 8: UPSERT TO DATABASE
      // ============================================
      console.log("💾 [Hiya Scrape] Saving to database...")
      
      let successCount = 0
      const errors: any[] = []
      
      for (const row of scrapedRows) {
        const { error } = await supabase
          .from('hiya_numbers')
          .upsert({
            phone: row.phone,
            is_spam: row.is_spam,
            label: row.label,
            score: row.score,
            last_seen: row.last_seen,
            checked_at: new Date().toISOString(),
            raw: row.raw
          }, {
            onConflict: 'phone'
          })
        
        if (error) {
          console.error(`❌ [Hiya Scrape] Error upserting ${row.phone}:`, error)
          errors.push({ phone: row.phone, error: error.message })
        } else {
          successCount++
        }
      }
      
      console.log(`✅ [Hiya Scrape] Saved ${successCount}/${scrapedRows.length} rows`)
      
      // ============================================
      // STEP 9: LOG RUN
      // ============================================
      const duration = Date.now() - startTime
      
      await supabase
        .from('hiya_runs')
        .insert({
          run_at: new Date().toISOString(),
          rows_count: successCount,
          success: errors.length === 0,
          error_message: errors.length > 0 ? `Failed to save ${errors.length} rows` : null,
          duration_ms: duration,
          user_id: userId
        })
      
      console.log(`🎉 [Hiya Scrape] Completed in ${duration}ms`)
      
      // Close browser
      await browser.close()
      
      return NextResponse.json({
        ok: true,
        checked: successCount,
        total: scrapedRows.length,
        pagesScraped,
        errors: errors.length > 0 ? errors : undefined,
        durationMs: duration
      })
      
    } catch (error) {
      console.error("❌ [Hiya Scrape] Error during scraping:", error)
      
      // Log failed run
      const duration = Date.now() - startTime
      await supabase
        .from('hiya_runs')
        .insert({
          run_at: new Date().toISOString(),
          rows_count: 0,
          success: false,
          error_message: error instanceof Error ? error.message : String(error),
          duration_ms: duration,
          user_id: userId
        })
      
      // Close browser if still open
      if (browser) {
        await browser.close()
      }
      
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error during scraping"
        },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error("❌ [Hiya Scrape] Fatal error:", error)
    
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Fatal error"
      },
      { status: 500 }
    )
  }
}

