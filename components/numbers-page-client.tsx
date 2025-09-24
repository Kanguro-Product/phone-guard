"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { NumbersTable } from "@/components/numbers-table"
import { AddNumberDialog } from "@/components/add-number-dialog"
import { BulkUploadDialog } from "@/components/bulk-upload-dialog"
import { PageTutorial } from "@/components/tutorial/page-tutorial"
import { useTutorialContext } from "@/components/tutorial/tutorial-provider"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"

interface NumbersPageClientProps {
  user: any
  initialNumbers: any[]
}

export function NumbersPageClient({ user, initialNumbers }: NumbersPageClientProps) {
  const [phoneNumbers, setPhoneNumbers] = useState(initialNumbers)
  const { shouldShowPageTutorial, markPageVisited } = useTutorialContext()
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (shouldShowPageTutorial("numbers")) {
      setTimeout(() => setShowTutorial(true), 500)
    }
  }, [shouldShowPageTutorial])

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    markPageVisited("numbers")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground text-balance">Phone Numbers</h1>
            <p className="text-muted-foreground mt-2">Manage your phone numbers and monitor their reputation</p>
          </div>
          <div className="flex gap-2">
            <BulkUploadDialog userId={user.id}>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </BulkUploadDialog>
            <AddNumberDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Number
              </Button>
            </AddNumberDialog>
          </div>
        </div>

        <NumbersTable numbers={phoneNumbers} />
      </main>

      <PageTutorial
        page="numbers"
        title="Phone Numbers Management"
        description="Learn how to manage your phone numbers effectively"
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
        content={
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Key Features:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Individual Add:</strong> Click "Add Number" to add one number at a time with detailed
                    configuration
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Bulk Upload:</strong> Use "Bulk Upload" to add up to 200 numbers at once by pasting them
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Reputation Monitoring:</strong> Keep track of each number's spam score and performance
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Usage Analytics:</strong> Monitor call statistics and success rates per number
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Pro Tip:</strong> Numbers with reputation scores below 70% should be rotated out to maintain
                deliverability.
              </div>
            </div>
          </div>
        }
      />
    </div>
  )
}
