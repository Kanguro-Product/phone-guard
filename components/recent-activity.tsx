import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react"

interface Call {
  id: string
  status: string
  call_time: string
  destination_number: string
  duration?: number
  phone_numbers: {
    number: string
    provider: string
  }
}

interface RecentActivityProps {
  calls: Call[]
}

export function RecentActivity({ calls }: RecentActivityProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "spam_detected":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "busy":
      case "no_answer":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Phone className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      failed: "destructive",
      spam_detected: "destructive",
      busy: "secondary",
      no_answer: "secondary",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"} className="text-xs">
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Recent Activity</CardTitle>
        <CardDescription>Latest call attempts and their outcomes</CardDescription>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Phone className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent calls</p>
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(call.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm text-foreground">{call.phone_numbers.number}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="font-mono text-sm text-foreground">{call.destination_number}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground">{formatTime(call.call_time)}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{call.phone_numbers.provider}</span>
                      {call.duration && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{formatDuration(call.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div>{getStatusBadge(call.status)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
