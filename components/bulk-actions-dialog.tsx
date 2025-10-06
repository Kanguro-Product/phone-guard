"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ErrorDetailsDialog } from "@/components/error-details-dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Settings2, 
  FolderPlus, 
  FolderMinus, 
  Trash2, 
  ArrowRight, 
  List,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Folder,
  Phone
} from "lucide-react"

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
}

interface BulkActionsDialogProps {
  children: React.ReactNode
  selectedNumbers: Set<string>
  sourceListId?: string
  onActionComplete?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BulkActionsDialog({ 
  children, 
  selectedNumbers, 
  sourceListId,
  onActionComplete,
  open,
  onOpenChange
}: BulkActionsDialogProps) {
  const [lists, setLists] = useState<NumberList[]>([])
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [targetListId, setTargetListId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [error, setError] = useState<{ message: string; details?: string } | null>(null)
  const supabase = createClient()

  // Load number lists
  useEffect(() => {
    const loadLists = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('number_lists')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('name')

        if (error) {
          console.error("Error fetching lists:", error)
          return
        }

        console.log("Lists loaded in bulk dialog:", data)
        setLists(data || [])
      } catch (error) {
        console.error("Error in loadLists:", error)
      }
    }

    const dialogOpen = open !== undefined ? open : isOpen
    console.log("Bulk dialog open state:", { open, isOpen, dialogOpen })
    if (dialogOpen) {
      loadLists()
    }
  }, [open, isOpen, supabase])

  const handleBulkAction = async () => {
    if (!selectedAction || selectedNumbers.size === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/number-lists/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: selectedAction,
          phoneNumberIds: Array.from(selectedNumbers),
          sourceListId: sourceListId,
          targetListId: targetListId || undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.details || errorData.error || 'Error en la acción bulk')
      }

      const result = await response.json()
      
      if (onActionComplete) {
        onActionComplete()
      }
      
      setIsOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error in bulk action:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      
      // Try to extract details from the error message
      let details = ''
      if (error instanceof Error && error.message.includes('details:')) {
        const parts = error.message.split('details: ')
        if (parts.length > 1) {
          details = parts[1]
          setError({
            message: parts[0].replace(/Error al ejecutar la acción: /, '').replace(/options:.+/, ''),
            details: details
          })
        }
      }
      
      if (!details) {
        setError({
          message: errorMessage,
          details: error instanceof Error ? error.stack : undefined
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedAction('')
    setTargetListId('')
    setShowConfirmDialog(false)
    setError(null)
    setLoading(false)
  }

  const handleConfirm = () => {
    setShowConfirmDialog(true)
  }

  const executeAction = () => {
    handleBulkAction()
    setShowConfirmDialog(false)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'transfer_to_list': return <ArrowRight className="h-4 w-4" />
      case 'remove_from_list': return <FolderMinus className="h-4 w-4" />
      case 'move_to_discarded': return <Trash2 className="h-4 w-4" />
      case 'restore_from_discarded': return <RefreshCw className="h-4 w-4" />
      default: return <Settings2 className="h-4 w-4" />
    }
  }

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'transfer_to_list': return 'Mover los números seleccionados a otra lista'
      case 'remove_from_list': return 'Quitar los números de esta lista (mantener en lista principal)'
      case 'move_to_discarded': return 'Eliminar completamente los números (se moverán a lista de descartados)'
      case 'restore_from_discarded': return 'Restaurar los números desde la lista de descartados'
      default: return ''
    }
  }

  const getTargetListName = () => {
    const targetList = lists.find(list => list.id === targetListId)
    return targetList?.name || 'Lista seleccionada'
  }

  const getListIcon = (list: NumberList) => {
    // "All" siempre usa emoji de teléfono
    if (list.name === 'All') {
      return <span className="text-sm">📞</span>
    }
    
    // "Deleted" siempre usa emoji de papelera
    if (list.name === 'Deleted') {
      return <span className="text-sm">🗑️</span>
    }
    
    // Otras listas usan carpeta pintada con el color configurado
    return <Folder className="h-4 w-4" style={{ color: list.color, fill: list.color }} />
  }

  const selectedCount = selectedNumbers.size

  // Don't render if no numbers are selected
  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <Dialog 
        open={open !== undefined ? open : isOpen} 
        onOpenChange={(newOpen) => {
          if (onOpenChange) {
            onOpenChange(newOpen)
          } else {
            setIsOpen(newOpen)
          }
          if (!newOpen) {
            resetForm()
          }
        }}
      >
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Acciones Bulk ({selectedCount} números)
            </DialogTitle>
            <DialogDescription>
              Selecciona una acción para los {selectedCount} números seleccionados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Action Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Acción</label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una acción..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer_to_list">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Mover a lista</span>
                    </div>
                  </SelectItem>
                  {sourceListId && (
                    <SelectItem value="remove_from_list">
                      <div className="flex items-center gap-2">
                        <FolderMinus className="h-4 w-4" />
                        <span>Quitar de esta lista</span>
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="move_to_discarded">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <span>Eliminar completamente</span>
                    </div>
                  </SelectItem>
                  {sourceListId && (
                    <SelectItem value="restore_from_discarded">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-green-500" />
                        <span>Restaurar desde descartados</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Target List Selection - only show for transfer action */}
            {selectedAction === 'transfer_to_list' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Lista destino</label>
                <Select value={targetListId} onValueChange={setTargetListId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una lista..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.length === 0 ? (
                      <SelectItem value="" disabled>
                        <span className="text-muted-foreground">No hay listas disponibles</span>
                      </SelectItem>
                    ) : (
                      lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          <div className="flex items-center gap-2">
                            {getListIcon(list)}
                            <span>{list.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Description */}
            {selectedAction && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2">
                  {getActionIcon(selectedAction)}
                  <div>
                    <p className="font-medium text-sm">
                      {getActionDescription(selectedAction)}
                    </p>
                    {selectedAction === 'transfer_to_list' && targetListId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Los números se moverán a: <strong>{getTargetListName()}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (onOpenChange) {
                    onOpenChange(false)
                  } else {
                    setIsOpen(false)
                  }
                  resetForm()
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={!selectedAction || (selectedAction === 'transfer_to_list' && !targetListId) || loading}
                className="flex-1"
              >
                {loading ? 'Procesando...' : 'Continuar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {selectedAction === 'move_to_discarded' ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : selectedAction === 'remove_from_list' ? (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-blue-500" />
              )}
              Confirmar Acción
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  ¿Estás seguro de que quieres ejecutar esta acción en {selectedCount} número{selectedCount > 1 ? 's' : ''}?
                </p>
                <div className="p-2 bg-muted rounded text-sm">
                  <strong>Acción:</strong> {getActionDescription(selectedAction)}
                </div>
                {selectedAction === 'transfer_to_list' && targetListId && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
                    <strong>Destino:</strong> Lista "{getTargetListName()}"
                  </div>
                )}
                {selectedAction === 'move_to_discarded' && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm">
                    <strong>Advertencia:</strong> Los números se eliminarán permanentemente y se moverán a "Números Descartados"
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeAction}
              disabled={loading}
              className={selectedAction === 'move_to_discarded' ? 'bg-red-600 hover:bg-red-700' : undefined}
            >
              {loading ? 'Procesando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Details Dialog */}
      {error && (
        <ErrorDetailsDialog
          open={!!error}
          onOpenChange={(open) => !open && setError(null)}
          error={error.message}
          details={error.details}
          title="Error en Acción Bulk"
        />
      )}
    </>
  )
}
