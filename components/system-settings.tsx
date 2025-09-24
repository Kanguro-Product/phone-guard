"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Save, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

interface SystemSettingsProps {
  settings: any[]
}

export function SystemSettings({ settings }: SystemSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initialValues: Record<string, string> = {}
    settings.forEach((setting) => {
      initialValues[setting.key] =
        typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value).replace(/"/g, "")
    })
    return initialValues
  })

  const router = useRouter()
  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const updates = Object.entries(values).map(([key, value]) => {
        // Try to parse as number if it looks like a number
        let parsedValue: any = value
        if (!isNaN(Number(value)) && value.trim() !== "") {
          parsedValue = Number(value)
        } else if (value === "true" || value === "false") {
          parsedValue = value === "true"
        }

        return supabase
          .from("system_settings")
          .update({
            value: parsedValue,
            updated_at: new Date().toISOString(),
            updated_by: (async () => (await supabase.auth.getUser()).data.user?.id)(),
          })
          .eq("key", key)
      })

      const results = await Promise.all(updates)

      const hasErrors = results.some((result) => result.error)
      if (hasErrors) {
        throw new Error("Failed to update some settings")
      }

      // Log admin action
      await supabase.from("admin_logs").insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: "system_settings_updated",
        details: { updated_settings: Object.keys(values) },
      })

      setSuccess("Settings updated successfully")
      router.refresh()
    } catch (err) {
      console.error("Error updating settings:", err)
      setError(err instanceof Error ? err.message : "Failed to update settings")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    const resetValues: Record<string, string> = {}
    settings.forEach((setting) => {
      resetValues[setting.key] =
        typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value).replace(/"/g, "")
    })
    setValues(resetValues)
    setError(null)
    setSuccess(null)
  }

  const settingsGroups = [
    {
      title: "User Limits",
      description: "Configure maximum resources per user",
      keys: ["max_phone_numbers_per_user", "max_cadences_per_user", "call_rate_limit_per_hour"],
    },
    {
      title: "SPAM Detection",
      description: "Configure SPAM validation settings",
      keys: ["spam_threshold", "bulk_validation_batch_size"],
    },
    {
      title: "System Maintenance",
      description: "Configure system maintenance settings",
      keys: ["reputation_decay_days"],
    },
  ]

  const getSettingByKey = (key: string) => {
    return settings.find((s) => s.key === key)
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Settings Groups */}
      {settingsGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Settings className="h-5 w-5" />
              <span>{group.title}</span>
            </CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.keys.map((key) => {
              const setting = getSettingByKey(key)
              if (!setting) return null

              return (
                <div key={key} className="grid gap-2">
                  <Label htmlFor={key} className="text-foreground">
                    {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Label>
                  <Input
                    id={key}
                    value={values[key] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={setting.description || ""}
                  />
                  {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  )
}
