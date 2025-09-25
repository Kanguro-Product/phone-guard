"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { DashboardStats } from "@/components/dashboard-stats"
import { ReputationChart } from "@/components/reputation-chart"
import { CallsChart } from "@/components/calls-chart"
import { RecentActivity } from "@/components/recent-activity"
import { SystemAlerts } from "@/components/system-alerts"
import { PageTutorial } from "@/components/tutorial/page-tutorial"
import { useTutorialContext } from "@/components/tutorial/tutorial-provider"
import { usePhoneNumbersRealtime, useCallsRealtime } from "@/hooks/use-realtime-updates"
import { RealtimeStatus } from "@/components/realtime-status"

interface DashboardPageClientProps {
  user: any
  stats: any
  phoneNumbers: any[]
  recentCalls: any[]
  weekCalls: any[]
}

export function DashboardPageClient({ user, stats, phoneNumbers, recentCalls, weekCalls }: DashboardPageClientProps) {
  const { shouldShowPageTutorial, markPageVisited, shouldShowMainTutorial } = useTutorialContext()
  const [showTutorial, setShowTutorial] = useState(false)
  
  // Hooks para actualizaciones en tiempo real
  const phoneNumbersRealtime = usePhoneNumbersRealtime()
  const callsRealtime = useCallsRealtime()
  
  // Usar el estado más reciente entre ambos
  const lastUpdate = phoneNumbersRealtime.lastUpdate || callsRealtime.lastUpdate
  const status = phoneNumbersRealtime.isConnected && callsRealtime.isConnected ? 'realtime' : 
                 phoneNumbersRealtime.status === 'realtime' || callsRealtime.status === 'realtime' ? 'realtime' : 'polling'

  useEffect(() => {
    // Show main tutorial first if user hasn't seen it
    if (shouldShowMainTutorial()) {
      // Main tutorial will be shown by TutorialProvider
      return
    }
    
    // Then show page-specific tutorial
    if (shouldShowPageTutorial("dashboard")) {
      setTimeout(() => setShowTutorial(true), 500)
    }
  }, [shouldShowPageTutorial, shouldShowMainTutorial])

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    markPageVisited("dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground text-balance">Dashboard</h1>
              <p className="text-muted-foreground mt-2">Monitor your phone numbers and cadence performance</p>
            </div>
            <RealtimeStatus 
              status={status} 
              lastUpdate={lastUpdate} 
              onRefresh={() => {
                phoneNumbersRealtime.refresh()
                callsRealtime.refresh()
              }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <DashboardStats stats={stats} />

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <ReputationChart phoneNumbers={phoneNumbers} />
          <CallsChart calls={weekCalls} />
        </div>

        {/* Activity and Alerts */}
        <div className="grid gap-6 md:grid-cols-2">
          <RecentActivity calls={recentCalls} />
          <SystemAlerts phoneNumbers={phoneNumbers} stats={stats} />
        </div>
      </main>

      <PageTutorial
        page="dashboard"
        title="Dashboard Overview"
        description="Your command center for monitoring performance"
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
        content={
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-lg font-bold text-green-700 dark:text-green-300">📊</div>
                <div className="text-sm font-medium">Performance Metrics</div>
                <div className="text-xs text-muted-foreground">Track success rates and call volumes</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">📈</div>
                <div className="text-sm font-medium">Reputation Charts</div>
                <div className="text-xs text-muted-foreground">Monitor number health over time</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300">📞</div>
                <div className="text-sm font-medium">Recent Activity</div>
                <div className="text-xs text-muted-foreground">Latest calls and outcomes</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-lg font-bold text-orange-700 dark:text-orange-300">⚠️</div>
                <div className="text-sm font-medium">System Alerts</div>
                <div className="text-xs text-muted-foreground">Important notifications and warnings</div>
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Key Insights:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Monitor reputation scores to prevent spam classification</li>
                <li>• Track call success rates to optimize your approach</li>
                <li>• Review recent activity for patterns and opportunities</li>
                <li>• Pay attention to system alerts for immediate action items</li>
              </ul>
            </div>
          </div>
        }
      />
    </div>
  )
}
