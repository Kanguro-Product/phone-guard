"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Phone, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Settings, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  BarChart3
} from "lucide-react"

interface PhoneNumber {
  id: string
  phone: string
  name?: string
  average_score: number
  spam_status: 'clean' | 'suspicious' | 'spam'
  reputation_score: number
  call_count: number
  success_rate: number
  last_used?: string
  tags: string[]
}

interface NumberSelectorProps {
  onNumbersSelected: (config: {
    groupA: PhoneNumber[]
    groupB: PhoneNumber[]
    rotationStrategy: 'single' | 'multiple' | 'same'
    rotationRules: {
      enabled: boolean
      interval: number // minutes
      pattern: 'sequential' | 'random' | 'weighted'
      weightByScore: boolean
    }
  }) => void
  initialConfig?: {
    groupA: PhoneNumber[]
    groupB: PhoneNumber[]
    rotationStrategy: 'single' | 'multiple' | 'same'
    rotationRules: {
      enabled: boolean
      interval: number
      pattern: 'sequential' | 'random' | 'weighted'
      weightByScore: boolean
    }
  }
}

export function NumberSelector({ onNumbersSelected, initialConfig }: NumberSelectorProps) {
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([])
  const [selectedGroupA, setSelectedGroupA] = useState<PhoneNumber[]>([])
  const [selectedGroupB, setSelectedGroupB] = useState<PhoneNumber[]>([])
  const [rotationStrategy, setRotationStrategy] = useState<'single' | 'multiple' | 'same'>('single')
  const [rotationRules, setRotationRules] = useState({
    enabled: false,
    interval: 60,
    pattern: 'sequential' as 'sequential' | 'random' | 'weighted',
    weightByScore: false
  })
  const [loading, setLoading] = useState(false)

  // Load available numbers from Numbers section
  useEffect(() => {
    loadAvailableNumbers()
  }, [])

  // Initialize with provided config
  useEffect(() => {
    if (initialConfig) {
      setSelectedGroupA(initialConfig.groupA)
      setSelectedGroupB(initialConfig.groupB)
      setRotationStrategy(initialConfig.rotationStrategy)
      setRotationRules(initialConfig.rotationRules)
    }
  }, [initialConfig])

  const loadAvailableNumbers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/numbers/available')
      const data = await response.json()
      
      if (response.ok) {
        setAvailableNumbers(data.numbers || [])
      } else {
        console.error('Error loading numbers:', data.error)
        // Fallback to mock data if API fails
        const mockNumbers: PhoneNumber[] = [
          {
            id: '1',
            phone: '+34600000001',
            name: 'Primary CLI',
            average_score: 85,
            spam_status: 'clean',
            reputation_score: 92,
            call_count: 150,
            success_rate: 78,
            last_used: '2024-01-20T10:30:00Z',
            tags: ['primary', 'high-quality']
          },
          {
            id: '2',
            phone: '+34600000002',
            name: 'Secondary CLI',
            average_score: 72,
            spam_status: 'clean',
            reputation_score: 88,
            call_count: 89,
            success_rate: 65,
            last_used: '2024-01-19T14:20:00Z',
            tags: ['secondary', 'medium-quality']
          },
          {
            id: '3',
            phone: '+34600000003',
            name: 'Backup CLI',
            average_score: 45,
            spam_status: 'suspicious',
            reputation_score: 55,
            call_count: 23,
            success_rate: 35,
            last_used: '2024-01-18T09:15:00Z',
            tags: ['backup', 'low-quality']
          },
          {
            id: '4',
            phone: '+34600000004',
            name: 'Test CLI',
            average_score: 90,
            spam_status: 'clean',
            reputation_score: 95,
            call_count: 200,
            success_rate: 85,
            last_used: '2024-01-20T16:45:00Z',
            tags: ['test', 'premium']
          },
          {
            id: '5',
            phone: '+34600000005',
            name: 'Marketing CLI',
            average_score: 38,
            spam_status: 'spam',
            reputation_score: 25,
            call_count: 12,
            success_rate: 15,
            last_used: '2024-01-15T11:30:00Z',
            tags: ['marketing', 'blocked']
          }
        ]
        setAvailableNumbers(mockNumbers)
      }
    } catch (error) {
      console.error('Error loading numbers:', error)
      // Fallback to empty array on error
      setAvailableNumbers([])
    } finally {
      setLoading(false)
    }
  }

  const getSpamStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'bg-green-100 text-green-800'
      case 'suspicious': return 'bg-yellow-100 text-yellow-800'
      case 'spam': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSpamStatusIcon = (status: string) => {
    switch (status) {
      case 'clean': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'suspicious': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'spam': return <Shield className="h-4 w-4 text-red-600" />
      default: return <Phone className="h-4 w-4 text-gray-600" />
    }
  }

  const toggleNumberSelection = (number: PhoneNumber, group: 'A' | 'B') => {
    if (group === 'A') {
      setSelectedGroupA(prev => {
        const isSelected = prev.some(n => n.id === number.id)
        if (isSelected) {
          return prev.filter(n => n.id !== number.id)
        } else {
          return [...prev, number]
        }
      })
    } else {
      setSelectedGroupB(prev => {
        const isSelected = prev.some(n => n.id === number.id)
        if (isSelected) {
          return prev.filter(n => n.id !== number.id)
        } else {
          return [...prev, number]
        }
      })
    }
  }

  const handleRotationStrategyChange = (strategy: 'single' | 'multiple' | 'same') => {
    setRotationStrategy(strategy)
    
    if (strategy === 'same') {
      // If same strategy, copy group A to group B
      setSelectedGroupB(selectedGroupA)
    } else if (strategy === 'single') {
      // If single strategy, keep only first number in each group
      setSelectedGroupA(prev => prev.slice(0, 1))
      setSelectedGroupB(prev => prev.slice(0, 1))
    }
  }

  const handleSaveConfiguration = () => {
    onNumbersSelected({
      groupA: selectedGroupA,
      groupB: selectedGroupB,
      rotationStrategy,
      rotationRules
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Number Selection & Rotation</h3>
          <p className="text-sm text-muted-foreground">
            Configure phone numbers for each test group and rotation strategy
          </p>
        </div>
        <Button onClick={handleSaveConfiguration} disabled={selectedGroupA.length === 0 || selectedGroupB.length === 0}>
          <Settings className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>

      {/* Rotation Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rotation Strategy</CardTitle>
          <CardDescription>Choose how numbers will be used in the test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className={`p-6 border rounded-lg cursor-pointer transition-colors ${
                rotationStrategy === 'single' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleRotationStrategyChange('single')}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Phone className="h-5 w-5" />
                <span className="font-medium text-base">Single Number</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Use one number per group (A: 1 number, B: 1 number)
              </p>
            </div>

            <div 
              className={`p-6 border rounded-lg cursor-pointer transition-colors ${
                rotationStrategy === 'multiple' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleRotationStrategyChange('multiple')}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Users className="h-5 w-5" />
                <span className="font-medium text-base">Multiple Numbers</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Use multiple numbers per group with rotation
              </p>
            </div>

            <div 
              className={`p-6 border rounded-lg cursor-pointer transition-colors ${
                rotationStrategy === 'same' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleRotationStrategyChange('same')}
            >
              <div className="flex items-center space-x-3 mb-3">
                <RotateCcw className="h-5 w-5" />
                <span className="font-medium text-base">Same Numbers</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Use the same numbers for both groups
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Number Selection */}
      <Tabs defaultValue="groupA" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="groupA" className="text-sm font-medium">
            Group A ({selectedGroupA.length} numbers)
          </TabsTrigger>
          <TabsTrigger value="groupB" className="text-sm font-medium">
            Group B ({selectedGroupB.length} numbers)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groupA" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Group A Numbers</CardTitle>
              <CardDescription>Select phone numbers for Group A</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading available numbers...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableNumbers.map((number) => (
                    <div 
                      key={number.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedGroupA.some(n => n.id === number.id) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleNumberSelection(number, 'A')}
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span className="font-medium">{number.phone}</span>
                          {number.name && (
                            <span className="text-sm text-muted-foreground">({number.name})</span>
                          )}
                        </div>
                        <Badge className={getSpamStatusColor(number.spam_status)}>
                          {number.spam_status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">Score: {number.average_score}</div>
                          <div className="text-xs text-muted-foreground">
                            {number.success_rate}% success
                          </div>
                        </div>
                        {getSpamStatusIcon(number.spam_status)}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groupB" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Group B Numbers</CardTitle>
              <CardDescription>Select phone numbers for Group B</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading available numbers...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableNumbers.map((number) => (
                    <div 
                      key={number.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedGroupB.some(n => n.id === number.id) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleNumberSelection(number, 'B')}
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span className="font-medium">{number.phone}</span>
                          {number.name && (
                            <span className="text-sm text-muted-foreground">({number.name})</span>
                          )}
                        </div>
                        <Badge className={getSpamStatusColor(number.spam_status)}>
                          {number.spam_status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">Score: {number.average_score}</div>
                          <div className="text-xs text-muted-foreground">
                            {number.success_rate}% success
                          </div>
                        </div>
                        {getSpamStatusIcon(number.spam_status)}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rotation Rules */}
      {rotationStrategy === 'multiple' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rotation Rules</CardTitle>
            <CardDescription>Configure how numbers will be rotated during the test</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Rotation</Label>
                <p className="text-sm text-muted-foreground">Rotate between selected numbers</p>
              </div>
              <Switch
                checked={rotationRules.enabled}
                onCheckedChange={(checked) => setRotationRules(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            {rotationRules.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rotation Interval (minutes)</Label>
                  <Input
                    type="number"
                    value={rotationRules.interval}
                    onChange={(e) => setRotationRules(prev => ({ ...prev, interval: parseInt(e.target.value) || 60 }))}
                    min="1"
                    max="1440"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rotation Pattern</Label>
                  <Select
                    value={rotationRules.pattern}
                    onValueChange={(value) => setRotationRules(prev => ({ ...prev, pattern: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Sequential</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="weighted">Weighted by Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Group A</h4>
              <div className="space-y-1">
                {selectedGroupA.map(number => (
                  <div key={number.id} className="flex items-center justify-between text-sm">
                    <span>{number.phone}</span>
                    <Badge variant="outline" className={getSpamStatusColor(number.spam_status)}>
                      {number.average_score}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Group B</h4>
              <div className="space-y-1">
                {selectedGroupB.map(number => (
                  <div key={number.id} className="flex items-center justify-between text-sm">
                    <span>{number.phone}</span>
                    <Badge variant="outline" className={getSpamStatusColor(number.spam_status)}>
                      {number.average_score}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
