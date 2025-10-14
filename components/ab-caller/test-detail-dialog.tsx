"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, Square, Settings, Users, Phone, MessageSquare, Mail, Shield } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Test {
  test_id: string
  test_name: string
  status: string
  runtime_status?: string
  config: any
  created_at: string
  started_at?: string
  paused_at?: string
  stopped_at?: string
  current_metrics?: any
}

interface TestDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  test: Test
  onAction: (testId: string, action: string, reason?: string) => void
  loading: boolean
}

export function TestDetailDialog({ open, onOpenChange, test, onAction, loading }: TestDetailDialogProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Draft" },
      scheduled: { variant: "outline" as const, label: "Scheduled" },
      running: { variant: "default" as const, label: "Running" },
      paused: { variant: "secondary" as const, label: "Paused" },
      stopped: { variant: "destructive" as const, label: "Stopped" },
      completed: { variant: "default" as const, label: "Completed" },
      failed: { variant: "destructive" as const, label: "Failed" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getActionButtons = () => {
    const status = test.runtime_status || test.status
    
    switch (status) {
      case 'draft':
        return (
          <Button 
            onClick={() => onAction(test.test_id, 'start')}
            disabled={loading}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Test
          </Button>
        )
      case 'running':
        return (
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => onAction(test.test_id, 'pause')}
              disabled={loading}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
            <Button 
              variant="destructive"
              onClick={() => onAction(test.test_id, 'stop')}
              disabled={loading}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>
        )
      case 'paused':
        return (
          <div className="flex space-x-2">
            <Button 
              onClick={() => onAction(test.test_id, 'resume')}
              disabled={loading}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
            <Button 
              variant="destructive"
              onClick={() => onAction(test.test_id, 'stop')}
              disabled={loading}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{test.test_name}</span>
            <div className="flex items-center space-x-2">
              {getStatusBadge(test.runtime_status || test.status)}
              {getActionButtons()}
            </div>
          </DialogTitle>
          <DialogDescription>
            Test ID: {test.test_id} • Created {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="nudges">Nudges</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span>{getStatusBadge(test.runtime_status || test.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(test.created_at).toLocaleString()}</span>
                  </div>
                  {test.started_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span>{new Date(test.started_at).toLocaleString()}</span>
                    </div>
                  )}
                  {test.paused_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paused:</span>
                      <span>{new Date(test.paused_at).toLocaleString()}</span>
                    </div>
                  )}
                  {test.stopped_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stopped:</span>
                      <span>{new Date(test.stopped_at).toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Leads:</span>
                    <span>{test.config.leads?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Attempts:</span>
                    <span>{test.config.attempts_policy?.max_attempts || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assignment:</span>
                    <span className="capitalize">{test.config.assignment?.mode || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timezone:</span>
                    <span>{test.config.timezone || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {test.current_metrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{test.current_metrics.total_calls || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Calls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{test.current_metrics.answered_calls || 0}</div>
                      <div className="text-sm text-muted-foreground">Answered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{(test.current_metrics.answer_rate || 0).toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Answer Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{test.current_metrics.spam_flags || 0}</div>
                      <div className="text-sm text-muted-foreground">Spam Flags</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Groups</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium">Group A - {test.config.groups?.A?.label}</h4>
                    <p className="text-sm text-muted-foreground">CLI: {test.config.groups?.A?.cli}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Group B - {test.config.groups?.B?.label}</h4>
                    <p className="text-sm text-muted-foreground">CLI: {test.config.groups?.B?.cli}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>Call Policy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Attempts:</span>
                    <span>{test.config.attempts_policy?.max_attempts || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ring Times:</span>
                    <span>{test.config.attempts_policy?.ring_times_sec?.join(', ') || 'N/A'}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max per Hour:</span>
                    <span>{test.config.attempts_policy?.max_attempts_per_hour_per_lead || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assignment:</span>
                    <span className="capitalize">{test.config.assignment?.mode || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Work Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timezone:</span>
                  <span>{test.config.timezone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Work Hours:</span>
                  <span>{test.config.workday?.start || 'N/A'} - {test.config.workday?.end || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waves Enabled:</span>
                  <span>{test.config.waves?.enabled ? 'Yes' : 'No'}</span>
                </div>
                {test.config.waves?.enabled && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wave Size:</span>
                      <span>{test.config.waves?.wave_size || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per Group Leads:</span>
                      <span>{test.config.waves?.per_group_leads || 'N/A'}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead List ({test.config.leads?.length || 0} leads)</CardTitle>
                <CardDescription>
                  All leads participating in this test
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {test.config.leads?.map((lead: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex space-x-4">
                        <span className="font-medium">{lead.lead_id}</span>
                        <span className="text-muted-foreground">{lead.phone}</span>
                        {lead.sector && <span className="text-sm">{lead.sector}</span>}
                        {lead.province && <span className="text-sm">{lead.province}</span>}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-muted-foreground">
                      No leads configured
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nudges" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>WhatsApp</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enabled:</span>
                      <Badge variant={test.config.nudges?.whatsapp?.enabled ? "default" : "secondary"}>
                        {test.config.nudges?.whatsapp?.enabled ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {test.config.nudges?.whatsapp?.enabled && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">When:</span>
                          <span className="text-sm">{test.config.nudges.whatsapp.when}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Template:</span>
                          <span className="text-sm">{test.config.nudges.whatsapp.template_name || 'Custom'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>Voicemail</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enabled:</span>
                      <Badge variant={test.config.nudges?.voicemail?.enabled ? "default" : "secondary"}>
                        {test.config.nudges?.voicemail?.enabled ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {test.config.nudges?.voicemail?.enabled && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">On Attempt:</span>
                        <span className="text-sm">{test.config.nudges.voicemail.only_on_attempt_N}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Email</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enabled:</span>
                      <Badge variant={test.config.nudges?.email?.enabled ? "default" : "secondary"}>
                        {test.config.nudges?.email?.enabled ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {test.config.nudges?.email?.enabled && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subject:</span>
                          <span className="text-sm">{test.config.nudges.email.subject || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">From:</span>
                          <span className="text-sm">{test.config.nudges.email.from || 'N/A'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Spam Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Stop Rules</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">First Flag:</span>
                        <span>{test.config.spam_controls?.stop_rules?.on_first_flag?.action || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Second Flag:</span>
                        <span>{test.config.spam_controls?.stop_rules?.on_second_flag?.action || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Answer Rate Drop:</span>
                        <span>{test.config.spam_controls?.stop_rules?.on_answer_rate_drop_pct || 'N/A'}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Spam Checker</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Enabled:</span>
                        <Badge variant={test.config.spam_checker?.enabled ? "default" : "secondary"}>
                          {test.config.spam_checker?.enabled ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Policy:</span>
                        <span>{test.config.spam_checker?.policy || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Block Threshold:</span>
                        <span>{test.config.spam_checker?.thresholds?.block_above || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Calls per CLI per Hour:</span>
                  <span>{test.config.compliance?.max_calls_per_cli_per_hour || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Respect Robinson List:</span>
                  <Badge variant={test.config.compliance?.respect_robinson ? "default" : "secondary"}>
                    {test.config.compliance?.respect_robinson ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
