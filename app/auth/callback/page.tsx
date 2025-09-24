"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()

      try {
        console.log("[v0] Processing auth callback")

        // Get the code from URL parameters
        const code = searchParams.get("code")

        if (code) {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.log("[v0] Session exchange error:", error)
            throw error
          }

          if (data.user) {
            console.log("[v0] User authenticated:", data.user.id)

            // Check if user profile exists in public.users
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("id")
              .eq("id", data.user.id)
              .single()

            if (userError && userError.code === "PGRST116") {
              // User not found, create profile
              console.log("[v0] Creating user profile after email confirmation")
              const { error: insertError } = await supabase.from("users").insert({
                id: data.user.id,
                email: data.user.email,
                role: "user",
              })

              if (insertError) {
                console.log("[v0] Profile creation error:", insertError)
                throw new Error("Error creating user profile")
              }
            } else if (userError) {
              console.log("[v0] Profile check error:", userError)
              throw userError
            }

            setStatus("success")
            setMessage("Email confirmed successfully! Redirecting to dashboard...")

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push("/dashboard")
            }, 2000)
          }
        } else {
          throw new Error("No confirmation code found")
        }
      } catch (error) {
        console.log("[v0] Callback error:", error)
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Authentication failed")

        // Redirect to login after error
        setTimeout(() => {
          router.push("/auth/login?error=confirmation_failed")
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {status === "loading" && "Confirming Email..."}
              {status === "success" && "Email Confirmed!"}
              {status === "error" && "Confirmation Failed"}
            </CardTitle>
            <CardDescription>
              {status === "loading" && "Please wait while we confirm your email address."}
              {status === "success" && "Your email has been successfully confirmed."}
              {status === "error" && "There was an issue confirming your email."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {status === "loading" && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              )}
              {status === "success" && <div className="text-green-600">✓ {message}</div>}
              {status === "error" && <div className="text-red-600">✗ {message}</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
