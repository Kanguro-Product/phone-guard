import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NumbersPageClient } from "@/components/numbers-page-client"

export default async function NumbersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get phone numbers
  const { data: phoneNumbers } = await supabase
    .from("phone_numbers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <NumbersPageClient user={user} initialNumbers={phoneNumbers || []} />
}
