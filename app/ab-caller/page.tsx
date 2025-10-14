/**
 * A/B Caller Tool Page
 * 
 * Main page for managing A/B call tests
 */

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { ABCallerPageClientRevolutionary as ABCallerPageClient } from "@/components/ab-caller/ab-caller-page-client-revolutionary"

export const metadata = {
  title: "A/B Caller Tool - Phone Guard",
  description: "Create and manage A/B calling tests with Vonage Voice, Meta WhatsApp, and Email"
}

export default async function ABCallerPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch existing tests
  const { data: tests, error: testsError } = await supabase
    .from("ab_tests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  if (testsError) {
    console.error("Error fetching tests:", testsError)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <main className="container mx-auto px-6 py-8">
        <ABCallerPageClient 
          initialTests={tests || []} 
          user={user} 
        />
      </main>
    </div>
  )
}

