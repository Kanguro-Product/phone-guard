import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardPageClient } from "@/components/dashboard-page-client"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get dashboard metrics
  const { data: metrics } = await supabase.from("dashboard_metrics").select("*").eq("user_id", user.id).single()

  // Get recent calls for activity feed
  const { data: recentCalls } = await supabase
    .from("calls")
    .select(`
      *,
      phone_numbers (number, provider)
    `)
    .eq("user_id", user.id)
    .order("call_time", { ascending: false })
    .limit(10)

  // Get phone numbers for reputation tracking
  const { data: phoneNumbers } = await supabase
    .from("phone_numbers")
    .select("*")
    .eq("user_id", user.id)
    .order("reputation_score", { ascending: false })

  // Get calls data for the last 7 days for charts
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: weekCalls } = await supabase
    .from("calls")
    .select("*")
    .eq("user_id", user.id)
    .gte("call_time", sevenDaysAgo.toISOString())
    .order("call_time", { ascending: true })

  const stats = metrics || {
    total_numbers: 0,
    active_numbers: 0,
    spam_numbers: 0,
    avg_reputation: 0,
    total_cadences: 0,
    active_cadences: 0,
    total_calls_today: 0,
    successful_calls_today: 0,
    spam_calls_today: 0,
  }

  return (
    <DashboardPageClient
      user={user}
      stats={stats}
      phoneNumbers={phoneNumbers || []}
      recentCalls={recentCalls || []}
      weekCalls={weekCalls || []}
    />
  )
}
