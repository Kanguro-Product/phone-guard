import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, TrendingUp, Users, Activity, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DashboardStatsProps {
  stats: {
    total_numbers: number
    active_numbers: number
    spam_numbers: number
    avg_reputation: number
    total_cadences: number
    active_cadences: number
    total_calls_today: number
    successful_calls_today: number
    spam_calls_today: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const successRate =
    stats.total_calls_today > 0 ? Math.round((stats.successful_calls_today / stats.total_calls_today) * 100) : 0

  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Phone Numbers</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-semibold mb-1">Phone Numbers</p>
                    <p className="text-sm">Total count of all phone numbers in your account.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Active:</strong> Numbers ready for calls<br/>
                      <strong>Flagged:</strong> Numbers marked as spam
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.total_numbers}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active_numbers} active • {stats.spam_numbers} flagged
          </p>
        </CardContent>
      </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Reputation</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-semibold mb-1">Average Reputation Score</p>
                    <p className="text-sm">Weighted average reputation across all your phone numbers.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Formula:</strong> Σ(reputation_score) ÷ total_numbers<br/>
                      <strong>Range:</strong> 0-100 (higher is better)<br/>
                      <strong>Factors:</strong> SPAM reports, call success rate, validation results
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.avg_reputation ? Math.round(stats.avg_reputation) : 0}
          </div>
          <p className="text-xs text-muted-foreground">Out of 100 points</p>
        </CardContent>
      </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Calls</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-semibold mb-1">Today's Call Activity</p>
                    <p className="text-sm">Total calls made today across all your cadences.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Success Rate:</strong> (successful_calls ÷ total_calls) × 100<br/>
                      <strong>Includes:</strong> All call statuses (success, failed, busy, no_answer, spam)<br/>
                      <strong>Updated:</strong> Real-time as calls are logged
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.total_calls_today}</div>
          <p className="text-xs text-muted-foreground">{successRate}% success rate</p>
        </CardContent>
      </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Cadences</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-semibold mb-1">Active Cadences</p>
                    <p className="text-sm">Number of cadences currently running and making calls.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Active:</strong> Cadences with is_active = true<br/>
                      <strong>Total:</strong> All configured cadences (active + inactive)<br/>
                      <strong>Rotation:</strong> Active cadences rotate phone numbers automatically
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.active_cadences}</div>
          <p className="text-xs text-muted-foreground">{stats.total_cadences} total configured</p>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  )
}
