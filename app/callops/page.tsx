import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CallOpsTrackerPage } from "@/components/callops/callops-tracker-page"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CallOpsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all tests for the user
  const { data: tests, error } = await supabase
    .from("tests")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching tests:", error)
  }

  // Get phone numbers for selection in test creation
  const { data: phoneNumbers } = await supabase
    .from("phone_numbers")
    .select("id, number, provider, status")
    .eq("user_id", user.id)
    .neq("status", "deprecated")
    .order("number", { ascending: true })

  return (
    <CallOpsTrackerPage 
      user={user} 
      initialTests={tests || []} 
      phoneNumbers={phoneNumbers || []}
    />
  )
}
