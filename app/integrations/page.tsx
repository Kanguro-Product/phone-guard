import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { IntegrationsPageClient } from "@/components/integrations-page-client"

export default async function IntegrationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: integrations } = await supabase
    .from("integrations")
    .select("id, provider, enabled, metadata")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return <IntegrationsPageClient user={user} initialIntegrations={integrations || []} />
}


