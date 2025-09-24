import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Phone, TrendingUp, AlertTriangle, Shield, Activity } from "lucide-react"

interface AdminStatsProps {
  users: any[]
  systemStats: any[]
}

export function AdminStats({ users, systemStats }: AdminStatsProps) {
  // Calculate user statistics
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.is_active).length
  const adminUsers = users.filter((u) => u.role === "admin").length
  const managerUsers = users.filter((u) => u.role === "manager").length

  // Calculate phone number statistics
  const totalPhoneNumbers = systemStats.length
  const activeNumbers = systemStats.filter((n) => n.status === "active").length
  const spamNumbers = systemStats.filter((n) => n.status === "spam").length
  const avgReputation =
    systemStats.length > 0
      ? Math.round(systemStats.reduce((sum, n) => sum + n.reputation_score, 0) / systemStats.length)
      : 0

  // Calculate recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentUsers = users.filter((u) => new Date(u.created_at) >= sevenDaysAgo).length

  const recentNumbers = systemStats.filter((n) => new Date(n.created_at) >= sevenDaysAgo).length

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">User Statistics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {activeUsers} active • {totalUsers - activeUsers} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Administrators</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{adminUsers}</div>
              <p className="text-xs text-muted-foreground">{managerUsers} managers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Users (7d)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{recentUsers}</div>
              <p className="text-xs text-muted-foreground">Recent registrations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">User Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalUsers > 0 ? Math.round((recentUsers / totalUsers) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Weekly growth rate</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Statistics */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">System Statistics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Phone Numbers</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalPhoneNumbers}</div>
              <p className="text-xs text-muted-foreground">
                {activeNumbers} active • {spamNumbers} flagged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Reputation</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{avgReputation}</div>
              <p className="text-xs text-muted-foreground">System-wide average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">SPAM Detection</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{spamNumbers}</div>
              <p className="text-xs text-muted-foreground">
                {totalPhoneNumbers > 0 ? Math.round((spamNumbers / totalPhoneNumbers) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Numbers (7d)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{recentNumbers}</div>
              <p className="text-xs text-muted-foreground">Recently added</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
