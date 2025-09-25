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

  // Force refresh function
  const refresh = useCallback(() => {
    console.log(`[Realtime] Manual refresh triggered for ${table}`)
    router.refresh()
    setLastUpdate(new Date())
  }, [router, table])

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
          console.log(`[Realtime] ${table} change detected:`, payload)
          setLastUpdate(new Date())
          
          if (onUpdate) {
            onUpdate(payload)
          } else {
            // Default behavior: refresh the page
            refresh()
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] ${table} subscription status:`, status)
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      console.log(`[Realtime] Cleaning up subscription for ${table}`)
      supabase.removeChannel(channel)
    }
  }, [table, enabled, onUpdate, refresh, supabase])

  // Polling fallback
  useEffect(() => {
    if (!enabled || isConnected) return

    console.log(`[Realtime] Setting up polling for ${table} (${pollInterval}ms)`)

    const interval = setInterval(() => {
      console.log(`[Realtime] Polling ${table} for updates`)
      refresh()
    }, pollInterval)

    return () => {
      console.log(`[Realtime] Cleaning up polling for ${table}`)
      clearInterval(interval)
    }
  }, [enabled, isConnected, pollInterval, refresh, table])

  return {
    isConnected,
    lastUpdate,
    refresh,
    status: isConnected ? 'realtime' : 'polling'
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
