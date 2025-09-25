"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

interface Call {
  id: string
  status: string
  call_time: string
}

interface CallsChartProps {
  calls: Call[]
}

export function CallsChart({ calls }: CallsChartProps) {
  // Debug: Log the calls data to see what we're working with
  console.log("CallsChart - Raw calls data:", calls)
  console.log("CallsChart - Unique statuses:", [...new Set(calls.map(call => call.status))])
  
  // Group calls by day for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split("T")[0]
  })

  const chartData = last7Days.map((date) => {
    const dayCalls = calls.filter((call) => call.call_time.startsWith(date))

    return {
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      successful: dayCalls.filter((call) => 
        call.status === "success" || 
        call.status === "completed" || 
        call.status === "answered"
      ).length,
      failed: dayCalls.filter((call) => 
        call.status === "failed" || 
        call.status === "busy" || 
        call.status === "no_answer" ||
        call.status === "error"
      ).length,
      spam: dayCalls.filter((call) => 
        call.status === "spam_detected" || 
        call.status === "spam" ||
        call.status === "blocked"
      ).length,
      total: dayCalls.length,
    }
  })

  // Debug: Log the processed chart data
  console.log("CallsChart - Processed chart data:", chartData)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Call Activity (7 Days)</CardTitle>
        <CardDescription>Daily call volume and success rates</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="successful" stroke="#22c55e" strokeWidth={2} name="Successful" />
            <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name="Failed" />
            <Line type="monotone" dataKey="spam" stroke="#f97316" strokeWidth={2} name="SPAM" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
