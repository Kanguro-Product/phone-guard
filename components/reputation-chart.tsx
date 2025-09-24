"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface PhoneNumber {
  id: string
  number: string
  reputation_score: number
  provider: string
}

interface ReputationChartProps {
  phoneNumbers: PhoneNumber[]
}

export function ReputationChart({ phoneNumbers }: ReputationChartProps) {
  // Group numbers by reputation ranges
  const reputationRanges = [
    { range: "90-100", min: 90, max: 100, count: 0, color: "#22c55e" },
    { range: "80-89", min: 80, max: 89, count: 0, color: "#84cc16" },
    { range: "70-79", min: 70, max: 79, count: 0, color: "#eab308" },
    { range: "60-69", min: 60, max: 69, count: 0, color: "#f97316" },
    { range: "0-59", min: 0, max: 59, count: 0, color: "#ef4444" },
  ]

  phoneNumbers.forEach((number) => {
    const range = reputationRanges.find((r) => number.reputation_score >= r.min && number.reputation_score <= r.max)
    if (range) range.count++
  })

  const chartData = reputationRanges.map((range) => ({
    range: range.range,
    count: range.count,
    fill: range.color,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Reputation Distribution</CardTitle>
        <CardDescription>Number of phone numbers by reputation score range</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="range"
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
            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
