import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminPageClient } from "@/components/admin-page-client"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  let isAdmin = false
  
  try {
    // Try user_profiles first
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (userProfile && !profileError) {
      isAdmin = userProfile.role === "admin"
    } else {
      // Fallback to users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (userData && !userError) {
        isAdmin = userData.role === "admin"
      }
    }
  } catch (error) {
    console.error("Error checking admin status:", error)
    isAdmin = false
  }

  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Get admin dashboard data
  const [{ data: allUsers }, { data: systemStats }, { data: recentLogs }, { data: systemSettings }] = await Promise.all(
    [
      supabase
        .from("user_profiles")
        .select(`
        *,
        phone_numbers:phone_numbers(count),
        cadences:cadences(count),
        calls:calls(count)
      `)
        .order("created_at", { ascending: false }),

      supabase.from("phone_numbers").select("status, reputation_score, spam_reports, created_at"),

      supabase
        .from("admin_logs")
        .select(`
        *,
        admin_profiles:user_profiles!admin_user_id(full_name, email),
        target_profiles:user_profiles!target_user_id(full_name, email)
      `)
        .order("created_at", { ascending: false })
        .limit(50),

      supabase.from("system_settings").select("*").order("key"),
    ],
  )

  return (
    <AdminPageClient
      user={user}
      allUsers={allUsers || []}
      systemStats={systemStats || []}
      recentLogs={recentLogs || []}
      systemSettings={systemSettings || []}
    />
  )
}
