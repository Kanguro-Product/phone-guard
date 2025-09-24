"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Info, Link as LinkIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface IntegrationsPageClientProps {
  user: any
  initialIntegrations: Array<{
    id: string
    provider: string
    enabled: boolean
    metadata: any
  }>
}

const PROVIDER_HINT: Record<string, { key: string; secret?: string; doc?: string; help?: string }> = {
  vonage: {
    key: "API Key",
    secret: "API Secret",
    doc: "https://developer.vonage.com/",
    help:
      "Create a Vonage account, generate an API Key and Secret in the Dashboard → API settings. Paste them below.",
  },
  hiya: {
    key: "API Key",
    secret: "API Secret",
    doc: "https://developer.hiya.com/",
    help:
      "Request API access from Hiya, obtain your API credentials, and paste them below. Your plan must include spam reputation APIs.",
  },
  numverify: {
    key: "API Key",
    doc: "https://numverify.com/",
    help:
      "Sign up at numverify and copy your Access Key from the Dashboard. This adds carrier, line type and location data.",
  },
}

export function IntegrationsPageClient({ user, initialIntegrations }: IntegrationsPageClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [vonageId, setVonageId] = useState<string | undefined>(
    initialIntegrations.find((x) => x.provider.toLowerCase() === "vonage")?.id,
  )
  const [hiyaId, setHiyaId] = useState<string | undefined>(
    initialIntegrations.find((x) => x.provider.toLowerCase() === "hiya")?.id,
  )
  const [numverifyId, setNumverifyId] = useState<string | undefined>(
    initialIntegrations.find((x) => x.provider.toLowerCase() === "numverify")?.id,
  )
  const [vonageEnabled, setVonageEnabled] = useState(
    initialIntegrations.find((x) => x.provider.toLowerCase() === "vonage")?.enabled ?? true,
  )
  const [hiyaEnabled, setHiyaEnabled] = useState(
    initialIntegrations.find((x) => x.provider.toLowerCase() === "hiya")?.enabled ?? true,
  )
  const [numverifyEnabled, setNumverifyEnabled] = useState(
    initialIntegrations.find((x) => x.provider.toLowerCase() === "numverify")?.enabled ?? true,
  )
  const [vonage, setVonage] = useState<{ api_key: string; api_secret: string }>({ api_key: "", api_secret: "" })
  const [hiya, setHiya] = useState<{ api_key: string; api_secret: string }>({ api_key: "", api_secret: "" })
  const [numverify, setNumverify] = useState<{ api_key: string }>({ api_key: "" })

  const masked = useMemo(() => (value: string) => {
    if (!value) return ""
    if (value.length <= 6) return "••••••"
    return `${value.slice(0, 3)}••••••${value.slice(-3)}`
  }, [])

  const upsertProvider = async (
    provider: "vonage" | "hiya" | "numverify",
    values: { api_key: string; api_secret?: string },
    enabled: boolean,
  ) => {
    if (!provider) return
    if (!values.api_key && !((provider === "vonage" && vonageId) || (provider === "hiya" && hiyaId))) return
    const currentId = provider === "vonage" ? vonageId : provider === "hiya" ? hiyaId : numverifyId
    setLoading(provider)
    try {
      if (currentId) {
        const payload: any = { enabled }
        if (values.api_key) payload.api_key = values.api_key
        if (values.api_secret) payload.api_secret = values.api_secret
        const { error } = await supabase.from("integrations").update(payload).eq("id", currentId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("integrations")
          .insert({ user_id: user.id, provider, api_key: values.api_key, api_secret: values.api_secret || null, enabled })
          .select("id")
          .single()
        if (error) throw error
        if (provider === "vonage") setVonageId(data?.id)
        if (provider === "hiya") setHiyaId(data?.id)
        if (provider === "numverify") setNumverifyId(data?.id)
      }
      alert("Saved successfully")
    } catch (e) {
      console.error("Error saving integration", e)
      alert(
        "Save failed: " +
          ((e as any)?.message || "Unknown error") +
          "\nTip: Ensure 'integrations' table exists, RLS policies are applied, and your session is active.",
      )
    } finally {
      setLoading(null)
    }
  }

  const Disclaimer = () => (
    <div className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/40 p-3 rounded-md">
      <Info className="h-4 w-4 mt-0.5" />
      <div>
        <div className="font-medium text-foreground">How to configure integrations</div>
        <div>
          - Vonage: create an account, then get your API Key/Secret in Dashboard → API settings. Use a plan that
          supports voice calls.
        </div>
        <div>
          - Hiya: request developer access and obtain API credentials for spam reputation. Your plan must include the
          reputation API.
        </div>
        <div>Keys are stored per user and only visible to you. Secrets are masked and not displayed once saved.</div>
      </div>
    </div>
  )

  const testConnection = async (provider: "numverify" | "hiya" | "vonage") => {
    setLoading(provider)
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      const body = await res.json()
      if (!res.ok || body.ok === false) {
        alert(`Test failed: ${body.error || body.message || res.status}`)
      } else {
        alert(`Test ok: ${JSON.stringify(body).slice(0, 200)}`)
      }
    } catch (e: any) {
      alert(`Test error: ${e?.message || "unknown"}`)
    } finally {
      setLoading(null)
    }
  }

  // no-op: per-provider hints are shown inline in each card

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground text-balance">Integrations</h1>
            <p className="text-muted-foreground mt-2">Only Vonage (Calls) and Hiya (Spam) are supported right now</p>
          </div>
        </div>
        <Disclaimer />

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                <span>Vonage (Calls)</span>
                <Badge variant={vonageEnabled ? "default" : "secondary"}>{vonageEnabled ? "Enabled" : "Disabled"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="vonage_key">{PROVIDER_HINT.vonage.key}</Label>
                  <Input
                    id="vonage_key"
                    type="password"
                    placeholder={vonageId ? "••••••••••" : "paste your Vonage API key"}
                    value={vonage.api_key}
                    onChange={(e) => setVonage((v) => ({ ...v, api_key: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vonage_secret">{PROVIDER_HINT.vonage.secret}</Label>
                  <Input
                    id="vonage_secret"
                    type="password"
                    placeholder={vonageId ? "••••••••••" : "paste your Vonage API secret"}
                    value={vonage.api_secret}
                    onChange={(e) => setVonage((v) => ({ ...v, api_secret: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input id="vonage_enabled" type="checkbox" checked={vonageEnabled} onChange={(e) => setVonageEnabled(e.target.checked)} />
                  <Label htmlFor="vonage_enabled">Enabled</Label>
                </div>
                {PROVIDER_HINT.vonage.help && (
                  <div className="text-[11px] text-muted-foreground">{PROVIDER_HINT.vonage.help} Docs: {PROVIDER_HINT.vonage.doc}</div>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => testConnection("vonage")} disabled={loading === "vonage"}>
                    Test connection
                  </Button>
                  <Button onClick={() => upsertProvider("vonage", vonage, vonageEnabled)} disabled={loading === "vonage"}>
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                <span>Hiya (Spam Reputation)</span>
                <Badge variant={hiyaEnabled ? "default" : "secondary"}>{hiyaEnabled ? "Enabled" : "Disabled"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="hiya_key">{PROVIDER_HINT.hiya.key}</Label>
                  <Input
                    id="hiya_key"
                    type="password"
                    placeholder={hiyaId ? "••••••••••" : "paste your Hiya API key"}
                    value={hiya.api_key}
                    onChange={(e) => setHiya((v) => ({ ...v, api_key: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hiya_secret">{PROVIDER_HINT.hiya.secret}</Label>
                  <Input
                    id="hiya_secret"
                    type="password"
                    placeholder={hiyaId ? "••••••••••" : "paste your Hiya API secret"}
                    value={hiya.api_secret}
                    onChange={(e) => setHiya((v) => ({ ...v, api_secret: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input id="hiya_enabled" type="checkbox" checked={hiyaEnabled} onChange={(e) => setHiyaEnabled(e.target.checked)} />
                  <Label htmlFor="hiya_enabled">Enabled</Label>
                </div>
                {PROVIDER_HINT.hiya.help && (
                  <div className="text-[11px] text-muted-foreground">{PROVIDER_HINT.hiya.help} Docs: {PROVIDER_HINT.hiya.doc}</div>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => testConnection("hiya")} disabled={loading === "hiya"}>
                    Test connection
                  </Button>
                  <Button onClick={() => upsertProvider("hiya", hiya, hiyaEnabled)} disabled={loading === "hiya"}>
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                <span>Numverify (Carrier & Line Type)</span>
                <Badge variant={numverifyEnabled ? "default" : "secondary"}>{numverifyEnabled ? "Enabled" : "Disabled"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="numverify_key">{PROVIDER_HINT.numverify.key}</Label>
                  <Input
                    id="numverify_key"
                    type="password"
                    placeholder={numverifyId ? "••••••••••" : "paste your Numverify API key"}
                    value={numverify.api_key}
                    onChange={(e) => setNumverify({ api_key: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="numverify_enabled"
                    type="checkbox"
                    checked={numverifyEnabled}
                    onChange={(e) => setNumverifyEnabled(e.target.checked)}
                  />
                  <Label htmlFor="numverify_enabled">Enabled</Label>
                </div>
                {PROVIDER_HINT.numverify.help && (
                  <div className="text-[11px] text-muted-foreground">{PROVIDER_HINT.numverify.help} Docs: {PROVIDER_HINT.numverify.doc}</div>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => testConnection("numverify")} disabled={loading === "numverify"}>
                    Test connection
                  </Button>
                  <Button onClick={() => upsertProvider("numverify", numverify as any, numverifyEnabled)} disabled={loading === "numverify"}>
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

