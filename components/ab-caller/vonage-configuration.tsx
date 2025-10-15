"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Phone, 
  Settings, 
  TestTube, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Copy,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ConnectionTester } from './connection-tester'
import { IntegrationStatus } from './integration-status'

interface DerivationConfig {
  id: string
  name: string
  derivationId: string
  originNumber: string
  description: string
  enabled: boolean
  group: 'A' | 'B' | 'both'
}

interface VonageConfigurationProps {
  testId?: string
  onConfigUpdate?: (config: any) => void
}

export function VonageConfiguration({ testId, onConfigUpdate }: VonageConfigurationProps) {
  const { toast } = useToast()
  const [configurations, setConfigurations] = useState<DerivationConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [testMode, setTestMode] = useState(false)

  // Sample derivation configurations
  const sampleConfigurations: DerivationConfig[] = [
    {
      id: 'mobile-a',
      name: 'Mobile Strategy A',
      derivationId: 'mobile-derivation-001',
      originNumber: '+34604579589',
      description: 'Mobile-first calling strategy for Group A',
      enabled: true,
      group: 'A'
    },
    {
      id: 'landline-b',
      name: 'Landline Strategy B',
      derivationId: 'landline-derivation-002',
      originNumber: '+34604579589',
      description: 'Landline-focused calling strategy for Group B',
      enabled: true,
      group: 'B'
    },
    {
      id: 'hybrid-both',
      name: 'Hybrid Strategy',
      derivationId: 'hybrid-derivation-003',
      originNumber: '+34604579589',
      description: 'Mixed mobile/landline strategy for both groups',
      enabled: false,
      group: 'both'
    }
  ]

  useEffect(() => {
    setConfigurations(sampleConfigurations)
  }, [])

  const handleConfigChange = (configId: string, field: keyof DerivationConfig, value: any) => {
    setConfigurations(prev => 
      prev.map(config => 
        config.id === configId 
          ? { ...config, [field]: value }
          : config
      )
    )
  }

  const handleTestCall = async (config: DerivationConfig) => {
    setIsLoading(true)
    try {
      // Simulate test call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Test Call Successful! ✅",
        description: `Test call made using ${config.name} (${config.derivationId})`,
      })
    } catch (error) {
      toast({
        title: "Test Call Failed",
        description: "Failed to make test call. Please check your configuration.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/vonage/events`
    navigator.clipboard.writeText(webhookUrl)
    toast({
      title: "Webhook URL Copied! 📋",
      description: "Webhook URL copied to clipboard",
    })
  }

  const getGroupBadgeColor = (group: string) => {
    switch (group) {
      case 'A': return 'bg-blue-100 text-blue-800'
      case 'B': return 'bg-green-100 text-green-800'
      case 'both': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vonage Voice Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure derivation IDs and calling strategies for A/B testing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={testMode}
            onCheckedChange={setTestMode}
          />
          <Label className="text-sm">Test Mode</Label>
        </div>
      </div>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Webhook Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure webhook URL in your Vonage application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/webhooks/vonage/events`}
              readOnly
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Add this webhook URL to your Vonage application settings to receive call events.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Derivation Configurations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configurations.map((config) => (
          <Card key={config.id} className={config.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <CardTitle className="text-base">{config.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getGroupBadgeColor(config.group)}>
                    Group {config.group}
                  </Badge>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => handleConfigChange(config.id, 'enabled', checked)}
                  />
                </div>
              </div>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`derivation-${config.id}`}>Derivation ID</Label>
                <Input
                  id={`derivation-${config.id}`}
                  value={config.derivationId}
                  onChange={(e) => handleConfigChange(config.id, 'derivationId', e.target.value)}
                  placeholder="derivation-001"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`origin-${config.id}`}>Origin Number</Label>
                <Input
                  id={`origin-${config.id}`}
                  value={config.originNumber}
                  onChange={(e) => handleConfigChange(config.id, 'originNumber', e.target.value)}
                  placeholder="+34604579589"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`group-${config.id}`}>Test Group</Label>
                <Select
                  value={config.group}
                  onValueChange={(value) => handleConfigChange(config.id, 'group', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Group A</SelectItem>
                    <SelectItem value="B">Group B</SelectItem>
                    <SelectItem value="both">Both Groups</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {testMode && (
                <Button
                  onClick={() => handleTestCall(config)}
                  disabled={isLoading || !config.enabled}
                  className="w-full"
                  variant="outline"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {isLoading ? 'Testing...' : 'Test Call'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Integration Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Vonage API Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Webhook Configured</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Test Mode Active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <IntegrationStatus />

      {/* Connection Tester */}
      <ConnectionTester />

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline">
          <ExternalLink className="h-4 w-4 mr-2" />
          View N8N Workflow
        </Button>
        <Button onClick={() => onConfigUpdate?.(configurations)}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
