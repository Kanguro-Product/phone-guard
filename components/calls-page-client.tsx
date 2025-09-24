"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { CallSimulator } from "@/components/call-simulator"
import { CallLogsTable } from "@/components/call-logs-table"
import { PageTutorial } from "@/components/tutorial/page-tutorial"
import { useTutorialContext } from "@/components/tutorial/tutorial-provider"

interface CallsPageClientProps {
  user: any
  cadences: any[]
  calls: any[]
}

export function CallsPageClient({ user, cadences, calls }: CallsPageClientProps) {
  const { shouldShowPageTutorial, markPageVisited } = useTutorialContext()
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (shouldShowPageTutorial("calls")) {
      setTimeout(() => setShowTutorial(true), 500)
    }
  }, [shouldShowPageTutorial])

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    markPageVisited("calls")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground text-balance">Call Management</h1>
          <p className="text-muted-foreground mt-2">Test phone number rotation and view call logs</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-1">
            <CallSimulator cadences={cadences} onCallComplete={() => window.location.reload()} />
          </div>
          <div className="lg:col-span-2">
            <CallLogsTable calls={calls} onRefresh={() => window.location.reload()} />
          </div>
        </div>
      </main>

      <PageTutorial
        page="calls"
        title="Call Management & Analytics"
        description="Test your setup and analyze call performance"
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
        content={
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-medium text-sm">Call Simulator</div>
                <div className="text-xs text-muted-foreground">Test your cadences and number rotation</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium text-sm">Call Logs</div>
                <div className="text-xs text-muted-foreground">Detailed history and analytics</div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Call Management Features:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Simulator Testing:</strong> Test your cadences without making real calls to validate setup
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Detailed Logging:</strong> Every call is recorded with outcome, duration, and number used
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Performance Analytics:</strong> Track success rates, connect rates, and spam reports
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Reputation Monitoring:</strong> Monitor how calls affect your numbers' reputation scores
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-sm text-orange-700 dark:text-orange-300">
                <strong>Important:</strong> Use the simulator to test your setup before running live cadences. This
                helps identify issues without affecting your reputation.
              </div>
            </div>
          </div>
        }
      />
    </div>
  )
}
