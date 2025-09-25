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

  // Calculate dashboard metrics from real data
  const [
    { data: phoneNumbersData },
    { data: cadencesData },
    { data: callsTodayData }
  ] = await Promise.all([
    supabase
      .from("phone_numbers")
      .select("id, status, reputation_score, average_reputation_score")
      .eq("user_id", user.id),
    supabase
      .from("cadences")
      .select("id, is_active")
      .eq("user_id", user.id),
    supabase
      .from("calls")
      .select("id, status")
      .eq("user_id", user.id)
      .gte("call_time", new Date().toISOString().split('T')[0]) // Today's calls
  ])

  // Calculate metrics
  const totalNumbers = phoneNumbersData?.length || 0
  const activeNumbers = phoneNumbersData?.filter(p => p.status === 'active').length || 0
  const spamNumbers = phoneNumbersData?.filter(p => p.status === 'spam').length || 0
  
  // Use average_reputation_score if available, otherwise fallback to reputation_score
  const avgReputation = phoneNumbersData?.length > 0 
    ? phoneNumbersData.reduce((sum, p) => sum + (p.average_reputation_score || p.reputation_score || 0), 0) / phoneNumbersData.length
    : 0

  const totalCadences = cadencesData?.length || 0
  const activeCadences = cadencesData?.filter(c => c.is_active).length || 0
  
  const totalCallsToday = callsTodayData?.length || 0
  const successfulCallsToday = callsTodayData?.filter(c => c.status === 'success').length || 0
  const spamCallsToday = callsTodayData?.filter(c => c.status === 'spam_detected').length || 0

  const metrics = {
    total_numbers: totalNumbers,
    active_numbers: activeNumbers,
    spam_numbers: spamNumbers,
    avg_reputation: avgReputation,
    total_cadences: totalCadences,
    active_cadences: activeCadences,
    total_calls_today: totalCallsToday,
    successful_calls_today: successfulCallsToday,
    spam_calls_today: spamCallsToday,
  }

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

  const stats = metrics

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
