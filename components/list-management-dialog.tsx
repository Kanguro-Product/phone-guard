"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  RefreshCw,
  Folder,
  Phone,
  Trash2 as TrashIcon
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface NumberList {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  is_default: boolean
  created_at: string
  updated_at: string
  count?: number
}

interface ListManagementDialogProps {
  lists: NumberList[]
  onListCreated?: () => void
  onListDeleted?: () => void
}

const colorOptions = [
  { name: 'Pink', value: '#F8BBD9' },
  { name: 'Peach', value: '#FFD3A5' },
  { name: 'Yellow', value: '#FFF2A1' },
  { name: 'Green', value: '#A8E6CF' },
  { name: 'Cyan', value: '#A8D8EA' },
  { name: 'Purple', value: '#C7CEEA' }
]

export function ListManagementDialog({ 
  lists,
  onListCreated,
  onListDeleted
}: ListManagementDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#A8D8EA' // Cyan pastel por defecto
  })
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()


  const handleCreateList = async () => {
    if (!formData.name.trim()) return
    
    try {
      setLoading('creating')

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found')
        return
      }

      const { data, error } = await supabase
        .from('number_lists')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          description: null,
          color: formData.color,
          icon: 'Folder'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating list:', error)
        return
      }

      // Reset form
      setFormData({
        name: '',
        color: '#A8D8EA'
      })

      // Refresh lists
      if (onListCreated) {
        onListCreated()
      }
    } catch (error) {
      console.error('Error in handleCreateList:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteList = async (listId: string) => {
    const listToDelete = lists.find(list => list.id === listId)
    const listName = listToDelete?.name || 'esta lista'
    const numberCount = listToDelete?.count || 0
    
    const confirmMessage = numberCount > 0 
      ? `¿Estás seguro de que quieres eliminar "${listName}"? Los ${numberCount} números de esta lista se moverán automáticamente a "Números Descartados".`
      : `¿Estás seguro de que quieres eliminar "${listName}"?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setLoading(`deleting-${listId}`)
      
      const response = await fetch(`/api/number-lists?id=${listId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar la lista')
      }

      const result = await response.json()
      
      // Show success message with details
      if (result.movedNumbers > 0) {
        alert(`Lista eliminada exitosamente. ${result.movedNumbers} números movidos a "Números Descartados".`)
      } else {
        alert('Lista eliminada exitosamente.')
      }

      if (onListDeleted) {
        onListDeleted()
      }
    } catch (error) {
      console.error('Error in handleDeleteList:', error)
      alert(`Error al eliminar la lista: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(null)
    }
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

  return (
    <div className="space-y-6">
      {/* Existing Lists - Beautiful Design */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-800">Listas Existentes</h3>
        </div>
        
        {lists.length === 0 ? (
          <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="text-gray-400 mb-2">
              <Folder className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500">No hay listas creadas</p>
            <p className="text-xs text-gray-400 mt-1">Crea tu primera lista abajo</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
            {lists.map((list) => (
              <div key={list.id} className="group flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: list.color }}>
                    {getListIcon(list)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-gray-800 truncate">{list.name}</div>
                    <div className="text-xs text-gray-500">
                      {list.is_system_list ? 'Sistema' : 'Personalizada'}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
                    {list.count || 0}
                  </Badge>
                </div>
                {!list.is_system_list && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteList(list.id)}
                    disabled={loading?.includes('deleting')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    {loading?.includes(`deleting-${list.id}`) ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create New List - Beautiful Design */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-800">Crear Nueva Lista</h3>
        </div>
        
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nombre de la Lista</Label>
            <Input
              id="name"
              placeholder="Ej: Clientes VIP, Leads Calientes..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Color</Label>
            <div className="grid grid-cols-3 gap-3">
              {colorOptions.map((color) => (
                <Button
                  key={color.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`h-12 w-12 p-2 border-2 transition-all duration-200 hover:scale-105 ${
                    formData.color === color.value 
                      ? 'border-gray-800 ring-2 ring-gray-400 shadow-lg' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  title={color.name}
                >
                  <Folder className="h-6 w-6" style={{ color: color.value, fill: color.value }} />
                </Button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleCreateList}
            disabled={!formData.name.trim() || loading !== null}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {loading === 'creating' ? 'Creando...' : 'Crear Lista'}
          </Button>
        </div>
      </div>
    </div>
  )
}
