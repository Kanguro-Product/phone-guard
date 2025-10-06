"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface UseRealtimeUpdatesOptions {
  table: string
  enabled?: boolean
  pollInterval?: number
  onUpdate?: (data: any) => void
}

export function useRealtimeUpdates({
  table,
  enabled = true,
  pollInterval = 5000,
  onUpdate
}: UseRealtimeUpdatesOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Debounce refresh to avoid multiple refreshes in quick succession
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null)

  // Force refresh function with debounce
  const refresh = useCallback(() => {
    // Clear any pending refresh
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
    }
    
    // Set a new timeout to refresh after 1 second of no changes
    const timeout = setTimeout(() => {
      console.log(`[Realtime] Debounced refresh triggered for ${table}`)
      router.refresh()
      setLastUpdate(new Date())
    }, 1000)
    
    setRefreshTimeout(timeout)
  }, [router, table, refreshTimeout])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!enabled) return

    console.log(`[Realtime] Setting up subscription for ${table}`)

    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`[Realtime] ${table} change detected`)
          setLastUpdate(new Date())
          
          if (onUpdate) {
            onUpdate(payload)
          } else {
            // Default behavior: debounced refresh
            refresh()
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] ${table} subscription active`)
        }
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      console.log(`[Realtime] Cleaning up subscription for ${table}`)
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
      supabase.removeChannel(channel)
    }
  }, [table, enabled, onUpdate, refresh, supabase, refreshTimeout])

  // Polling fallback - DISABLED to avoid constant refreshes
  // The realtime subscription should work, if not we'll rely on manual refresh
  useEffect(() => {
    if (!enabled || isConnected) return

    console.log(`[Realtime] Realtime not connected for ${table}, but polling is disabled to avoid constant refreshes`)
    
    // No polling - just rely on realtime or manual refresh
  }, [enabled, isConnected, table])

  return {
    isConnected,
    lastUpdate,
    refresh,
    status: (isConnected ? 'realtime' : 'polling') as 'realtime' | 'polling' | 'disconnected'
  }
}

// Hook específico para números telefónicos
export function usePhoneNumbersRealtime() {
  return useRealtimeUpdates({
    table: 'phone_numbers',
    pollInterval: 3000, // Poll cada 3 segundos si no hay realtime
  })
}

// Hook específico para llamadas
export function useCallsRealtime() {
  return useRealtimeUpdates({
    table: 'calls',
    pollInterval: 2000, // Poll cada 2 segundos para llamadas
  })
}

// Hook específico para cadencias
export function useCadencesRealtime() {
  return useRealtimeUpdates({
    table: 'cadences',
    pollInterval: 5000, // Poll cada 5 segundos para cadencias
  })
}

// Hook específico para logs de reputación
export function useReputationLogsRealtime() {
  return useRealtimeUpdates({
    table: 'reputation_logs',
    pollInterval: 3000,
  })
}
