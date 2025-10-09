import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'

export async function GET(request: NextRequest) {
  console.log("🔍 [Debug Browserless] Starting debug...")
  
  const BROWSERLESS_URL = process.env.BROWSERLESS_URL
  const HIYA_EMAIL = process.env.HIYA_EMAIL
  const HIYA_PASSWORD = process.env.HIYA_PASSWORD
  
  const debug = {
    timestamp: new Date().toISOString(),
    envVars: {
      BROWSERLESS_URL: BROWSERLESS_URL ? `${BROWSERLESS_URL.substring(0, 20)}...` : 'NOT_SET',
      HIYA_EMAIL: HIYA_EMAIL ? `${HIYA_EMAIL.substring(0, 5)}...` : 'NOT_SET',
      HIYA_PASSWORD: HIYA_PASSWORD ? 'SET' : 'NOT_SET'
    },
    tests: [] as any[],
    errors: [] as string[]
  }
  
  // Test 1: Environment Variables
  debug.tests.push({
    test: "Environment Variables",
    status: BROWSERLESS_URL && HIYA_EMAIL && HIYA_PASSWORD ? "PASS" : "FAIL",
    details: {
      BROWSERLESS_URL_exists: !!BROWSERLESS_URL,
      HIYA_EMAIL_exists: !!HIYA_EMAIL,
      HIYA_PASSWORD_exists: !!HIYA_PASSWORD
    }
  })
  
  // Test 2: URL Format
  if (BROWSERLESS_URL) {
    const isValidFormat = BROWSERLESS_URL.startsWith('wss://') && BROWSERLESS_URL.includes('token=')
    debug.tests.push({
      test: "URL Format",
      status: isValidFormat ? "PASS" : "FAIL",
      details: {
        starts_with_wss: BROWSERLESS_URL.startsWith('wss://'),
        contains_token: BROWSERLESS_URL.includes('token='),
        url_length: BROWSERLESS_URL.length
      }
    })
  }
  
  // Test 3: Basic Connection
  if (BROWSERLESS_URL) {
    try {
      debug.tests.push({
        test: "Basic Connection",
        status: "TESTING",
        details: { message: "Attempting connection..." }
      })
      
      const browser = await puppeteer.connect({
        browserWSEndpoint: BROWSERLESS_URL,
        timeout: 10000
      })
      
      debug.tests[debug.tests.length - 1] = {
        test: "Basic Connection",
        status: "PASS",
        details: { message: "Connection successful" }
      }
      
      await browser.close()
      
    } catch (error: any) {
      console.error("❌ [Debug Browserless] Connection error:", error)
      console.error("❌ [Debug Browserless] Error type:", typeof error)
      console.error("❌ [Debug Browserless] Error constructor:", error?.constructor?.name)
      
      const errorDetails: any = {
        error_type: error?.constructor?.name || typeof error,
        raw_error: String(error),
      }
      
      // Intentar extraer información del ErrorEvent o WebSocket error
      if (error?.message) errorDetails.message = error.message
      if (error?.type) errorDetails.event_type = error.type
      if (error?.error) errorDetails.nested_error = String(error.error)
      if (error?.code) errorDetails.code = error.code
      if (error?.reason) errorDetails.reason = error.reason
      
      // Capturar todas las propiedades propias del objeto
      try {
        const props: any = {}
        for (const key in error) {
          if (error.hasOwnProperty(key)) {
            props[key] = String(error[key])
          }
        }
        errorDetails.properties = props
      } catch (e) {
        errorDetails.properties_error = String(e)
      }
      
      // Si es un Error estándar
      if (error instanceof Error) {
        errorDetails.stack = error.stack
        errorDetails.cause = error.cause ? String(error.cause) : undefined
      }
      
      debug.tests[debug.tests.length - 1] = {
        test: "Basic Connection",
        status: "FAIL",
        details: errorDetails
      }
      
      const errorMsg = error?.message || error?.reason || String(error)
      debug.errors.push(`Connection failed: ${errorMsg}`)
    }
  }
  
  // Test 4: Page Creation
  if (debug.tests.find(t => t.test === "Basic Connection" && t.status === "PASS")) {
    try {
      debug.tests.push({
        test: "Page Creation",
        status: "TESTING",
        details: { message: "Creating new page..." }
      })
      
      const browser = await puppeteer.connect({
        browserWSEndpoint: BROWSERLESS_URL!,
        timeout: 10000
      })
      
      const page = await browser.newPage()
      
      debug.tests[debug.tests.length - 1] = {
        test: "Page Creation",
        status: "PASS",
        details: { message: "Page created successfully" }
      }
      
      await page.close()
      await browser.close()
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debug.tests[debug.tests.length - 1] = {
        test: "Page Creation",
        status: "FAIL",
        details: { 
          error: errorMessage,
          error_type: error.constructor.name
        }
      }
      debug.errors.push(`Page creation failed: ${errorMessage}`)
    }
  }
  
  // Test 5: Navigation
  if (debug.tests.find(t => t.test === "Page Creation" && t.status === "PASS")) {
    try {
      debug.tests.push({
        test: "Navigation",
        status: "TESTING",
        details: { message: "Testing navigation..." }
      })
      
      const browser = await puppeteer.connect({
        browserWSEndpoint: BROWSERLESS_URL!,
        timeout: 10000
      })
      
      const page = await browser.newPage()
      await page.goto('https://www.google.com', { timeout: 8000 })
      
      debug.tests[debug.tests.length - 1] = {
        test: "Navigation",
        status: "PASS",
        details: { 
          message: "Navigation successful",
          title: await page.title()
        }
      }
      
      await page.close()
      await browser.close()
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      debug.tests[debug.tests.length - 1] = {
        test: "Navigation",
        status: "FAIL",
        details: { 
          error: errorMessage,
          error_type: error.constructor.name
        }
      }
      debug.errors.push(`Navigation failed: ${errorMessage}`)
    }
  }
  
  return NextResponse.json({
    ok: true,
    debug: debug
  })
}

