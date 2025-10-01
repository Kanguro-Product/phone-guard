"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { NumbersTable } from "@/components/numbers-table"
import { AddNumberDialog } from "@/components/add-number-dialog"
import { BulkUploadDialog } from "@/components/bulk-upload-dialog"
import { PageTutorial } from "@/components/tutorial/page-tutorial"
import { useTutorialContext } from "@/components/tutorial/tutorial-provider"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Trash2, AlertTriangle } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface NumbersPageClientProps {
  user: any
  initialNumbers: any[]
}

export function NumbersPageClient({ user, initialNumbers }: NumbersPageClientProps) {
  const [phoneNumbers, setPhoneNumbers] = useState(initialNumbers)
  const [selectedNumbers, setSelectedNumbers] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const { shouldShowPageTutorial, markPageVisited } = useTutorialContext()
  const [showTutorial, setShowTutorial] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (shouldShowPageTutorial("numbers")) {
      setTimeout(() => setShowTutorial(true), 500)
    }
  }, [shouldShowPageTutorial])

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    markPageVisited("numbers")
  }

  const handleDeleteNumbers = async (numberIds: string[]) => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from("phone_numbers")
        .delete()
        .in("id", numberIds)
        .eq("user_id", user.id)

      if (error) {
        console.error("Error deleting numbers:", error)
        return
      }

      // Update local state
      setPhoneNumbers(prev => prev.filter(num => !numberIds.includes(num.id)))
      setSelectedNumbers(new Set())
      
      // Refresh the page to get updated data
      router.refresh()
    } catch (error) {
      console.error("Error deleting numbers:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteAll = () => {
    const allIds = phoneNumbers.map(num => num.id)
    handleDeleteNumbers(allIds)
  }

  const handleDeleteSelected = () => {
    const selectedIds = Array.from(selectedNumbers)
    handleDeleteNumbers(selectedIds)
  }

  const handleSelectAll = () => {
    if (selectedNumbers.size === phoneNumbers.length) {
      setSelectedNumbers(new Set())
    } else {
      setSelectedNumbers(new Set(phoneNumbers.map(num => num.id)))
    }
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
            {selectedNumbers.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedNumbers.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Selected Numbers</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedNumbers.size} selected phone number{selectedNumbers.size > 1 ? 's' : ''}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSelected} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {phoneNumbers.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete All Numbers</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete ALL {phoneNumbers.length} phone numbers? This action cannot be undone and will permanently remove all your numbers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAll} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

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

        <NumbersTable 
          numbers={phoneNumbers} 
          selectedNumbers={selectedNumbers}
          onSelectionChange={setSelectedNumbers}
          onDeleteNumber={(id) => handleDeleteNumbers([id])}
          onSelectAll={handleSelectAll}
        />
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
