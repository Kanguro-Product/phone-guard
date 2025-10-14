"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Clock, 
  Target, 
  Zap, 
  Brain,
  TrendingUp,
  Users,
  BarChart3,
  Send,
  Edit,
  Trash2,
  Copy,
  Eye,
  Play,
  Pause,
  Settings
} from "lucide-react"

interface MessageTemplate {
  id: string
  name: string
  channel: 'whatsapp' | 'email' | 'sms'
  content: string
  variables: string[]
  performance: {
    openRate: number
    clickRate: number
    responseRate: number
  }
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  lastUsed?: string
}

interface NudgeConfig {
  id: string
  name: string
  trigger: 'after_attempt_1_fail' | 'after_attempt_2_fail' | 'after_attempt_3_fail' | 'custom'
  delay: number // minutes
  channels: ('whatsapp' | 'email' | 'sms')[]
  templates: string[]
  conditions: {
    timeOfDay?: { start: string; end: string }
    dayOfWeek?: number[]
    leadQuality?: 'high' | 'medium' | 'low'
    sector?: string[]
  }
  status: 'active' | 'paused' | 'draft'
}

interface CommunicationSystemProps {
  onTemplateCreate: (template: MessageTemplate) => void
  onNudgeConfigure: (nudge: NudgeConfig) => void
}

