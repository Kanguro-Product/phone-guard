import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CadencesPageClient } from "@/components/cadences-page-client"

export default async function CadencesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get cadences
  const { data: cadences } = await supabase
    .from("cadences")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Get phone numbers for cadence creation
  const { data: phoneNumbers } = await supabase
    .from("phone_numbers")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")

  return <CadencesPageClient user={user} cadences={cadences || []} phoneNumbers={phoneNumbers || []} />
}
