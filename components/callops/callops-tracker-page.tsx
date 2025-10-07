"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Clock, CheckCircle, AlertTriangle, XCircle, PlayCircle } from "lucide-react"
import { CreateTestDialog } from "./create-test-dialog"
import { TestCard } from "./test-card"
import { Badge } from "@/components/ui/badge"

interface Test {
  id: string
  test_key: string
  code: string
  full_id: string
  name: string
  alternative_name?: string
  hypothesis: string
  objective: string
  design: string
  variants: any[]
  sample_per_variant: any
  duration_hours: number
  status: 'Pending' | 'Running' | 'ToReport' | 'Finished' | 'Canceled'
  created_at: string
  started_at?: string
  ended_at?: string
  owner_user_id: string
  parent_test_key?: string
  iteration_index: number
  success_criteria: string
  independent_variable: string
  dependent_variables: any[]
  planned_start_date?: string
  channels: any[]
  operational_notes?: string
  phone_numbers_used: any[]
}

interface PhoneNumber {
  id: string
  number: string
  provider: string
  status: string
}

interface CallOpsTrackerPageProps {
  user: User
  initialTests: Test[]
  phoneNumbers: PhoneNumber[]
}

export function CallOpsTrackerPage({ user, initialTests, phoneNumbers }: CallOpsTrackerPageProps) {
  const [tests, setTests] = useState<Test[]>(initialTests)
  const [filteredTests, setFilteredTests] = useState<Test[]>(initialTests)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Apply filters
  useEffect(() => {
    let filtered = tests

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => test.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(test => 
        test.name.toLowerCase().includes(query) ||
        test.alternative_name?.toLowerCase().includes(query) ||
        test.full_id.toLowerCase().includes(query) ||
        test.hypothesis.toLowerCase().includes(query)
      )
    }

    setFilteredTests(filtered)
  }, [tests, statusFilter, searchQuery])

  // Refresh tests
  const refreshTests = async () => {
    const response = await fetch('/api/callops/tests')
    if (response.ok) {
      const data = await response.json()
      setTests(data.tests)
    }
  }

  // Handle test created
  const handleTestCreated = (newTest: Test) => {
    setTests(prev => [newTest, ...prev])
    setCreateDialogOpen(false)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      Running: { icon: PlayCircle, color: 'bg-blue-100 text-blue-800 border-blue-300' },
      ToReport: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800 border-orange-300' },
      Finished: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300' },
      Canceled: { icon: XCircle, color: 'bg-gray-100 text-gray-800 border-gray-300' }
    }

    const config = styles[status as keyof typeof styles] || styles.Pending
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  // Get status count
  const getStatusCount = (status: string) => {
    if (status === 'all') return tests.length
    return tests.filter(t => t.status === status).length
  }

  return (
    <>
      <Navigation user={user} />
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CallOps Tracker</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track your operational experiments
            </p>
          </div>
        <CreateTestDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onTestCreated={handleTestCreated}
          phoneNumbers={phoneNumbers}
          userId={user.id}
        >
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Test
          </Button>
        </CreateTestDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div 
          className={`p-4 border rounded-lg cursor-pointer transition-all ${statusFilter === 'all' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="text-2xl font-bold">{getStatusCount('all')}</div>
          <div className="text-sm text-muted-foreground">All Tests</div>
        </div>
        <div 
          className={`p-4 border rounded-lg cursor-pointer transition-all ${statusFilter === 'Pending' ? 'border-yellow-500 bg-yellow-50' : 'hover:border-yellow-300'}`}
          onClick={() => setStatusFilter('Pending')}
        >
          <div className="text-2xl font-bold">{getStatusCount('Pending')}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
        <div 
          className={`p-4 border rounded-lg cursor-pointer transition-all ${statusFilter === 'Running' ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'}`}
          onClick={() => setStatusFilter('Running')}
        >
          <div className="text-2xl font-bold">{getStatusCount('Running')}</div>
          <div className="text-sm text-muted-foreground">Running</div>
        </div>
        <div 
          className={`p-4 border rounded-lg cursor-pointer transition-all ${statusFilter === 'ToReport' ? 'border-orange-500 bg-orange-50' : 'hover:border-orange-300'}`}
          onClick={() => setStatusFilter('ToReport')}
        >
          <div className="text-2xl font-bold">{getStatusCount('ToReport')}</div>
          <div className="text-sm text-muted-foreground">To Report</div>
        </div>
        <div 
          className={`p-4 border rounded-lg cursor-pointer transition-all ${statusFilter === 'Finished' ? 'border-green-500 bg-green-50' : 'hover:border-green-300'}`}
          onClick={() => setStatusFilter('Finished')}
        >
          <div className="text-2xl font-bold">{getStatusCount('Finished')}</div>
          <div className="text-sm text-muted-foreground">Finished</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or hypothesis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant={statusFilter !== 'all' ? 'default' : 'outline'}
          onClick={() => {
            setStatusFilter('all')
            setSearchQuery('')
          }}
        >
          <Filter className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>

      {/* Tests Grid */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <div className="text-muted-foreground text-lg mb-4">
            {tests.length === 0 
              ? "No tests yet. Create your first test to get started!"
              : "No tests match your filters."
            }
          </div>
          {tests.length === 0 && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Test
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTests.map(test => (
            <TestCard 
              key={test.id} 
              test={test} 
              onUpdate={refreshTests}
              phoneNumbers={phoneNumbers}
            />
          ))}
        </div>
      )}
      </div>
    </>
  )
}
