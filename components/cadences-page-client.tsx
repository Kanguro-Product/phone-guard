"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { CadencesTable } from "@/components/cadences-table"
import { AddCadenceDialog } from "@/components/add-cadence-dialog"
import { PageTutorial } from "@/components/tutorial/page-tutorial"
import { useTutorialContext } from "@/components/tutorial/tutorial-provider"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface CadencesPageClientProps {
  user: any
  cadences: any[]
  phoneNumbers: any[]
}

export function CadencesPageClient({ user, cadences, phoneNumbers }: CadencesPageClientProps) {
  const { shouldShowPageTutorial, markPageVisited } = useTutorialContext()
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (shouldShowPageTutorial("cadences")) {
      setTimeout(() => setShowTutorial(true), 500)
    }
  }, [shouldShowPageTutorial])

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    markPageVisited("cadences")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground text-balance">Cadences</h1>
            <p className="text-muted-foreground mt-2">Manage your A/B testing cadences and phone number rotation</p>
          </div>
          <AddCadenceDialog phoneNumbers={phoneNumbers}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Cadence
            </Button>
          </AddCadenceDialog>
        </div>

        <CadencesTable cadences={cadences} />
      </main>

      <PageTutorial
        page="cadences"
        title="Sales Cadences"
        description="Create automated calling sequences for maximum efficiency"
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
        content={
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Example Cadence Flow</span>
                <div className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                  Active
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Day 1: Initial contact call</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Day 3: Follow-up call</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Day 7: Final attempt</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Cadence Features:</h4>
              <div className="grid gap-2">
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>A/B Testing:</strong> Compare different phone numbers and approaches to find what works best
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Smart Rotation:</strong> Automatically use your best-performing numbers for each call
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Performance Tracking:</strong> Monitor success rates and optimize your sequences
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Automated Scheduling:</strong> Set precise intervals between calls for maximum impact
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Best Practice:</strong> Start with 2-3 numbers per cadence to test effectiveness, then scale up
                with your best performers.
              </div>
            </div>
          </div>
        }
      />
    </div>
  )
}
