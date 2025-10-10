import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import puppeteer from "puppeteer-core"

// ============================================
// CONFIGURATION
// Updated: 2025-10-10 - Fixed login selectors for Hiya Auth0
// ============================================

const BROWSERLESS_URL = process.env.BROWSERLESS_URL || ""
const HIYA_EMAIL = process.env.HIYA_EMAIL || ""
const HIYA_PASSWORD = process.env.HIYA_PASSWORD || ""
const HIYA_LOGIN_URL = process.env.HIYA_LOGIN_URL || "https://www.hiya.com/login"
const HIYA_TRACKED_URL = process.env.HIYA_TRACKED_URL || "https://business.hiya.com/registration/cross-carrier-registration/phones"
const MAX_PER_RUN = parseInt(process.env.MAX_PER_RUN || "200")
const RATE_LIMIT_MINUTES = parseInt(process.env.RATE_LIMIT_MINUTES || "5")

// ============================================
// SELECTOR CONFIGURATION
// 🎯 ADJUST THESE AFTER FIRST RUN
// ============================================
const SELECTORS = {
  // Login page selectors
  emailInput: '#username',  // Hiya usa "username" no "email"
  passwordInput: '#password',
  loginButton: 'button[type="submit"]',
  
  // Tracked numbers page selectors
  tableRows: 'table tbody tr, .table-row, [role="row"]',
  
  // Column selectors for Hiya Business table
  // Columns: [1]Checkbox | [2]Phone | [3]Date+User | [4]Label | [5]Risk | [6]- | [7]Status
  phoneCell: 'td:nth-child(2)', // Phone number
  labelCell: 'td:nth-child(4)', // Business name/label
  scoreCell: 'td:nth-child(5)', // Risk level (Low risk, High risk, etc.)
  lastSeenCell: 'td:nth-child(3)', // Last updated date
  
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
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { 
          ok: false, 
          error: "Supabase configuration missing",
          details: "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Add them in Vercel → Settings → Environment Variables"
        },
        { status: 500 }
      )
    }
    
    // Initialize Supabase with service role for database writes
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
    
    // Note: userId is null when using service role
    const userId = null
    
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
        suggestions: [] as string[],
        detailedLogs: [] as string[] // New: detailed logs
      }
      
      // Check environment variables
      if (BROWSERLESS_URL && HIYA_EMAIL && HIYA_PASSWORD) {
        diagnostic.envVars = true
        diagnostic.detailedLogs.push("✅ Variables de entorno encontradas")
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
          diagnostic.detailedLogs.push("✅ BROWSERLESS_URL tiene formato correcto")
        } else {
          diagnostic.errors.push("BROWSERLESS_URL tiene formato incorrecto")
          diagnostic.suggestions.push("Formato correcto: wss://chrome.browserless.io?token=TU_TOKEN")
        }
      }
      
      // Check Hiya credentials
      if (HIYA_EMAIL && HIYA_PASSWORD) {
        if (HIYA_EMAIL.includes('@') && HIYA_PASSWORD.length > 0) {
          diagnostic.hiyaCredentials = true
          diagnostic.detailedLogs.push("✅ Credenciales de Hiya válidas")
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
          diagnostic.detailedLogs.push("✅ Conexión a base de datos exitosa")
        } else {
          diagnostic.errors.push(`Error de base de datos: ${error.message}`)
          diagnostic.suggestions.push("Verifica que las tablas hiya_numbers y hiya_runs existan en Supabase")
        }
      } catch (error) {
        diagnostic.errors.push("No se pudo conectar a la base de datos")
        diagnostic.suggestions.push("Verifica la configuración de Supabase")
      }
      
      // Test Browserless connection with detailed error handling
      if (diagnostic.browserlessUrl) {
        try {
          diagnostic.detailedLogs.push("🔄 Intentando conectar a Browserless...")
          
          const browser = await puppeteer.connect({
            browserWSEndpoint: BROWSERLESS_URL,
            timeout: 15000 // 15 second timeout for diagnostic
          })
          
          diagnostic.detailedLogs.push("✅ Conexión a Browserless exitosa")
          
          // Test opening a page
          const page = await browser.newPage()
          diagnostic.detailedLogs.push("✅ Página nueva creada exitosamente")
          
          // Test navigation
          await page.goto('https://www.google.com', { timeout: 10000 })
          diagnostic.detailedLogs.push("✅ Navegación a Google exitosa")
          
          await page.close()
          await browser.close()
          diagnostic.detailedLogs.push("✅ Navegador cerrado correctamente")
          
          diagnostic.browserlessConnection = true
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          diagnostic.errors.push(`Error conectando a Browserless: ${errorMessage}`)
          
          // Detailed error analysis
          if (errorMessage.includes('timeout')) {
            diagnostic.suggestions.push("Timeout: Browserless puede estar sobrecargado, intenta en unos minutos")
          } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            diagnostic.suggestions.push("Token inválido: Verifica que el token en BROWSERLESS_URL sea correcto")
          } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
            diagnostic.suggestions.push("Acceso denegado: Verifica que tengas horas disponibles en tu cuenta de Browserless")
          } else if (errorMessage.includes('ECONNREFUSED')) {
            diagnostic.suggestions.push("Conexión rechazada: Verifica que la URL de Browserless sea correcta")
          } else if (errorMessage.includes('WebSocket')) {
            diagnostic.suggestions.push("Error de WebSocket: Verifica que BROWSERLESS_URL use el protocolo wss://")
          } else {
            diagnostic.suggestions.push("Error desconocido: Verifica tu cuenta de Browserless y token")
          }
          
          diagnostic.detailedLogs.push(`❌ Error en conexión: ${errorMessage}`)
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
      console.log("📝 [Hiya Scrape] Using selector:", SELECTORS.emailInput)
      
      // Add extra wait for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Debug: Check what's on the page
      const pageDebug = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          usernameInput: document.querySelector('#username') ? 'FOUND' : 'NOT FOUND',
          passwordInput: document.querySelector('#password') ? 'FOUND' : 'NOT FOUND',
          allInputs: Array.from(document.querySelectorAll('input')).map(i => ({
            id: i.id, 
            name: i.name, 
            type: i.type
          }))
        }
      })
      
      console.log("🔍 [Hiya Scrape] Page debug:", JSON.stringify(pageDebug, null, 2))
      
      // Wait for login form with better error handling
      try {
        console.log("⏳ [Hiya Scrape] Waiting for username input...")
        await page.waitForSelector(SELECTORS.emailInput, { 
          timeout: 15000,
          visible: true 
        })
        console.log("✅ [Hiya Scrape] Username input found!")
      } catch (error) {
        // If selector fails, capture page info for debugging
        console.error("❌ [Hiya Scrape] Email input not found. Capturing page info...")
        
        const pageInfo = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'))
          return {
            url: window.location.href,
            title: document.title,
            inputs: inputs.map(input => ({
              type: input.type,
              name: input.name,
              id: input.id,
              placeholder: input.placeholder,
              className: input.className,
              outerHTML: input.outerHTML.substring(0, 200)
            })),
            buttons: Array.from(document.querySelectorAll('button')).map(btn => ({
              text: btn.textContent?.trim(),
              type: btn.type,
              className: btn.className,
              outerHTML: btn.outerHTML.substring(0, 200)
            }))
          }
        })
        
        console.log("🔍 [Hiya Scrape] Page info:", JSON.stringify(pageInfo, null, 2))
        
        // Take a screenshot for debugging
        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false })
        console.log("📸 [Hiya Scrape] Screenshot captured (base64, first 100 chars):", screenshot.substring(0, 100))
        
        // Close browser before throwing
        await browser.close()
        
        // Return detailed error with page info
        return NextResponse.json({
          ok: false,
          error: "Login form not found - selectors may need updating",
          debug: {
            selectorTest: selectorTest,
            currentSelector: SELECTORS.emailInput,
            pageInfo: pageInfo,
            screenshot: screenshot.substring(0, 1000) + "...", // Truncate for response size
            suggestions: [
              "The login page structure has changed",
              `Current selector being used: ${SELECTORS.emailInput}`,
              `Selector test result: ${selectorTest.found ? 'FOUND ✅' : 'NOT FOUND ❌'}`,
              `Found ${pageInfo.inputs.length} input fields on the page`,
              "Check Vercel Function logs for full screenshot and details"
            ]
          }
        }, { status: 500 })
      }
      
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
      console.log("🔍 [Hiya Scrape] Current URL after login:", currentUrl)
      
      if (currentUrl.includes('login') || currentUrl.includes('error')) {
        throw new Error('Login failed. Check credentials or handle MFA/CAPTCHA manually.')
      }
      
      console.log("✅ [Hiya Scrape] Login successful!")
      
      // ============================================
      // STEP 5: NAVIGATE TO TRACKED NUMBERS PAGE
      // ============================================
      console.log("📊 [Hiya Scrape] Navigating to tracked numbers page...")
      
      // Wait a bit for any redirects to complete
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const afterLoginUrl = page.url()
      console.log("🔍 [Hiya Scrape] URL after login:", afterLoginUrl)
      
      // Always navigate to the tracked numbers page
      console.log("🔍 [Hiya Scrape] Navigating to:", HIYA_TRACKED_URL)
      
      await page.goto(HIYA_TRACKED_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
      
      const finalUrl = page.url()
      console.log("✅ [Hiya Scrape] Now at:", finalUrl)
      
      // Wait for table to load
      console.log("🔍 [Hiya Scrape] Looking for table with selector:", SELECTORS.tableRows)
      
      // Wait a bit for page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Check what's on the page before waiting
      const tableDebug = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          hasTables: document.querySelectorAll('table').length,
          hasTbody: document.querySelectorAll('tbody').length,
          hasTr: document.querySelectorAll('tr').length,
          hasTableRows: document.querySelectorAll('.table-row').length,
          hasRoleRow: document.querySelectorAll('[role="row"]').length,
          allTables: Array.from(document.querySelectorAll('table')).map((table, i) => ({
            index: i,
            rows: table.querySelectorAll('tr').length,
            className: table.className,
            id: table.id
          })),
          // Get first 5 elements that might be rows
          possibleRows: Array.from(document.querySelectorAll('div[class*="row"], li, tr')).slice(0, 10).map(el => ({
            tag: el.tagName,
            className: el.className,
            id: el.id,
            text: el.textContent?.substring(0, 100)
          }))
        }
      })
      
      console.log("🔍 [Hiya Scrape] Table debug:", JSON.stringify(tableDebug, null, 2))
      
      try {
        await page.waitForSelector(SELECTORS.tableRows, { timeout: 10000 })
        console.log("✅ [Hiya Scrape] Table loaded!")
      } catch (error) {
        // If table not found, return debug info
        await browser.close()
        return NextResponse.json({
          ok: false,
          error: "Table not found on tracked numbers page",
          debug: {
            pageInfo: tableDebug,
            suggestions: [
              "The table structure has changed or uses different selectors",
              `Found ${tableDebug.hasTables} <table> elements`,
              `Found ${tableDebug.hasTr} <tr> elements`,
              `Found ${tableDebug.hasRoleRow} elements with role="row"`,
              "Check the page structure and update SELECTORS.tableRows",
              "You may need to navigate to a different page within the Hiya dashboard"
            ]
          }
        }, { status: 500 })
      }
      
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
                await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for page to load
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

