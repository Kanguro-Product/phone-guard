"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RealtimeStatusProps {
  status: 'realtime' | 'polling' | 'disconnected'
  lastUpdate?: Date | null
  onRefresh?: () => void
}

export function RealtimeStatus({ status, lastUpdate, onRefresh }: RealtimeStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'realtime':
        return {
          icon: <Wifi className="h-3 w-3" />,
          label: "Tiempo Real",
          variant: "default" as const,
          color: "text-green-500",
          tooltip: "Conectado en tiempo real - Los datos se actualizan automáticamente"
        }
      case 'polling':
        return {
          icon: <RefreshCw className="h-3 w-3 animate-spin" />,
          label: "Actualizando",
          variant: "secondary" as const,
          color: "text-blue-500",
          tooltip: "Actualizando datos cada pocos segundos"
        }
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          label: "Desconectado",
          variant: "destructive" as const,
          color: "text-red-500",
          tooltip: "Sin conexión - Los datos no se actualizan automáticamente"
        }
    }
  }

  const config = getStatusConfig()
  const timeAgo = lastUpdate ? getTimeAgo(lastUpdate) : null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2">
            <Badge variant={config.variant} className="text-xs">
              <span className={config.color}>
                {config.icon}
              </span>
              <span className="ml-1">{config.label}</span>
            </Badge>
            {timeAgo && (
              <span className="text-xs text-muted-foreground">
                {timeAgo}
              </span>
            )}
            {onRefresh && status !== 'realtime' && (
              <button
                onClick={onRefresh}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Actualizar ahora"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium mb-1">{config.tooltip}</p>
            {lastUpdate && (
              <p className="text-sm text-muted-foreground">
                Última actualización: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `hace ${diffInSeconds}s`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `hace ${minutes}m`
  } else {
    const hours = Math.floor(diffInSeconds / 3600)
    return `hace ${hours}h`
  }
}
