import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NumbersPageClient } from "@/components/numbers-page-client"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function NumbersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get phone numbers with all fields - explicitly list enrichment fields to ensure they're fetched
  const { data: phoneNumbers, error } = await supabase
    .from("phone_numbers")
    .select(`
      *,
      carrier,
      line_type,
      location,
      country_code,
      country_name,
      numverify_score,
      openai_score,
      average_reputation_score,
      spam_reports
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  
  if (error) {
    console.error("Error fetching phone numbers:", error)
  }

  console.log("📱 Fetched phone numbers from server:", phoneNumbers?.length || 0)
  if (phoneNumbers && phoneNumbers.length > 0) {
    console.log("📊 Sample phone number from server:", {
      number: phoneNumbers[0].number,
      carrier: phoneNumbers[0].carrier,
      line_type: phoneNumbers[0].line_type,
      numverify_score: phoneNumbers[0].numverify_score,
      openai_score: phoneNumbers[0].openai_score
    })
  }

  return <NumbersPageClient user={user} initialNumbers={phoneNumbers || []} />
}
