"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { NumberSelector } from "./number-selector"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Phone, MessageSquare, Mail, Sparkles, Settings, Users, Clock, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateTest: (config: any) => void
  onCreateSampleTest: () => void
  loading: boolean
}

export function CreateTestDialog({ open, onOpenChange, onCreateTest, onCreateSampleTest, loading }: CreateTestDialogProps) {
  const { toast } = useToast()
  const [config, setConfig] = useState({
    test_name: "",
    timezone: "Europe/Madrid",
    workday: {
      start: "09:00",
      end: "17:00"
    },
    groups: {
      A: { label: "Group A", cli: "" },
      B: { label: "Group B", cli: "" }
    },
    leads: [] as Array<{ lead_id: string; phone: string; sector?: string; province?: string }>,
    assignment: {
      mode: "random_1_to_1" as "random_1_to_1" | "stratified",
      block_size: 4
    },
    attempts_policy: {
      max_attempts: 3,
      ring_times_sec: [30, 30, 30],
      min_gap_after_attempts: {
        after_1: 30,
        after_2: 60
      },
      max_attempts_per_hour_per_lead: 2
    },
    waves: {
      enabled: false,
      per_group_leads: 10,
      wave_size: 5,
      schedule: [] as Array<{ time: string; size: number }>
    },
    nudges: {
      whatsapp: {
        enabled: false,
        when: "after_attempt_2_fail",
        text_template: "",
        template_name: "",
        template_language: "en",
        buttons: [] as Array<{ text: string; reply: { id: string; title: string } }>
      },
      voicemail: {
        enabled: false,
        only_on_attempt_N: null as number | null
      },
      email: {
        enabled: false,
        from: "",
        subject: "",
        html: "",
        template_id: ""
      },
      sms: {
        enabled: false,
        trigger: "after_attempt_2_fail",
        delay: 30,
        template: "Hi {{name}}, we tried calling you but couldn't connect. Best time to reach you? Reply STOP to opt out.",
        timeRestrictions: {
          start: "09:00",
          end: "20:00"
        },
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7]
      }
    },
    spam_controls: {
      enabled: true,
      rate_downshift_factor: 0.5,
      stop_rules: {
        max_spam_rate: 15,
        min_answer_rate: 5,
        max_hangup_rate: 80
      }
    },
    spam_checker: {
      enabled: true,
      policy: "mixed",
      signal_source: "internal_api",
      scoring_field: "reputation_score",
      labels_field: "labels",
      thresholds: {
        block_above: 80,
        slow_above: 60,
        warn_above: 40
      },
      windowing: {
        horizon: "1h",
        granularity: "10m"
      },
      actions: {
        block: "skip_call",
        slow: "downshift_rate",
        warn: "log_only"
      },
      telemetry_fields: ["reputation_score", "spam_detected_by", "hiya_score"]
    },
    compliance: {
      max_calls_per_cli_per_hour: 30,
      respect_robinson_list: true,
      timezone_aware: true
    }
  })

  const [newLead, setNewLead] = useState({ lead_id: "", phone: "", sector: "", province: "" })
  const [activeTab, setActiveTab] = useState("basic")
  
  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [pastedData, setPastedData] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [bulkLeads, setBulkLeads] = useState<Array<{ lead_id: string; phone: string; sector?: string; province?: string }>>([])
  
  // Number selection state
  const [numberConfig, setNumberConfig] = useState({
    groupA: [] as any[],
    groupB: [] as any[],
    rotationStrategy: 'single' as 'single' | 'multiple' | 'same',
    rotationRules: {
      enabled: false,
      interval: 60,
      pattern: 'sequential' as 'sequential' | 'random' | 'weighted',
      weightByScore: false
    }
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setConfig({
        test_name: "",
        timezone: "Europe/Madrid",
        workday: { start: "09:00", end: "17:00" },
        groups: { A: { label: "Group A", cli: "" }, B: { label: "Group B", cli: "" } },
        leads: [],
        assignment: { mode: "random_1_to_1", block_size: 4 },
        attempts_policy: {
          max_attempts: 3,
          ring_times_sec: [30, 30, 30],
          min_gap_after_attempts: { after_1: 30, after_2: 60 },
          max_attempts_per_hour_per_lead: 2
        },
        waves: { enabled: false, per_group_leads: 10, wave_size: 5, schedule: [] },
        nudges: {
          whatsapp: { enabled: false, when: "after_attempt_2_fail", text_template: "", template_name: "", template_language: "en", buttons: [] },
          voicemail: { enabled: false, only_on_attempt_N: null },
          email: { enabled: false, from: "", subject: "", html: "", template_id: "" },
          sms: { enabled: false, trigger: "after_attempt_2_fail", delay: 30, template: "Hi {{name}}, we tried calling you but couldn't connect. Best time to reach you? Reply STOP to opt out.", timeRestrictions: { start: "09:00", end: "20:00" }, daysOfWeek: [1, 2, 3, 4, 5, 6, 7] }
        },
        spam_controls: { enabled: true, rate_downshift_factor: 0.5, stop_rules: { max_spam_rate: 15, min_answer_rate: 5, max_hangup_rate: 80 } },
        spam_checker: {
          enabled: true, policy: "mixed", signal_source: "internal_api", scoring_field: "reputation_score", labels_field: "labels",
          thresholds: { block_above: 80, slow_above: 60, warn_above: 40 },
          windowing: { horizon: "1h", granularity: "10m" },
          actions: { block: "skip_call", slow: "downshift_rate", warn: "log_only" },
          telemetry_fields: ["reputation_score", "spam_detected_by", "hiya_score"]
        },
        compliance: { max_calls_per_cli_per_hour: 30, respect_robinson_list: true, timezone_aware: true }
      })
      setNewLead({ lead_id: "", phone: "", sector: "", province: "" })
      setActiveTab("basic")
    }
  }, [open])

  const addLead = () => {
    if (newLead.lead_id && newLead.phone) {
      setConfig(prev => ({
        ...prev,
        leads: [...prev.leads, { ...newLead }]
      }))
      setNewLead({ lead_id: "", phone: "", sector: "", province: "" })
    }
  }

  const removeLead = (index: number) => {
    setConfig(prev => ({
      ...prev,
      leads: prev.leads.filter((_, i) => i !== index)
    }))
  }

  // Bulk upload functions
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Please upload a CSV file",
        variant: "destructive"
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCsvData(text)
    }
    reader.readAsText(file)
  }

  const parseCsvData = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const leads: Array<{ lead_id: string; phone: string; sector?: string; province?: string }> = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length >= 2) {
        leads.push({
          lead_id: values[0] || `lead_${i}`,
          phone: values[1],
          sector: values[2] || '',
          province: values[3] || ''
        })
      }
    }

    setBulkLeads(leads)
    toast({
      title: "CSV Parsed",
      description: `${leads.length} leads parsed from CSV`
    })
  }

  const parsePastedData = () => {
    const lines = pastedData.split('\n').filter(line => line.trim())
    const leads: Array<{ lead_id: string; phone: string; sector?: string; province?: string }> = []

    lines.forEach((line, index) => {
      const values = line.split('\t').length > 1 ? line.split('\t') : line.split(',')
      if (values.length >= 2) {
        leads.push({
          lead_id: values[0] || `lead_${index + 1}`,
          phone: values[1],
          sector: values[2] || '',
          province: values[3] || ''
        })
      }
    })

    setBulkLeads(leads)
    toast({
      title: "Data Parsed",
      description: `${leads.length} leads parsed from pasted data`
    })
  }

  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin
    const webhookId = `webhook_${Date.now()}`
    const webhookUrl = `${baseUrl}/api/webhooks/leads/${webhookId}`
    setWebhookUrl(webhookUrl)
    
    toast({
      title: "Webhook Generated",
      description: "Copy the URL and configure your system to send leads to this endpoint"
    })
  }

  const addBulkLeads = () => {
    if (bulkLeads.length === 0) return

    setConfig(prev => ({
      ...prev,
      leads: [...prev.leads, ...bulkLeads]
    }))
    
    setBulkLeads([])
    setPastedData('')
    
    toast({
      title: "Leads Added",
      description: `${bulkLeads.length} leads added to test`
    })
  }

  const addRingTime = () => {
    setConfig(prev => ({
      ...prev,
      attempts_policy: {
        ...prev.attempts_policy,
        ring_times_sec: [...prev.attempts_policy.ring_times_sec, 30]
      }
    }))
  }

  const removeRingTime = (index: number) => {
    setConfig(prev => ({
      ...prev,
      attempts_policy: {
        ...prev.attempts_policy,
        ring_times_sec: prev.attempts_policy.ring_times_sec.filter((_, i) => i !== index)
      }
    }))
  }

  const addWhatsAppButton = () => {
    setConfig(prev => ({
      ...prev,
      nudges: {
        ...prev.nudges,
        whatsapp: {
          ...prev.nudges.whatsapp,
          buttons: [...prev.nudges.whatsapp.buttons, { text: "", reply: { id: "", title: "" } }]
        }
      }
    }))
  }

  const removeWhatsAppButton = (index: number) => {
    setConfig(prev => ({
      ...prev,
      nudges: {
        ...prev.nudges,
        whatsapp: {
          ...prev.nudges.whatsapp,
          buttons: prev.nudges.whatsapp.buttons.filter((_, i) => i !== index)
        }
      }
    }))
  }

  const handleCreateTest = async () => {
    if (!config.test_name.trim()) {
      toast({
        title: "Error",
        description: "Test name is required",
        variant: "destructive"
      })
      return
    }

    if (numberConfig.groupA.length === 0 || numberConfig.groupB.length === 0) {
      toast({
        title: "Error", 
        description: "Please select at least one number for each group",
        variant: "destructive"
      })
      return
    }

    if (config.leads.length === 0) {
      toast({
        title: "Error",
        description: "At least one lead is required",
        variant: "destructive"
      })
      return
    }

    try {
      await onCreateTest({ ...config, number_config: numberConfig })
      toast({
        title: "Success",
        description: "A/B test created successfully!"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCreateSampleTest = async () => {
    try {
      await onCreateSampleTest()
      toast({
        title: "Success",
        description: "Sample A/B test created with realistic data!"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sample test. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Create A/B Test</span>
          </DialogTitle>
          <DialogDescription>
            Configure your A/B calling test with advanced settings and spam protection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="flex space-x-3">
            <Button 
              onClick={handleCreateSampleTest}
              disabled={loading}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Sparkles className="h-4 w-4" />
              <span>Create Test with Sample Data</span>
            </Button>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{config.leads.length} leads</span>
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-12">
              <TabsTrigger value="basic" className="text-sm font-medium">Basic</TabsTrigger>
              <TabsTrigger value="groups" className="text-sm font-medium">Groups & Numbers</TabsTrigger>
              <TabsTrigger value="leads" className="text-sm font-medium">Leads</TabsTrigger>
              <TabsTrigger value="advanced" className="text-sm font-medium">Advanced</TabsTrigger>
              <TabsTrigger value="compliance" className="text-sm font-medium">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Configuration</CardTitle>
                  <CardDescription>Essential test settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="test_name" className="text-sm font-medium">Test Name *</Label>
                      <Input
                        id="test_name"
                        value={config.test_name}
                        onChange={(e) => setConfig(prev => ({ ...prev, test_name: e.target.value }))}
                        placeholder="e.g., Mobile vs Fixed Line Test"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
                      <Select value={config.timezone} onValueChange={(value) => setConfig(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="workday_start" className="text-sm font-medium">Workday Start</Label>
                      <Input
                        id="workday_start"
                        type="time"
                        value={config.workday.start}
                        onChange={(e) => setConfig(prev => ({ ...prev, workday: { ...prev.workday, start: e.target.value } }))}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workday_end" className="text-sm font-medium">Workday End</Label>
                      <Input
                        id="workday_end"
                        type="time"
                        value={config.workday.end}
                        onChange={(e) => setConfig(prev => ({ ...prev, workday: { ...prev.workday, end: e.target.value } }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Groups & Numbers</CardTitle>
                  <CardDescription>Configure your A and B groups with phone number selection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Group Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold">Group Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Group A</Label>
                        <div className="space-y-2">
                          <Input
                            placeholder="Group A Label"
                            value={config.groups.A.label}
                            onChange={(e) => setConfig(prev => ({ ...prev, groups: { ...prev.groups, A: { ...prev.groups.A, label: e.target.value } } }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Group B</Label>
                        <div className="space-y-2">
                          <Input
                            placeholder="Group B Label"
                            value={config.groups.B.label}
                            onChange={(e) => setConfig(prev => ({ ...prev, groups: { ...prev.groups, B: { ...prev.groups.B, label: e.target.value } } }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Number Selection */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold">Phone Number Selection</h3>
                    <NumberSelector
                      onNumbersSelected={(config) => setNumberConfig(config)}
                      initialConfig={numberConfig}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Leads</CardTitle>
                  <CardDescription>Add leads to your test</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Individual Lead Input */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Lead ID"
                        value={newLead.lead_id}
                        onChange={(e) => setNewLead(prev => ({ ...prev, lead_id: e.target.value }))}
                      />
                      <Input
                        placeholder="Phone Number"
                        value={newLead.phone}
                        onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                      />
                      <Input
                        placeholder="Sector (optional)"
                        value={newLead.sector}
                        onChange={(e) => setNewLead(prev => ({ ...prev, sector: e.target.value }))}
                      />
                      <Input
                        placeholder="Province (optional)"
                        value={newLead.province}
                        onChange={(e) => setNewLead(prev => ({ ...prev, province: e.target.value }))}
                      />
                    </div>
                    <Button onClick={addLead} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lead
                    </Button>
                  </div>

                  {/* Bulk Upload Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">Bulk Upload</h3>
                        <p className="text-sm text-muted-foreground">Upload multiple leads at once</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowBulkUpload(!showBulkUpload)}>
                          <Users className="h-4 w-4 mr-2" />
                          {showBulkUpload ? 'Hide' : 'Show'} Bulk Upload
                        </Button>
                      </div>
                    </div>

                    {showBulkUpload && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="grid grid-cols-3 gap-4">
                          {/* CSV Upload */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">CSV Upload</Label>
                            <Input
                              type="file"
                              accept=".csv"
                              onChange={handleCsvUpload}
                              className="text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              Upload CSV with columns: lead_id, phone, sector, province
                            </p>
                          </div>

                          {/* Copy & Paste */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Copy & Paste</Label>
                            <Textarea
                              placeholder="Paste tab-separated data:&#10;lead1	+34600000001	sector1	province1&#10;lead2	+34600000002	sector2	province2"
                              value={pastedData}
                              onChange={(e) => setPastedData(e.target.value)}
                              rows={3}
                              className="text-sm"
                            />
                            <Button size="sm" onClick={parsePastedData} disabled={!pastedData.trim()}>
                              <Plus className="h-3 w-3 mr-1" />
                              Parse Data
                            </Button>
                          </div>

                          {/* Webhook */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Webhook API</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Generate webhook URL"
                                value={webhookUrl}
                                readOnly
                                className="text-sm"
                              />
                              <Button size="sm" onClick={generateWebhookUrl}>
                                <Phone className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Send POST requests with lead data
                            </p>
                          </div>
                        </div>

                        {bulkLeads.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">
                                Bulk Leads ({bulkLeads.length})
                              </Label>
                              <Button size="sm" onClick={addBulkLeads}>
                                <Plus className="h-3 w-3 mr-1" />
                                Add All
                              </Button>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {bulkLeads.slice(0, 5).map((lead, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs p-2 bg-background rounded border">
                                  <span className="font-mono">{lead.lead_id}</span>
                                  <span className="text-muted-foreground">{lead.phone}</span>
                                  {lead.sector && <Badge variant="outline" className="text-xs">{lead.sector}</Badge>}
                                </div>
                              ))}
                              {bulkLeads.length > 5 && (
                                <p className="text-xs text-muted-foreground text-center">
                                  ... and {bulkLeads.length - 5} more leads
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {config.leads.length > 0 && (
                    <div className="space-y-2">
                      <Label>Added Leads ({config.leads.length})</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {config.leads.map((lead, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <span className="font-medium">{lead.lead_id}</span>
                              <span className="text-muted-foreground ml-2">{lead.phone}</span>
                              {lead.sector && <Badge variant="outline" className="ml-2">{lead.sector}</Badge>}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLead(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Advanced Settings</CardTitle>
                  <CardDescription>Configure advanced test parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Attempts</Label>
                      <Input
                        type="number"
                        value={config.attempts_policy.max_attempts}
                        onChange={(e) => setConfig(prev => ({ ...prev, attempts_policy: { ...prev.attempts_policy, max_attempts: parseInt(e.target.value) || 3 } }))}
                      />
                    </div>
                    <div>
                      <Label>Max Attempts per Hour per Lead</Label>
                      <Input
                        type="number"
                        value={config.attempts_policy.max_attempts_per_hour_per_lead}
                        onChange={(e) => setConfig(prev => ({ ...prev, attempts_policy: { ...prev.attempts_policy, max_attempts_per_hour_per_lead: parseInt(e.target.value) || 2 } }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Ring Times (seconds)</Label>
                    <div className="flex flex-wrap gap-2">
                      {config.attempts_policy.ring_times_sec.map((time, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={time}
                            onChange={(e) => {
                              const newTimes = [...config.attempts_policy.ring_times_sec]
                              newTimes[index] = parseInt(e.target.value) || 30
                              setConfig(prev => ({ ...prev, attempts_policy: { ...prev.attempts_policy, ring_times_sec: newTimes } }))
                            }}
                            className="w-20"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRingTime(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addRingTime}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Gap After 1st Attempt (minutes)</Label>
                      <Input
                        type="number"
                        value={config.attempts_policy.min_gap_after_attempts.after_1}
                        onChange={(e) => setConfig(prev => ({ ...prev, attempts_policy: { ...prev.attempts_policy, min_gap_after_attempts: { ...prev.attempts_policy.min_gap_after_attempts, after_1: parseInt(e.target.value) || 30 } } }))}
                      />
                    </div>
                    <div>
                      <Label>Min Gap After 2nd Attempt (minutes)</Label>
                      <Input
                        type="number"
                        value={config.attempts_policy.min_gap_after_attempts.after_2}
                        onChange={(e) => setConfig(prev => ({ ...prev, attempts_policy: { ...prev.attempts_policy, min_gap_after_attempts: { ...prev.attempts_policy.min_gap_after_attempts, after_2: parseInt(e.target.value) || 60 } } }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nudges</CardTitle>
                  <CardDescription>Configure follow-up messages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <Label>WhatsApp Nudges</Label>
                      </div>
                      <Switch
                        checked={config.nudges.whatsapp.enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, whatsapp: { ...prev.nudges.whatsapp, enabled: checked } } }))}
                      />
                    </div>
                    
                    {config.nudges.whatsapp.enabled && (
                      <div className="space-y-2 pl-6">
                        <div>
                          <Label>When to send</Label>
                          <Select value={config.nudges.whatsapp.when} onValueChange={(value) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, whatsapp: { ...prev.nudges.whatsapp, when: value } } }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="after_attempt_1_fail">After 1st attempt fails</SelectItem>
                              <SelectItem value="after_attempt_2_fail">After 2nd attempt fails</SelectItem>
                              <SelectItem value="after_voicemail">After voicemail</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Message Template</Label>
                          <Textarea
                            value={config.nudges.whatsapp.text_template}
                            onChange={(e) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, whatsapp: { ...prev.nudges.whatsapp, text_template: e.target.value } } }))}
                            placeholder="Hi {{lead_id}}, we tried to reach you..."
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <Label>Email Nudges</Label>
                      </div>
                      <Switch
                        checked={config.nudges.email.enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, email: { ...prev.nudges.email, enabled: checked } } }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <Label>Voicemail Nudges</Label>
                      </div>
                      <Switch
                        checked={config.nudges.voicemail.enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, voicemail: { ...prev.nudges.voicemail, enabled: checked } } }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <Label>SMS Nudges</Label>
                      </div>
                      <Switch
                        checked={config.nudges.sms.enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, sms: { ...prev.nudges.sms, enabled: checked } } }))}
                      />
                    </div>

                    {config.nudges.sms.enabled && (
                      <div className="space-y-2 pl-6">
                        <div>
                          <Label>When to send</Label>
                          <Select
                            value={config.nudges.sms.trigger}
                            onValueChange={(value) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, sms: { ...prev.nudges.sms, trigger: value } } }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="after_attempt_1_fail">After 1st attempt fails</SelectItem>
                              <SelectItem value="after_attempt_2_fail">After 2nd attempt fails</SelectItem>
                              <SelectItem value="after_attempt_3_fail">After 3rd attempt fails</SelectItem>
                              <SelectItem value="after_voicemail">After voicemail</SelectItem>
                              <SelectItem value="custom">Custom trigger</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Delay (minutes)</Label>
                          <Input
                            type="number"
                            value={config.nudges.sms.delay}
                            onChange={(e) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, sms: { ...prev.nudges.sms, delay: parseInt(e.target.value) || 0 } } }))}
                            placeholder="30"
                          />
                        </div>

                        <div>
                          <Label>Message Template</Label>
                          <Textarea
                            value={config.nudges.sms.template}
                            onChange={(e) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, sms: { ...prev.nudges.sms, template: e.target.value } } }))}
                            placeholder="Hi {{name}}, we tried calling you but couldn't connect. Best time to reach you? Reply STOP to opt out."
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Use variables: {{name}}, {{company}}, {{phone}}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Time restrictions</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="time"
                                  value={config.nudges.sms.timeRestrictions.start}
                                  onChange={(e) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, sms: { ...prev.nudges.sms, timeRestrictions: { ...prev.nudges.sms.timeRestrictions, start: e.target.value } } } }))}
                                  className="text-sm"
                                />
                                <span className="text-sm text-muted-foreground">to</span>
                                <Input
                                  type="time"
                                  value={config.nudges.sms.timeRestrictions.end}
                                  onChange={(e) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, sms: { ...prev.nudges.sms, timeRestrictions: { ...prev.nudges.sms.timeRestrictions, end: e.target.value } } } }))}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label>Days of week</Label>
                            <Select
                              value={config.nudges.sms.daysOfWeek.join(',')}
                              onValueChange={(value) => setConfig(prev => ({ ...prev, nudges: { ...prev.nudges, sms: { ...prev.nudges.sms, daysOfWeek: value.split(',').map(Number) } } }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1,2,3,4,5">Weekdays only</SelectItem>
                                <SelectItem value="1,2,3,4,5,6">Monday-Saturday</SelectItem>
                                <SelectItem value="1,2,3,4,5,6,7">All days</SelectItem>
                                <SelectItem value="6,7">Weekends only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compliance & Spam Protection</CardTitle>
                  <CardDescription>Configure compliance and spam protection settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Calls per CLI per Hour</Label>
                      <Input
                        type="number"
                        value={config.compliance.max_calls_per_cli_per_hour}
                        onChange={(e) => setConfig(prev => ({ ...prev, compliance: { ...prev.compliance, max_calls_per_cli_per_hour: parseInt(e.target.value) || 30 } }))}
                      />
                    </div>
                    <div>
                      <Label>Spam Rate Downshift Factor</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={config.spam_controls.rate_downshift_factor}
                        onChange={(e) => setConfig(prev => ({ ...prev, spam_controls: { ...prev.spam_controls, rate_downshift_factor: parseFloat(e.target.value) || 0.5 } }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <Label>Spam Checker</Label>
                      <Switch
                        checked={config.spam_checker.enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, spam_checker: { ...prev.spam_checker, enabled: checked } }))}
                      />
                    </div>

                    {config.spam_checker.enabled && (
                      <div className="grid grid-cols-3 gap-4 pl-6">
                        <div>
                          <Label>Block Above Score</Label>
                          <Input
                            type="number"
                            value={config.spam_checker.thresholds.block_above}
                            onChange={(e) => setConfig(prev => ({ ...prev, spam_checker: { ...prev.spam_checker, thresholds: { ...prev.spam_checker.thresholds, block_above: parseInt(e.target.value) || 80 } } }))}
                          />
                        </div>
                        <div>
                          <Label>Slow Above Score</Label>
                          <Input
                            type="number"
                            value={config.spam_checker.thresholds.slow_above}
                            onChange={(e) => setConfig(prev => ({ ...prev, spam_checker: { ...prev.spam_checker, thresholds: { ...prev.spam_checker.thresholds, slow_above: parseInt(e.target.value) || 60 } } }))}
                          />
                        </div>
                        <div>
                          <Label>Warn Above Score</Label>
                          <Input
                            type="number"
                            value={config.spam_checker.thresholds.warn_above}
                            onChange={(e) => setConfig(prev => ({ ...prev, spam_checker: { ...prev.spam_checker, thresholds: { ...prev.spam_checker.thresholds, warn_above: parseInt(e.target.value) || 40 } } }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6">
              Cancel
            </Button>
            <Button onClick={handleCreateTest} disabled={loading} className="px-6">
              {loading ? "Creating..." : "Create Test"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}