"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "confirmation_failed") {
      setError("Email confirmation failed. Please try logging in or sign up again.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting login process")

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.log("[v0] Sign in error:", signInError)
        if (signInError.message.includes("Email not confirmed")) {
          throw new Error("Please check your email and click the confirmation link before logging in.")
        }
        throw signInError
      }

      console.log("[v0] User authenticated:", data.user?.id)

      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", data.user.id)
          .single()

        if (userError && userError.code === "PGRST116") {
          // User not found in public.users, create profile
          console.log("[v0] Creating missing user profile")
          const { error: insertError } = await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email || email,
            role: "user",
          })

          if (insertError) {
            console.log("[v0] Error creating user profile:", insertError)
            // Don't fail login, just log the error
          }
        } else if (userError) {
          console.log("[v0] User profile verification error:", userError)
          // Don't fail login, just log the error
        }

        console.log("[v0] User profile verified/created")
      }

      router.push("/dashboard")
    } catch (error: unknown) {
      console.log("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>Enter your email below to login to your account</CardDescription>
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                <strong>Test credentials:</strong>
                <br />
                Email: admin@test.com
                <br />
                Password: admin123
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/sign-up" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
