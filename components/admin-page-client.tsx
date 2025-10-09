"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { AdminStats } from "@/components/admin-stats"
import { UserManagement } from "@/components/user-management"
import { SystemSettings } from "@/components/system-settings"
import { AdminLogs } from "@/components/admin-logs"
import { HiyaScrapeButton } from "@/components/hiya-scrape-button"
import DebugBrowserless from "@/components/debug-browserless"
import { PageTutorial } from "@/components/tutorial/page-tutorial"
import { useTutorialContext } from "@/components/tutorial/tutorial-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AdminPageClientProps {
  user: any
  allUsers: any[]
  systemStats: any[]
  recentLogs: any[]
  systemSettings: any[]
}

export function AdminPageClient({ user, allUsers, systemStats, recentLogs, systemSettings }: AdminPageClientProps) {
  const { shouldShowPageTutorial, markPageVisited } = useTutorialContext()
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (shouldShowPageTutorial("admin")) {
      setTimeout(() => setShowTutorial(true), 500)
    }
  }, [shouldShowPageTutorial])

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    markPageVisited("admin")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground text-balance">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">System administration and user management</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="hiya">Hiya Scraping</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminStats users={allUsers} systemStats={systemStats} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement users={allUsers} />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings settings={systemSettings} />
          </TabsContent>

          <TabsContent value="hiya">
            <div className="space-y-6">
              <HiyaScrapeButton />
              <DebugBrowserless />
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <AdminLogs logs={recentLogs} />
          </TabsContent>
        </Tabs>
      </main>

      <PageTutorial
        page="admin"
        title="Admin Panel"
        description="System administration and user management tools"
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
        content={
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-lg mb-1">📊</div>
                <div className="font-medium text-sm">Overview</div>
                <div className="text-xs text-muted-foreground">System metrics and statistics</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-lg mb-1">👥</div>
                <div className="font-medium text-sm">User Management</div>
                <div className="text-xs text-muted-foreground">Manage user accounts and roles</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-lg mb-1">⚙️</div>
                <div className="font-medium text-sm">System Settings</div>
                <div className="text-xs text-muted-foreground">Configure system parameters</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-lg mb-1">📝</div>
                <div className="font-medium text-sm">Activity Logs</div>
                <div className="text-xs text-muted-foreground">Monitor system activity</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Admin Capabilities:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Monitor system-wide performance and user activity</li>
                <li>• Manage user accounts, roles, and permissions</li>
                <li>• Configure system settings and parameters</li>
                <li>• Review detailed activity logs and audit trails</li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-sm text-red-700 dark:text-red-300">
                <strong>Security Notice:</strong> Admin actions are logged and monitored. Use admin privileges
                responsibly and in accordance with company policies.
              </div>
            </div>
          </div>
        }
      />
    </div>
  )
}
