"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { NumbersTable } from "@/components/numbers-table"
import { AddNumberDialog } from "@/components/add-number-dialog"
import { BulkUploadDialog } from "@/components/bulk-upload-dialog"
import { ListManagementDialog } from "@/components/list-management-dialog"
import { ActionNeededConfig } from "@/components/action-needed-config"
import { BulkActionsDialog } from "@/components/bulk-actions-dialog"
import { PageTutorial } from "@/components/tutorial/page-tutorial"
import { useTutorialContext } from "@/components/tutorial/tutorial-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Upload, Trash2, AlertTriangle, List as ListIcon, MoreHorizontal, Settings, FolderPlus, Phone, Folder, RefreshCw, Settings2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

// Estilos CSS para scrollbar personalizada
const scrollbarStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }
  .scrollbar-thin::-webkit-scrollbar {
    height: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }
`

interface NumberList {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  is_default: boolean
  is_system_list?: boolean
  list_type?: string
  created_at: string
  updated_at: string
  count?: number
}

interface NumbersPageClientProps {
  user: any
  initialNumbers: any[]
}

export function NumbersPageClient({ user, initialNumbers }: NumbersPageClientProps) {
  const [phoneNumbers, setPhoneNumbers] = useState(initialNumbers)
  const [numberLists, setNumberLists] = useState<NumberList[]>([])
  const [selectedNumbers, setSelectedNumbers] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("")
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false)
  const { shouldShowPageTutorial, markPageVisited } = useTutorialContext()
  const [showTutorial, setShowTutorial] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (shouldShowPageTutorial("numbers")) {
      setTimeout(() => setShowTutorial(true), 500)
    }
  }, [shouldShowPageTutorial])

  // Load number lists
  useEffect(() => {
    const fetchNumberLists = async () => {
      try {
        const { data, error } = await supabase
          .from("number_lists")
          .select(`
            *,
            number_list_items(count)
          `)
          .eq("user_id", user.id)
          .order("is_system_list", { ascending: false })
          .order("list_type", { ascending: true })
          .order("name")

        if (error) {
          console.error("Error fetching number lists:", error)
          return
        }

        // If no lists exist, try to create mandatory lists
        if (!data || data.length === 0) {
          console.log("No lists found, attempting to create mandatory lists...")
          await createMandatoryLists()
          return
        }

        // Process the data to add counts
        const processedData = await Promise.all((data || []).map(async (list) => {
          let count = 0
          
          if (list.list_type === 'all_numbers') {
            // For "All", count all numbers except those in discarded list
            // First get all numbers
            const { data: allNumbers } = await supabase
              .from("phone_numbers")
              .select("id")
              .eq("user_id", user.id)
            
            // Then get discarded numbers
            const { data: discardedNumbers } = await supabase
              .from("number_list_items")
              .select("phone_number_id")
              .eq("list_id", data.find(l => l.list_type === 'discarded')?.id || '')
            
            const discardedIds = new Set(discardedNumbers?.map(item => item.phone_number_id) || [])
            count = (allNumbers || []).filter(num => !discardedIds.has(num.id)).length
          } else {
            // For other lists, count items in number_list_items
            const { count: listCount } = await supabase
              .from("number_list_items")
              .select("*", { count: 'exact', head: true })
              .eq("list_id", list.id)
            count = listCount || 0
          }
          
          return {
            ...list,
            count
          }
        }))

        setNumberLists(processedData)
        
        // Debug: Log the lists to see what we have
        console.log("Loaded number lists with counts:", processedData)
        console.log("All list:", processedData.find(list => list.list_type === 'all_numbers'))
        console.log("Discarded list:", processedData.find(list => list.list_type === 'discarded'))
        
        // Debug: Log individual counts
        processedData.forEach(list => {
          console.log(`List "${list.name}" (${list.list_type}): ${list.count} numbers`)
        })
        
        // Set initial active tab to the first list (should be default list)
        if (processedData && processedData.length > 0 && !activeTab) {
          // Find "All" first, otherwise use first list
          const allNumbersList = processedData.find(list => list.list_type === 'all_numbers')
          const firstList = allNumbersList || processedData[0]
          setActiveTab(firstList.id)
          
          // Load numbers for the initial tab
          setTimeout(() => {
            getNumbersForActiveTab(firstList.id)
          }, 100)
        }
      } catch (error) {
        console.error("Error fetching number lists:", error)
      }
    }

    const createMandatoryLists = async () => {
      try {
        // Try to use the RPC function if it exists
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('ensure_mandatory_lists', { user_uuid: user.id })

        if (!rpcError && rpcResult) {
          console.log("Mandatory lists created via RPC")
          // Refresh the lists
          fetchNumberLists()
          return
        }

        // Fallback: Create lists manually
        console.log("RPC not available, creating lists manually...")
        
        // Create "All" list
        const { data: allNumbersList, error: allNumbersError } = await supabase
          .from('number_lists')
          .insert({
            user_id: user.id,
            name: 'All',
            description: 'Lista principal que contiene todos los números de teléfono',
            color: '#3B82F6',
            icon: 'Phone',
            is_default: true,
            list_type: 'all_numbers',
            is_system_list: true
          })
          .select()
          .single()

        // Create "Deleted" list
        const { data: discardedList, error: discardedError } = await supabase
          .from('number_lists')
          .insert({
            user_id: user.id,
            name: 'Deleted',
            description: 'Números que han sido marcados como descartados',
            color: '#EF4444',
            icon: 'Trash2',
            is_default: true,
            list_type: 'discarded',
            is_system_list: true
          })
          .select()
          .single()

        // Create "Action Needed" list
        const { data: actionNeededList, error: actionNeededError } = await supabase
          .from('number_lists')
          .insert({
            user_id: user.id,
            name: 'Action Needed',
            description: 'Números que necesitan atención basado en tiempo desde último checkpoint',
            color: '#FFD700',
            icon: '⚠️',
            is_default: false,
            list_type: 'action_needed',
            is_system_list: true
          })
          .select()
          .single()

        if (allNumbersError || discardedError || actionNeededError) {
          console.error("Error creating mandatory lists:", { allNumbersError, discardedError, actionNeededError })
          console.log("This usually means the database tables don't exist or are missing required columns.")
          console.log("Please run the SQL script: scripts/023_minimal_setup.sql")
          return
        }

        console.log("Mandatory lists created successfully")
        console.log("All list ID:", allNumbersList?.id)
        console.log("Discarded list ID:", discardedList?.id)
        
        // Add all existing numbers to "All" list
        if (allNumbersList && initialNumbers.length > 0) {
          const itemsToInsert = initialNumbers.map(number => ({
            list_id: allNumbersList.id,
            phone_number_id: number.id,
            added_by: user.id,
            notes: 'Agregado automáticamente a lista principal'
          }))

          const { error: insertError } = await supabase
            .from('number_list_items')
            .insert(itemsToInsert)
            
          if (insertError) {
            console.error('Error adding numbers to list:', insertError)
          } else {
            console.log(`Added ${itemsToInsert.length} numbers to "All"`)
          }
        }

        // Refresh the lists
        fetchNumberLists()
      } catch (error) {
        console.error("Error creating mandatory lists:", error)
      }
    }

    fetchNumberLists()
  }, [user.id, supabase, initialNumbers])

  // Load numbers when activeTab changes
  useEffect(() => {
    if (activeTab && numberLists.length > 0) {
      getNumbersForActiveTab(activeTab)
    }
  }, [activeTab, numberLists])

  // Function to get numbers for specific list
  const getNumbersForActiveTab = async (tabId: string) => {
    console.log("getNumbersForActiveTab called with tabId:", tabId)
    console.log("Available lists:", numberLists.map(l => ({ id: l.id, name: l.name, type: l.list_type })))
    
    setIsLoadingNumbers(true)
    try {
      // Find the current list to check its type
      const currentList = numberLists.find(list => list.id === tabId)
      console.log("Current list found:", currentList)
      
      // If we can't find the list in numberLists, try to determine by name or use fallback
      if (!currentList) {
        console.log("List not found in numberLists, using fallback logic")
        // Fallback: show all numbers (same logic as All)
        const { data: allNumbers, error: allError } = await supabase
          .from("phone_numbers")
          .select("*")
          .eq("user_id", user.id)

        if (allError) {
          console.error("Error fetching all numbers (fallback):", allError)
          return
        }

        console.log("Fallback: All numbers found:", allNumbers?.length || 0)
        setPhoneNumbers(allNumbers || [])
        return
      }
      
      if (currentList.list_type === 'all_numbers') {
        // For "All", show all numbers except those in discarded list
        console.log("Fetching numbers for All list...")
        
        // First get all numbers
        const { data: allNumbers, error: allError } = await supabase
          .from("phone_numbers")
          .select("*")
          .eq("user_id", user.id)

        if (allError) {
          console.error("Error fetching all numbers:", allError)
          return
        }

        console.log("All numbers found:", allNumbers?.length || 0)

        // Then get discarded numbers
        const discardedList = numberLists.find(l => l.list_type === 'discarded')
        if (discardedList) {
          const { data: discardedNumbers, error: discardedError } = await supabase
            .from("number_list_items")
            .select("phone_number_id")
            .eq("list_id", discardedList.id)

          if (discardedError) {
            console.error("Error fetching discarded numbers:", discardedError)
            return
          }

          console.log("Discarded numbers found:", discardedNumbers?.length || 0)

          // Filter out discarded numbers
          const discardedIds = new Set(discardedNumbers?.map(item => item.phone_number_id) || [])
          const filteredNumbers = (allNumbers || []).filter(num => !discardedIds.has(num.id))
          
          console.log("Filtered numbers for All:", filteredNumbers.length)
          setPhoneNumbers(filteredNumbers)
        } else {
          console.log("No discarded list found, showing all numbers")
          setPhoneNumbers(allNumbers || [])
        }
      } else if (currentList.list_type === 'discarded') {
        // For "Deleted", show only numbers in discarded list
        console.log("Fetching numbers for Deleted list...")
        console.log("Deleted list ID:", tabId)
        
        const { data, error } = await supabase
          .from("number_list_items")
          .select(`
            phone_numbers (*)
          `)
          .eq("list_id", tabId)

        if (error) {
          console.error("Error fetching discarded numbers:", error)
          return
        }

        console.log("Number list items found:", data?.length || 0)
        console.log("Raw data:", data)
        
        const numbers = data?.map(item => item.phone_numbers).filter(Boolean) || []
        console.log("Filtered numbers for Deleted:", numbers.length)
        console.log("Numbers:", numbers)
        
        setPhoneNumbers(numbers)
      } else if (currentList.list_type === 'action_needed') {
        // For Action Needed list, get numbers based on time threshold
        console.log("Fetching numbers for Action Needed list")
        
        // First, get the user's configuration
        const { data: configData } = await supabase
          .from('action_needed_config')
          .select('hours_threshold')
          .eq('user_id', user.id)
          .single()
        
        const hoursThreshold = configData?.hours_threshold || 24
        console.log("Action Needed threshold:", hoursThreshold, "hours")
        
        // Calculate the timestamp threshold
        const thresholdDate = new Date()
        thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold)
        
        // Get numbers that haven't been checked recently OR have no validation data
        const { data, error } = await supabase
          .from("phone_numbers")
          .select("*")
          .eq("user_id", user.id)
          .neq("status", "deprecated")
          .or(`last_checked.is.null,last_checked.lt.${thresholdDate.toISOString()},numverify_score.is.null,openai_score.is.null,average_reputation_score.is.null`)
        
        if (error) {
          console.error("Error fetching Action Needed numbers:", error)
          return
        }
        
        console.log("Action Needed numbers found:", data?.length || 0)
        setPhoneNumbers(data || [])
      } else {
        // For other lists, get numbers from number_list_items
        console.log("Fetching numbers for custom list:", currentList.name)
        console.log("List ID:", tabId)
        
        const { data, error } = await supabase
          .from("number_list_items")
          .select(`
            phone_numbers (*)
          `)
          .eq("list_id", tabId)

        if (error) {
          console.error("Error fetching numbers for list:", error)
          return
        }

        console.log("Number list items found:", data?.length || 0)
        const numbers = data?.map(item => item.phone_numbers).filter(Boolean) || []
        console.log("Filtered numbers for", currentList.name + ":", numbers.length)
        
        setPhoneNumbers(numbers)
      }
    } catch (error) {
      console.error("Error fetching numbers for list:", error)
    } finally {
      setIsLoadingNumbers(false)
      console.log("getNumbersForActiveTab completed. Phone numbers set:", phoneNumbers.length)
    }
  }

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setSelectedNumbers(new Set()) // Clear selection when switching tabs
    getNumbersForActiveTab(tabId)
  }

  const handleCloseTutorial = () => {
    setShowTutorial(false)
    markPageVisited("numbers")
  }

  // Función para formatear números de manera abreviada
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k'
    }
    return num.toString()
  }



  const handleListCreated = () => {
    // Refresh the lists after creating a new one
    const fetchNumberLists = async () => {
      try {
        const { data, error } = await supabase
          .from("number_lists")
          .select(`
            *,
            number_list_items(count)
          `)
          .eq("user_id", user.id)
          .order("is_system_list", { ascending: false })
          .order("list_type", { ascending: true })
          .order("name")

        if (error) {
          console.error("Error fetching number lists:", error)
          return
        }

        // Process the data to add counts
        const processedData = await Promise.all((data || []).map(async (list) => {
          let count = 0
          
          if (list.list_type === 'all_numbers') {
            // For "All", count all numbers except those in discarded list
            const { data: allNumbers } = await supabase
              .from("phone_numbers")
              .select("id")
              .eq("user_id", user.id)
            
            const discardedList = data.find(l => l.list_type === 'discarded')
            if (discardedList) {
              const { data: discardedNumbers } = await supabase
                .from("number_list_items")
                .select("phone_number_id")
                .eq("list_id", discardedList.id)
              
              const discardedIds = new Set(discardedNumbers?.map(item => item.phone_number_id) || [])
              count = (allNumbers || []).filter(num => !discardedIds.has(num.id)).length
            } else {
              count = allNumbers?.length || 0
            }
          } else {
            // For other lists, count items in number_list_items
            const { count: listCount } = await supabase
              .from("number_list_items")
              .select("*", { count: 'exact', head: true })
              .eq("list_id", list.id)
            count = listCount || 0
          }
          
          return {
            ...list,
            count
          }
        }))

        setNumberLists(processedData)
      } catch (error) {
        console.error("Error fetching number lists:", error)
      }
    }
    fetchNumberLists()
  }

  const handleListDeleted = () => {
    // Refresh the lists after deleting one
    handleListCreated()
  }

  const getListIcon = (list: NumberList) => {
    // "All" siempre usa emoji de teléfono
    if (list.list_type === 'all_numbers') {
      return <span className="text-sm">📞</span>
    }
    
    // "Deleted" siempre usa emoji de papelera
    if (list.list_type === 'discarded') {
      return <span className="text-sm">🗑️</span>
    }
    
    // "Action Needed" siempre usa emoji de advertencia
    if (list.list_type === 'action_needed') {
      return <span className="text-sm">⚠️</span>
    }
    
    // Otras listas usan carpeta pintada con el color configurado
    return <Folder className="h-3 w-3" style={{ color: list.color, fill: list.color }} />
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

  const handleBulkActionComplete = async () => {
    console.log("🔄 Bulk action completed, refreshing data from database...")
    // Clear selection
    setSelectedNumbers(new Set())
    
    // Force a single refresh from database
    await getNumbersForActiveTab(activeTab)
    
    // Small delay before router refresh to avoid multiple updates
    setTimeout(() => {
      router.refresh()
    }, 500)
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
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <Navigation user={user} />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground text-balance">
              Phone Numbers
              {activeTab && numberLists.length > 0 && (
                <span className="text-lg font-normal text-muted-foreground ml-2">
                  • <span className="inline-flex items-center gap-2">
                    {getListIcon(numberLists.find(list => list.id === activeTab)!)}
                    {numberLists.find(list => list.id === activeTab)?.name || 'Loading...'}
                  </span>
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">Manage your phone numbers and monitor their reputation</p>
          </div>
          <div className="flex gap-2">
            <BulkUploadDialog userId={user.id}>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Carga Masiva
              </Button>
            </BulkUploadDialog>
            
            <AddNumberDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Número
              </Button>
            </AddNumberDialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Gestionar Listas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Gestionar Listas</DialogTitle>
                  <DialogDescription>
                    Crea, edita y elimina listas de números de teléfono
                  </DialogDescription>
                </DialogHeader>
                <ListManagementDialog 
                  lists={numberLists} 
                  onListCreated={handleListCreated}
                  onListDeleted={handleListDeleted}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Number Lists Tabs */}
        {numberLists.length > 0 ? (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="relative">
              <TooltipProvider>
                <TabsList className="flex h-auto p-1 bg-muted/50 rounded-lg overflow-x-auto scrollbar-thin w-full min-w-0 justify-start gap-3">
                  {numberLists.map((list) => (
                    <Tooltip key={list.id}>
                      <TooltipTrigger asChild>
                        <TabsTrigger 
                          value={list.id}
                          className={`
                            flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
                            transition-all duration-200 whitespace-nowrap flex-shrink-0
                            min-w-0 max-w-[180px]
                            ${list.is_system_list ? 'font-semibold' : 'font-normal'}
                            hover:bg-background/80 hover:scale-105
                            data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:scale-105 data-[state=active]:border-2 data-[state=active]:border-primary/20
                            rounded-md
                            ${list.list_type === 'all_numbers' ? 'bg-green-100 hover:bg-green-200 data-[state=active]:bg-green-200' : ''}
                            ${list.list_type === 'discarded' ? 'bg-red-100 hover:bg-red-200 data-[state=active]:bg-red-200' : ''}
                            ${list.list_type === 'action_needed' ? 'bg-yellow-100 hover:bg-yellow-200 data-[state=active]:bg-yellow-200' : ''}
                          `}
                        >
                          <span className="flex-shrink-0 text-sm">
                            {getListIcon(list)}
                          </span>
                          <span className="truncate min-w-0 flex-1">
                            {list.name}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {list.count !== undefined && (
                              <span className="text-[10px] bg-muted text-muted-foreground px-1 py-0.5 rounded-full">
                                {formatNumber(list.count)}
                              </span>
                            )}
                          </div>
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-medium">{list.name}</p>
                        {list.description && (
                          <p className="text-xs text-muted-foreground">{list.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {list.count !== undefined ? `${formatNumber(list.count)} números` : 'Sin números'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TabsList>
              </TooltipProvider>
            </div>

          <TabsContent value={activeTab} className="mt-0">
            {isLoadingNumbers ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading numbers...</div>
              </div>
            ) : (
              <>
                {/* Show Action Needed configuration when Action Needed list is selected */}
                {numberLists.find(list => list.id === activeTab)?.list_type === 'action_needed' && (
                  <div className="mb-6">
                    <ActionNeededConfig 
                      userId={user.id} 
                      onConfigUpdate={() => {
                        // Refresh the numbers when config is updated
                        handleListCreated()
                      }}
                    />
                  </div>
                )}
                
                <NumbersTable 
                  numbers={phoneNumbers} 
                  selectedNumbers={selectedNumbers}
                  onSelectionChange={setSelectedNumbers}
                  onDeleteNumber={(id) => handleDeleteNumbers([id])}
                  onSelectAll={handleSelectAll}
                  onBulkAction={() => setBulkActionsOpen(true)}
                  onDeleteSelected={handleDeleteSelected}
                  onDeleteAll={handleDeleteAll}
                  isDeleting={isDeleting}
                  sourceListId={activeTab}
                  onActionComplete={handleBulkActionComplete}
                  user={user}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/50 rounded-lg">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No hay listas disponibles</h3>
            <p className="text-muted-foreground text-center mb-4">
              Las listas de números no se han creado aún. Esto puede suceder si es la primera vez que usas esta funcionalidad.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Instrucciones:</h4>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                <li>Ejecuta el script SQL en Supabase: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">scripts/023_minimal_setup.sql</code></li>
                <li>O haz clic en "Crear Listas" para intentar crearlas automáticamente</li>
                <li>Si sigue fallando, verifica que las tablas existan en Supabase</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recargar página
              </Button>
              <Button onClick={async () => {
                try {
                  // Try to create mandatory lists
                  const { data: allNumbersList, error: allNumbersError } = await supabase
                    .from('number_lists')
                    .insert({
                      user_id: user.id,
                      name: 'All',
                      description: 'Lista principal que contiene todos los números de teléfono',
                      color: '#3B82F6',
                      icon: 'Phone',
                      is_default: true,
                      list_type: 'all_numbers',
                      is_system_list: true
                    })
                    .select()
                    .single()

                  const { data: discardedList, error: discardedError } = await supabase
                    .from('number_lists')
                    .insert({
                      user_id: user.id,
                      name: 'Números Descartados',
                      description: 'Números que han sido marcados como descartados',
                      color: '#EF4444',
                      icon: 'Trash2',
                      is_default: true,
                      list_type: 'discarded',
                      is_system_list: true
                    })
                    .select()
                    .single()

                  if (allNumbersError || discardedError) {
                    console.error('Error details:', { allNumbersError, discardedError })
                    alert(`Error al crear las listas:\n${allNumbersError?.message || discardedError?.message}\n\nPor favor, ejecuta el script SQL en Supabase.`)
                    return
                  }

                  // Add existing numbers to "All"
                  if (allNumbersList && initialNumbers.length > 0) {
                    const itemsToInsert = initialNumbers.map(number => ({
                      list_id: allNumbersList.id,
                      phone_number_id: number.id,
                      added_by: user.id,
                      notes: 'Agregado automáticamente a lista principal'
                    }))

                    const { error: insertError } = await supabase
                      .from('number_list_items')
                      .insert(itemsToInsert)
                      
                    if (insertError) {
                      console.error('Error adding numbers to list:', insertError)
                    } else {
                      console.log(`Added ${itemsToInsert.length} numbers to "All"`)
                    }
                  }

                  alert(`Listas creadas exitosamente:\n- All (${allNumbersList?.id})\n- Deleted (${discardedList?.id})\n\nRecargando página...`)
                  window.location.reload()
                } catch (error) {
                  console.error('Error creating lists:', error)
                  alert('Error al crear las listas. Verifica la consola para más detalles.')
                }
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Listas
              </Button>
            </div>
          </div>
        )}
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
      
      {/* Bulk Actions Dialog */}
      <BulkActionsDialog
        selectedNumbers={selectedNumbers}
        sourceListId={activeTab}
        onActionComplete={handleBulkActionComplete}
        open={bulkActionsOpen}
        onOpenChange={setBulkActionsOpen}
      >
        <div data-bulk-actions-trigger />
      </BulkActionsDialog>
    </div>
  )
}