export function CommunicationSystem({ onTemplateCreate, onNudgeConfigure }: CommunicationSystemProps) {
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [nudges, setNudges] = useState<NudgeConfig[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showNudgeDialog, setShowNudgeDialog] = useState(false)

  // Sample templates
  const sampleTemplates: MessageTemplate[] = [
    {
      id: '1',
      name: 'Follow-up Call Request',
      channel: 'whatsapp',
      content: 'Hi {{name}}, we tried to reach you earlier. Would you prefer a callback now or schedule for later?',
      variables: ['name', 'company'],
      performance: { openRate: 85, clickRate: 45, responseRate: 30 },
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
      lastUsed: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      name: 'Email Introduction',
      channel: 'email',
      content: 'Subject: Quick follow-up on our call\n\nHi {{name}},\n\nI hope this email finds you well. I wanted to follow up on our conversation about {{topic}}.\n\nBest regards,\n{{sender_name}}',
      variables: ['name', 'topic', 'sender_name'],
      performance: { openRate: 65, clickRate: 25, responseRate: 15 },
      status: 'active',
      createdAt: '2024-01-10T09:00:00Z'
    },
    {
      id: '3',
      name: 'SMS Reminder',
      channel: 'sms',
      content: 'Hi {{name}}, just a quick reminder about our scheduled call at {{time}}. Looking forward to speaking with you!',
      variables: ['name', 'time'],
      performance: { openRate: 95, clickRate: 60, responseRate: 40 },
      status: 'active',
      createdAt: '2024-01-12T11:00:00Z'
    },
    {
      id: '4',
      name: 'SMS Follow-up',
      channel: 'sms',
      content: 'Hi {{name}}, we tried calling you but couldn\'t connect. Best time to reach you? Reply STOP to opt out.',
      variables: ['name'],
      performance: { openRate: 98, clickRate: 65, responseRate: 45 },
      status: 'active',
      createdAt: '2024-01-12T11:00:00Z'
    },
    {
      id: '5',
      name: 'SMS Appointment Confirmation',
      channel: 'sms',
      content: 'Hi {{name}}, your call with {{company}} is confirmed for {{time}}. Reply CONFIRM or RESCHEDULE.',
      variables: ['name', 'company', 'time'],
      performance: { openRate: 99, clickRate: 80, responseRate: 60 },
      status: 'active',
      createdAt: '2024-01-12T11:00:00Z'
    }
  ]

  const sampleNudges: NudgeConfig[] = [
    {
      id: '1',
      name: 'WhatsApp After 2nd Attempt',
      trigger: 'after_attempt_2_fail',
      delay: 30,
      channels: ['whatsapp'],
      templates: ['1'],
      conditions: {
        timeOfDay: { start: '09:00', end: '18:00' },
        dayOfWeek: [1, 2, 3, 4, 5],
        leadQuality: 'high'
      },
      status: 'active'
    },
    {
      id: '2',
      name: 'Email Sequence',
      trigger: 'after_attempt_3_fail',
      delay: 60,
      channels: ['email'],
      templates: ['2'],
      conditions: {
        timeOfDay: { start: '09:00', end: '17:00' },
        dayOfWeek: [1, 2, 3, 4, 5]
      },
      status: 'active'
    },
    {
      id: '3',
      name: 'SMS After 3rd Attempt',
      trigger: 'after_attempt_3_fail',
      delay: 60,
      channels: ['sms'],
      templates: ['4'],
      conditions: {
        timeOfDay: { start: '09:00', end: '20:00' },
        dayOfWeek: [1, 2, 3, 4, 5, 6],
        leadQuality: 'medium'
      },
      status: 'active'
    },
    {
      id: '4',
      name: 'Multi-Channel Follow-up',
      trigger: 'after_attempt_2_fail',
      delay: 45,
      channels: ['whatsapp', 'sms'],
      templates: ['1', '4'],
      conditions: {
        timeOfDay: { start: '09:00', end: '18:00' },
        dayOfWeek: [1, 2, 3, 4, 5],
        leadQuality: 'high'
      },
      status: 'active'
    },
    {
      id: '5',
      name: 'SMS Appointment Reminder',
      trigger: 'custom',
      delay: 0,
      channels: ['sms'],
      templates: ['5'],
      conditions: {
        timeOfDay: { start: '08:00', end: '22:00' },
        dayOfWeek: [1, 2, 3, 4, 5, 6, 7],
        leadQuality: 'high'
      },
      status: 'active'
    }
  ]

  useEffect(() => {
    setTemplates(sampleTemplates)
    setNudges(sampleNudges)
  }, [])

  const handleCreateTemplate = (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: MessageTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setTemplates(prev => [newTemplate, ...prev])
    onTemplateCreate(newTemplate)
    setShowTemplateDialog(false)
  }

  const handleCreateNudge = (nudge: Omit<NudgeConfig, 'id'>) => {
    const newNudge: NudgeConfig = {
      ...nudge,
      id: Date.now().toString()
    }
    setNudges(prev => [newNudge, ...prev])
    onNudgeConfigure(newNudge)
    setShowNudgeDialog(false)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <Phone className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return 'bg-green-100 text-green-800'
      case 'email': return 'bg-blue-100 text-blue-800'
      case 'sms': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Communication System</h2>
          <p className="text-muted-foreground">Manage message templates and nudge campaigns</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowTemplateDialog(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            New Template
          </Button>
          <Button onClick={() => setShowNudgeDialog(true)}>
            <Zap className="h-4 w-4 mr-2" />
            New Nudge
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter(t => t.status === 'active').length}</div>
            <div className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +2 this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Nudges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nudges.filter(n => n.status === 'active').length}</div>
            <div className="text-xs text-muted-foreground">
              <Zap className="h-3 w-3 inline mr-1" />
              Automated campaigns
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(templates.reduce((sum, t) => sum + t.performance.responseRate, 0) / templates.length)}%
            </div>
            <div className="text-xs text-muted-foreground">
              <Target className="h-3 w-3 inline mr-1" />
              Across all channels
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-xs text-muted-foreground">
              <Send className="h-3 w-3 inline mr-1" />
              This month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="nudges">Nudges</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Templates List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getChannelIcon(template.channel)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(template.status)}>
                      {template.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    <Badge className={getChannelColor(template.channel)}>
                      {template.channel}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {template.content}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Open Rate</span>
                      <span className="font-medium">{template.performance.openRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Response Rate</span>
                      <span className="font-medium">{template.performance.responseRate}%</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nudges" className="space-y-6">
          {/* Nudges List */}
          <div className="space-y-4">
            {nudges.map((nudge) => (
              <Card key={nudge.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Zap className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{nudge.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Trigger: {nudge.trigger.replace('_', ' ')} • Delay: {nudge.delay}min
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(nudge.status)}>
                        {nudge.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Channels</div>
                      <div className="flex space-x-1">
                        {nudge.channels.map(channel => (
                          <Badge key={channel} className={getChannelColor(channel)}>
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Templates</div>
                      <div className="text-sm font-medium">{nudge.templates.length}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Conditions</div>
                      <div className="text-sm font-medium">
                        {nudge.conditions.timeOfDay ? 'Time-based' : 'Always'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="flex items-center space-x-1">
                        {nudge.status === 'active' ? (
                          <Play className="h-3 w-3 text-green-600" />
                        ) : (
                          <Pause className="h-3 w-3 text-red-600" />
                        )}
                        <span className="text-sm capitalize">{nudge.status}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>Response rates by communication channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['whatsapp', 'email', 'sms'].map(channel => {
                    const channelTemplates = templates.filter(t => t.channel === channel)
                    const avgResponseRate = channelTemplates.length > 0 
                      ? Math.round(channelTemplates.reduce((sum, t) => sum + t.performance.responseRate, 0) / channelTemplates.length)
                      : 0
                    
                    return (
                      <div key={channel} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getChannelIcon(channel)}
                          <span className="capitalize">{channel}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${avgResponseRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{avgResponseRate}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Performance</CardTitle>
                <CardDescription>Top performing message templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates
                    .sort((a, b) => b.performance.responseRate - a.performance.responseRate)
                    .slice(0, 3)
                    .map(template => (
                      <div key={template.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">{template.channel}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{template.performance.responseRate}%</div>
                          <div className="text-sm text-muted-foreground">Response Rate</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Settings</CardTitle>
              <CardDescription>Configure global communication preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable WhatsApp Integration</Label>
                    <p className="text-sm text-muted-foreground">Allow sending WhatsApp messages</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Email Integration</Label>
                    <p className="text-sm text-muted-foreground">Allow sending email messages</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable SMS Integration</Label>
                    <p className="text-sm text-muted-foreground">Allow sending SMS messages</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Smart Timing</Label>
                    <p className="text-sm text-muted-foreground">Use AI to determine optimal sending times</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      {showTemplateDialog && (
        <TemplateDialog
          onClose={() => setShowTemplateDialog(false)}
          onSubmit={handleCreateTemplate}
        />
      )}

      {/* Nudge Dialog */}
      {showNudgeDialog && (
        <NudgeDialog
          onClose={() => setShowNudgeDialog(false)}
          onSubmit={handleCreateNudge}
          templates={templates}
        />
      )}
    </div>
  )
}

// Template Dialog Component
function TemplateDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    channel: 'whatsapp' as 'whatsapp' | 'email' | 'sms',
    content: '',
    variables: [] as string[]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      performance: { openRate: 0, clickRate: 0, responseRate: 0 },
      status: 'draft'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create Message Template</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Template Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
              required
            />
          </div>
          
          <div>
            <Label>Channel</Label>
            <Select value={formData.channel} onValueChange={(value) => setFormData(prev => ({ ...prev, channel: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Message Content</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter your message content. Use {{variable}} for dynamic content."
              rows={6}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Template
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Nudge Dialog Component
function NudgeDialog({ onClose, onSubmit, templates }: { onClose: () => void; onSubmit: (nudge: Omit<NudgeConfig, 'id'>) => void; templates: MessageTemplate[] }) {
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'after_attempt_2_fail' as 'after_attempt_1_fail' | 'after_attempt_2_fail' | 'after_attempt_3_fail' | 'custom',
    delay: 30,
    channels: ['whatsapp'] as ('whatsapp' | 'email' | 'sms')[],
    templates: [] as string[],
    conditions: {
      timeOfDay: { start: '09:00', end: '18:00' },
      dayOfWeek: [1, 2, 3, 4, 5],
      leadQuality: 'high' as 'high' | 'medium' | 'low',
      sector: [] as string[]
    },
    status: 'draft' as 'active' | 'paused' | 'draft'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create Nudge Campaign</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Campaign Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter campaign name"
              required
            />
          </div>
          
          <div>
            <Label>Trigger</Label>
            <Select value={formData.trigger} onValueChange={(value) => setFormData(prev => ({ ...prev, trigger: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="after_attempt_1_fail">After 1st failed attempt</SelectItem>
                <SelectItem value="after_attempt_2_fail">After 2nd failed attempt</SelectItem>
                <SelectItem value="after_attempt_3_fail">After 3rd failed attempt</SelectItem>
                <SelectItem value="custom">Custom trigger</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Delay (minutes)</Label>
            <Input
              type="number"
              value={formData.delay}
              onChange={(e) => setFormData(prev => ({ ...prev, delay: parseInt(e.target.value) || 0 }))}
              placeholder="Delay in minutes"
              required
            />
          </div>
          
          <div>
            <Label>Channels</Label>
            <div className="space-y-2">
              {['whatsapp', 'email', 'sms'].map(channel => (
                <label key={channel} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.channels.includes(channel as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, channels: [...prev.channels, channel as any] }))
                      } else {
                        setFormData(prev => ({ ...prev, channels: prev.channels.filter(c => c !== channel) }))
                      }
                    }}
                  />
                  <span className="capitalize">{channel}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Nudge
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
