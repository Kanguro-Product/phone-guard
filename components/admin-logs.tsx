import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, User, Settings, Shield, Crown, UserCheck, UserX } from "lucide-react"

interface AdminLogsProps {
  logs: any[]
}

export function AdminLogs({ logs }: AdminLogsProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "role_change":
        return <Crown className="h-4 w-4 text-blue-500" />
      case "user_activated":
        return <UserCheck className="h-4 w-4 text-green-500" />
      case "user_deactivated":
        return <UserX className="h-4 w-4 text-red-500" />
      case "system_settings_updated":
        return <Settings className="h-4 w-4 text-orange-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActionBadge = (action: string) => {
    const variants = {
      role_change: "default",
      user_activated: "default",
      user_deactivated: "destructive",
      system_settings_updated: "secondary",
    } as const

    return (
      <Badge variant={variants[action as keyof typeof variants] || "outline"} className="text-xs">
        {action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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

  const formatDetails = (details: any) => {
    if (!details) return "No details"

    if (details.new_role) {
      return `Changed role to ${details.new_role}`
    }

    if (details.updated_settings) {
      return `Updated ${details.updated_settings.length} settings`
    }

    if (details.previous_status !== undefined) {
      return `Status changed from ${details.previous_status ? "active" : "inactive"}`
    }

    return JSON.stringify(details)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <Activity className="h-5 w-5" />
          <span>Admin Activity Logs</span>
        </CardTitle>
        <CardDescription>Recent administrative actions and system changes ({logs.length} entries)</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No admin activity logged yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">Admin</TableHead>
                <TableHead className="text-muted-foreground">Action</TableHead>
                <TableHead className="text-muted-foreground">Target</TableHead>
                <TableHead className="text-muted-foreground">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-foreground">{formatTime(log.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">
                          {log.admin_profiles?.full_name || "Unknown Admin"}
                        </div>
                        <div className="text-xs text-muted-foreground">{log.admin_profiles?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getActionIcon(log.action)}
                      {getActionBadge(log.action)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.target_profiles ? (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">
                            {log.target_profiles.full_name || "Unknown User"}
                          </div>
                          <div className="text-xs text-muted-foreground">{log.target_profiles.email}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground max-w-xs truncate">{formatDetails(log.details)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
