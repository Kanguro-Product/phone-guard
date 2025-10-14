"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  Smartphone, 
  Clock, 
  MessageSquare, 
  Shield, 
  Target, 
  TrendingUp, 
  Users, 
  Phone,
  Mail,
  Zap,
  Star,
  Copy,
  History,
  BarChart3,
  Edit,
  Save,
  X,
  Plus
} from "lucide-react"

interface TestTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: string
  successRate: number
  icon: React.ReactNode
  config: any
  tags: string[]
  iterations?: number
  lastUsed?: string
}

interface TestTemplatesProps {
  onSelectTemplate: (template: TestTemplate) => void
  onCloneTest: (testId: string) => void
  existingTests: any[]
}

export function TestTemplates({ onSelectTemplate, onCloneTest, existingTests }: TestTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TestTemplate | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showIterationsDialog, setShowIterationsDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TestTemplate | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [customTemplate, setCustomTemplate] = useState({
    name: '',
    description: '',
    objective: '',
    category: 'custom',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimatedDuration: '1-2 days',
    successRate: 75,
    tags: [] as string[],
    config: {}
  })

  const templates: TestTemplate[] = [
    {
      id: 'mobile_vs_fixed',
      name: 'Mobile vs Fixed Line Performance',
      description: 'Compare mobile and fixed line calling strategies to optimize connection rates',
      category: 'Performance',
      difficulty: 'beginner',
      estimatedDuration: '2-3 days',
      successRate: 85,
      icon: <Smartphone className="h-6 w-6" />,
      tags: ['mobile', 'fixed-line', 'performance'],
      config: {
        groups: {
          A: { label: 'Mobile Strategy', cli: '+34123456789' },
          B: { label: 'Fixed Line Strategy', cli: '+34987654321' }
        },
        attempts_policy: { max_attempts: 3, ring_times_sec: [30, 30, 30] },
        nudges: {
          whatsapp: { enabled: true, when: 'after_attempt_2_fail' },
          voicemail: { enabled: true }
        }
      }
    },
    {
      id: 'timing_optimization',
      name: 'Call Timing Optimization',
      description: 'Test different calling times to find optimal contact windows',
      category: 'Timing',
      difficulty: 'intermediate',
      estimatedDuration: '1 week',
      successRate: 78,
      icon: <Clock className="h-6 w-6" />,
      tags: ['timing', 'optimization', 'scheduling'],
      config: {
        groups: {
          A: { label: 'Morning Calls (9-12)', cli: '+34123456789' },
          B: { label: 'Afternoon Calls (14-17)', cli: '+34987654321' }
        },
        workday: { start: '09:00', end: '17:00' },
        waves: { enabled: true, schedule: [
          { time: '09:00', size: 5 },
          { time: '11:00', size: 5 },
          { time: '14:00', size: 5 },
          { time: '16:00', size: 5 }
        ]}
      }
    },
    {
      id: 'whatsapp_nudge',
      name: 'WhatsApp Nudge Effectiveness',
      description: 'Test WhatsApp follow-up messages to improve response rates',
      category: 'Communication',
      difficulty: 'beginner',
      estimatedDuration: '3-4 days',
      successRate: 92,
      icon: <MessageSquare className="h-6 w-6" />,
      tags: ['whatsapp', 'nudges', 'communication'],
      config: {
        groups: {
          A: { label: 'No WhatsApp Nudge', cli: '+34123456789' },
          B: { label: 'With WhatsApp Nudge', cli: '+34987654321' }
        },
        nudges: {
          whatsapp: { 
            enabled: true, 
            when: 'after_attempt_2_fail',
            text_template: 'Hi {{lead_id}}, we tried to reach you. Best time to call?',
            buttons: [
              { text: 'Call me now', reply: { id: 'callback_now', title: 'Immediate Callback' } },
              { text: 'Schedule call', reply: { id: 'schedule', title: 'Schedule Call' } }
            ]
          }
        }
      }
    },
    {
      id: 'spam_protection',
      name: 'Spam Protection Analysis',
      description: 'Test different spam protection levels to optimize call quality',
      category: 'Quality',
      difficulty: 'advanced',
      estimatedDuration: '1-2 weeks',
      successRate: 67,
      icon: <Shield className="h-6 w-6" />,
      tags: ['spam', 'quality', 'protection'],
      config: {
        groups: {
          A: { label: 'Standard Protection', cli: '+34123456789' },
          B: { label: 'Enhanced Protection', cli: '+34987654321' }
        },
        spam_checker: {
          enabled: true,
          thresholds: { block_above: 80, slow_above: 60, warn_above: 40 },
          actions: { block: 'skip_call', slow: 'downshift_rate', warn: 'log_only' }
        }
      }
    },
    {
      id: 'multi_channel',
      name: 'Multi-Channel Strategy',
      description: 'Test integrated calling, WhatsApp, and email campaigns',
      category: 'Omnichannel',
      difficulty: 'advanced',
      estimatedDuration: '2 weeks',
      successRate: 73,
      icon: <Target className="h-6 w-6" />,
      tags: ['omnichannel', 'integration', 'multi-channel'],
      config: {
        groups: {
          A: { label: 'Call Only', cli: '+34123456789' },
          B: { label: 'Call + WhatsApp + Email', cli: '+34987654321' }
        },
        nudges: {
          whatsapp: { enabled: true, when: 'after_attempt_1_fail' },
          email: { enabled: true, subject: 'Follow-up from our call' },
          voicemail: { enabled: true }
        }
      }
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleTemplateSelect = (template: TestTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateDialog(true)
  }

  const handleCloneTest = (testId: string) => {
    onCloneTest(testId)
  }

  const generateAutoName = (objective: string, category: string, difficulty: string) => {
    const objectiveMap: { [key: string]: string } = {
      'conversion': 'Conversion Optimization',
      'engagement': 'Engagement Boost',
      'retention': 'Retention Focus',
      'acquisition': 'Acquisition Growth',
      'performance': 'Performance Enhancement',
      'quality': 'Quality Improvement',
      'efficiency': 'Efficiency Boost',
      'revenue': 'Revenue Growth'
    }
    
    const categoryMap: { [key: string]: string } = {
      'mobile': 'Mobile',
      'fixed': 'Fixed Line',
      'whatsapp': 'WhatsApp',
      'email': 'Email',
      'sms': 'SMS',
      'multi': 'Multi-Channel',
      'custom': 'Custom'
    }
    
    const difficultyMap: { [key: string]: string } = {
      'beginner': 'Basic',
      'intermediate': 'Advanced',
      'advanced': 'Expert'
    }
    
    const objectiveText = objectiveMap[objective] || objective
    const categoryText = categoryMap[category] || category
    const difficultyText = difficultyMap[difficulty] || difficulty
    
    return `${objectiveText} - ${categoryText} ${difficultyText} Test`
  }

  const handleObjectiveChange = (objective: string) => {
    setCustomTemplate(prev => ({
      ...prev,
      objective,
      name: generateAutoName(objective, prev.category, prev.difficulty)
    }))
  }

  const handleCategoryChange = (category: string) => {
    setCustomTemplate(prev => ({
      ...prev,
      category,
      name: generateAutoName(prev.objective, category, prev.difficulty)
    }))
  }

  const handleDifficultyChange = (difficulty: string) => {
    setCustomTemplate(prev => ({
      ...prev,
      difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
      name: generateAutoName(prev.objective, prev.category, difficulty)
    }))
  }

  const handleEditTemplate = (template: TestTemplate) => {
    setEditingTemplate(template)
    setShowEditDialog(true)
  }

  const handleSaveCustomTemplate = () => {
    const newTemplate: TestTemplate = {
      id: `custom_${Date.now()}`,
      name: customTemplate.name,
      description: customTemplate.description,
      category: customTemplate.category,
      difficulty: customTemplate.difficulty,
      estimatedDuration: customTemplate.estimatedDuration,
      successRate: customTemplate.successRate,
      icon: <Zap className="h-5 w-5" />,
      config: customTemplate.config,
      tags: customTemplate.tags,
      lastUsed: new Date().toISOString()
    }
    
    onSelectTemplate(newTemplate)
    setShowEditDialog(false)
    setCustomTemplate({
      name: '',
      description: '',
      objective: '',
      category: 'custom',
      difficulty: 'beginner',
      estimatedDuration: '1-2 days',
      successRate: 75,
      tags: [],
      config: {}
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Test Templates</h2>
          <p className="text-muted-foreground">Choose from proven templates or create custom tests</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowEditDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Template
          </Button>
          <Button variant="outline" onClick={() => setShowIterationsDialog(true)}>
            <History className="h-4 w-4 mr-2" />
            View Iterations
          </Button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleTemplateSelect(template)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {template.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm">{template.category}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditTemplate(template)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Badge className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{template.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{template.estimatedDuration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className={getSuccessRateColor(template.successRate)}>
                    {template.successRate}% success
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <Button className="w-full" onClick={() => handleTemplateSelect(template)}>
                <Zap className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Details Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedTemplate?.icon}
              <span>{selectedTemplate?.name}</span>
            </DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                  <TabsTrigger value="results">Expected Results</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Difficulty</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className={getDifficultyColor(selectedTemplate.difficulty)}>
                          {selectedTemplate.difficulty}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Duration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{selectedTemplate.estimatedDuration}</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Success Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className={getSuccessRateColor(selectedTemplate.successRate)}>
                            {selectedTemplate.successRate}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Category</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline">{selectedTemplate.category}</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="config" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Groups Configuration</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded">
                          <div className="font-medium">Group A</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedTemplate.config.groups.A.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            CLI: {selectedTemplate.config.groups.A.cli}
                          </div>
                        </div>
                        <div className="p-3 border rounded">
                          <div className="font-medium">Group B</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedTemplate.config.groups.B.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            CLI: {selectedTemplate.config.groups.B.cli}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedTemplate.config.nudges && (
                      <div>
                        <h4 className="font-medium mb-2">Nudges Configuration</h4>
                        <div className="space-y-2">
                          {selectedTemplate.config.nudges.whatsapp?.enabled && (
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm">WhatsApp Nudges Enabled</span>
                            </div>
                          )}
                          {selectedTemplate.config.nudges.email?.enabled && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm">Email Nudges Enabled</span>
                            </div>
                          )}
                          {selectedTemplate.config.nudges.voicemail?.enabled && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span className="text-sm">Voicemail Nudges Enabled</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="results" className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Expected Outcomes</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Answer rate improvement: 15-25%</li>
                        <li>• Better lead qualification</li>
                        <li>• Reduced spam complaints</li>
                        <li>• Higher conversion rates</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Success Metrics</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Statistical significance: 95% confidence</li>
                        <li>• Minimum sample size: 100 leads per group</li>
                        <li>• Test duration: {selectedTemplate.estimatedDuration}</li>
                        <li>• Expected success rate: {selectedTemplate.successRate}%</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  onSelectTemplate(selectedTemplate)
                  setShowTemplateDialog(false)
                }}>
                  <Zap className="h-4 w-4 mr-2" />
                  Create Test
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Iterations Dialog */}
      <Dialog open={showIterationsDialog} onOpenChange={setShowIterationsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Test Iterations & History</DialogTitle>
            <DialogDescription>
              View and manage test iterations and their performance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {existingTests.map((test, index) => (
              <Card key={test.test_id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{test.test_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Iteration {index + 1} • {test.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloneTest(test.test_id)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Clone
                      </Button>
                      <Button variant="outline" size="sm">
                        <History className="h-4 w-4 mr-1" />
                        History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Create Custom Template</span>
            </DialogTitle>
            <DialogDescription>
              Create a custom test template with automatic naming based on your objectives
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objective">Test Objective *</Label>
                <Select onValueChange={handleObjectiveChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select objective" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversion">Conversion Optimization</SelectItem>
                    <SelectItem value="engagement">Engagement Boost</SelectItem>
                    <SelectItem value="retention">Retention Focus</SelectItem>
                    <SelectItem value="acquisition">Acquisition Growth</SelectItem>
                    <SelectItem value="performance">Performance Enhancement</SelectItem>
                    <SelectItem value="quality">Quality Improvement</SelectItem>
                    <SelectItem value="efficiency">Efficiency Boost</SelectItem>
                    <SelectItem value="revenue">Revenue Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Test Category *</Label>
                <Select onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="fixed">Fixed Line</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="multi">Multi-Channel</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={customTemplate.name}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Auto-generated name based on your selections"
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Name is automatically generated based on your objective, category, and difficulty
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={customTemplate.description}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this test template does..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select onValueChange={handleDifficultyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration</Label>
                <Input
                  id="duration"
                  value={customTemplate.estimatedDuration}
                  onChange={(e) => setCustomTemplate(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                  placeholder="e.g., 1-2 days"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="successRate">Expected Success Rate (%)</Label>
              <Input
                id="successRate"
                type="number"
                value={customTemplate.successRate}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, successRate: parseInt(e.target.value) || 0 }))}
                placeholder="75"
                min="0"
                max="100"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveCustomTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
