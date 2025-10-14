"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Phone, BarChart3, Settings, LogOut, User, Shield, HelpCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useTutorialContext } from "@/components/tutorial/tutorial-provider"
import Image from "next/image"

interface NavigationProps {
  user: any
}

export function Navigation({ user }: NavigationProps) {
  const [userRole, setUserRole] = useState<string>("user")
  const router = useRouter()
  const supabase = createClient()
  const { resetTutorial } = useTutorialContext()

  useEffect(() => {
    const getUserRole = async () => {
      try {
        // Try user_profiles first
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", user.id)
          .single()

        if (profileData && !profileError) {
          setUserRole(profileData.role)
          return
        }

        // Fallback to users table if user_profiles fails
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (userData && !userError) {
          setUserRole(userData.role)
        } else {
          console.warn("Could not fetch user role:", userError || profileError)
          setUserRole("user") // Default fallback
        }
      } catch (error) {
        console.error("Error fetching user role:", error)
        setUserRole("user") // Default fallback
      }
    }

    getUserRole()
  }, [user.id, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleOpenTutorial = () => {
    resetTutorial()
  }

  return (
    <nav className="border-b border-border bg-card">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <Image 
              src="https://kanguro.com/wp-content/uploads/2023/10/Kanguro-logo_.webp" 
              alt="Kanguro Logo" 
              width={120} 
              height={40} 
              className="h-10 w-auto"
            />
            <span className="text-sm text-muted-foreground font-medium">PhoneGuard tool</span>
          </Link>
          <div className="h-6 w-px bg-border"></div>
        </div>

        <div className="ml-8 flex items-center space-x-6">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/numbers"
            className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span>Numbers</span>
          </Link>
          <Link
            href="/ab-caller"
            className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>A/B Caller Tool</span>
          </Link>
          <Link
            href="/integrations"
            className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Integrations</span>
          </Link>
          {userRole === "admin" && (
            <Link
              href="/admin"
              className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user?.email}</span>
            {userRole !== "user" && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                {userRole.toUpperCase()}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenTutorial}
            className="text-muted-foreground hover:text-foreground"
            title="Open Tutorial"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
