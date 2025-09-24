import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, Info, TrendingDown } from "lucide-react"

interface PhoneNumber {
  id: string
  number: string
  reputation_score: number
  spam_reports: number
  status: string
}

interface SystemAlertsProps {
  phoneNumbers: PhoneNumber[]
  stats: {
    spam_numbers: number
    avg_reputation: number
    spam_calls_today: number
  }
}

export function SystemAlerts({ phoneNumbers, stats }: SystemAlertsProps) {
  const alerts = []

  // Check for low reputation numbers
  const lowReputationNumbers = phoneNumbers.filter((n) => n.reputation_score < 60)
  if (lowReputationNumbers.length > 0) {
    alerts.push({
      type: "warning",
      icon: <TrendingDown className="h-4 w-4" />,
      title: "Low Reputation Numbers",
      description: `${lowReputationNumbers.length} phone numbers have reputation scores below 60. Consider reviewing their usage.`,
    })
  }

  // Check for SPAM reports
  if (stats.spam_calls_today > 0) {
    alerts.push({
      type: "error",
      icon: <AlertTriangle className="h-4 w-4" />,
      title: "SPAM Detected Today",
      description: `${stats.spam_calls_today} calls were flagged as SPAM today. Monitor affected numbers closely.`,
    })
  }

  // Check for blocked numbers
  const blockedNumbers = phoneNumbers.filter((n) => n.status === "blocked" || n.status === "spam")
  if (blockedNumbers.length > 0) {
    alerts.push({
      type: "warning",
      icon: <AlertTriangle className="h-4 w-4" />,
      title: "Blocked Numbers",
      description: `${blockedNumbers.length} phone numbers are currently blocked or flagged as SPAM.`,
    })
  }

  // Good news - high reputation
  if (stats.avg_reputation >= 80 && alerts.length === 0) {
    alerts.push({
      type: "success",
      icon: <CheckCircle className="h-4 w-4" />,
      title: "Excellent Reputation",
      description: "All your phone numbers maintain high reputation scores. Keep up the good work!",
    })
  }

  // System status
  alerts.push({
    type: "info",
    icon: <Info className="h-4 w-4" />,
    title: "System Status",
    description: "All monitoring systems are operational. Real-time SPAM detection is active.",
  })

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive"
      case "warning":
        return "default"
      case "success":
        return "default"
      case "info":
      default:
        return "default"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">System Alerts</CardTitle>
        <CardDescription>Important notifications and system status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={getAlertVariant(alert.type)}>
              {alert.icon}
              <AlertDescription>
                <div className="font-medium text-sm mb-1">{alert.title}</div>
                <div className="text-xs text-muted-foreground">{alert.description}</div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
