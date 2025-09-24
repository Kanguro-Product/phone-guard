import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CallsPageClient } from "@/components/calls-page-client"

export default async function CallsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get cadences for the simulator
  const { data: cadences } = await supabase
    .from("cadences")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get recent calls with related data
  const { data: calls } = await supabase
    .from("calls")
    .select(`
      *,
      phone_numbers (number, provider),
      cadences (name)
    `)
    .eq("user_id", user.id)
    .order("call_time", { ascending: false })
    .limit(100)

  return <CallsPageClient user={user} cadences={cadences || []} calls={calls || []} />
}
