"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  Copy, 
  Link, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Lead {
  phone: string
  name?: string
  email?: string
  company?: string
  source?: string
  notes?: string
}

interface BulkLeadsUploadProps {
  onLeadsUploaded: (leads: Lead[]) => void
  onWebhookCreated: (webhookUrl: string) => void
}

export function BulkLeadsUpload({ onLeadsUploaded, onWebhookCreated }: BulkLeadsUploadProps) {
  const [activeTab, setActiveTab] = useState('csv')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [pastedData, setPastedData] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [parsedLeads, setParsedLeads] = useState<Lead[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [webhookEndpoint, setWebhookEndpoint] = useState('')
  
  const { toast } = useToast()

  // CSV Upload Handler
  const handleCsvUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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

    setCsvFile(file)
    parseCsvFile(file)
  }, [toast])

  // Parse CSV file
  const parseCsvFile = async (file: File) => {
    setIsProcessing(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        toast({
          title: "Error",
          description: "CSV file must have at least a header and one data row",
          variant: "destructive"
        })
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const leads: Lead[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length !== headers.length) continue

        const lead: Lead = { phone: '' }
        
        headers.forEach((header, index) => {
          const value = values[index]
          switch (header) {
            case 'phone':
            case 'telephone':
            case 'mobile':
              lead.phone = value
              break
            case 'name':
            case 'full_name':
            case 'contact_name':
              lead.name = value
              break
            case 'email':
            case 'email_address':
              lead.email = value
              break
            case 'company':
            case 'company_name':
              lead.company = value
              break
            case 'source':
            case 'lead_source':
              lead.source = value
              break
            case 'notes':
            case 'comments':
              lead.notes = value
              break
          }
        })

        if (lead.phone) {
          leads.push(lead)
        }
      }

      setParsedLeads(leads)
      toast({
        title: "Success",
        description: `Parsed ${leads.length} leads from CSV`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse CSV file",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Parse pasted data
  const parsePastedData = () => {
    setIsProcessing(true)
    try {
      const lines = pastedData.split('\n').filter(line => line.trim())
      const leads: Lead[] = []

      lines.forEach((line, index) => {
        const values = line.split('\t').length > 1 ? line.split('\t') : line.split(',')
        
        if (values.length >= 1) {
          const lead: Lead = {
            phone: values[0].trim(),
            name: values[1]?.trim() || '',
            email: values[2]?.trim() || '',
            company: values[3]?.trim() || '',
            source: values[4]?.trim() || 'Manual Import',
            notes: values[5]?.trim() || ''
          }
          
          if (lead.phone) {
            leads.push(lead)
          }
        }
      })

      setParsedLeads(leads)
      toast({
        title: "Success",
        description: `Parsed ${leads.length} leads from pasted data`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse pasted data",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate webhook URL
  const generateWebhookUrl = () => {
    const baseUrl = window.location.origin
    const webhookId = `webhook_${Date.now()}`
    const webhookUrl = `${baseUrl}/api/webhooks/leads/${webhookId}`
    setWebhookEndpoint(webhookUrl)
    
    toast({
      title: "Webhook Generated",
      description: "Copy the URL and configure your system to send leads to this endpoint"
    })
  }

  // Upload leads
  const uploadLeads = () => {
    if (parsedLeads.length === 0) {
      toast({
        title: "No Leads",
        description: "Please parse leads first",
        variant: "destructive"
      })
      return
    }

    onLeadsUploaded(parsedLeads)
    setParsedLeads([])
    setCsvFile(null)
    setPastedData('')
    
    toast({
      title: "Success",
      description: `${parsedLeads.length} leads uploaded successfully`
    })
  }

  // Test webhook
  const testWebhook = async () => {
    if (!webhookEndpoint) return

    try {
      const testLead = {
        phone: '+34600000001',
        name: 'Test Lead',
        email: 'test@example.com',
        company: 'Test Company',
        source: 'Webhook Test',
        notes: 'Test webhook integration'
      }

      const response = await fetch(webhookEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testLead)
      })

      if (response.ok) {
        toast({
          title: "Webhook Test Successful",
          description: "Test lead sent successfully"
        })
      } else {
        throw new Error('Webhook test failed')
      }
    } catch (error) {
      toast({
        title: "Webhook Test Failed",
        description: "Please check the webhook URL and try again",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Leads Upload</h2>
          <p className="text-muted-foreground">Import leads from CSV, copy/paste, or webhook API</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {parsedLeads.length} leads ready
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="paste">Copy & Paste</TabsTrigger>
          <TabsTrigger value="webhook">Webhook API</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CSV File Upload
              </CardTitle>
              <CardDescription>
                Upload a CSV file with lead data. Expected columns: phone, name, email, company, source, notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-upload">Select CSV File</Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  disabled={isProcessing}
                />
              </div>

              {csvFile && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    File selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={uploadLeads} disabled={parsedLeads.length === 0}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {parsedLeads.length} Leads
                </Button>
                <Button variant="outline" onClick={() => setParsedLeads([])}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paste" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Copy & Paste Data
              </CardTitle>
              <CardDescription>
                Paste tab-separated or comma-separated data. Format: phone, name, email, company, source, notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pasted-data">Paste Lead Data</Label>
                <Textarea
                  id="pasted-data"
                  placeholder="+34600000001	John Doe	john@example.com	Company A	Website	Notes here"
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={parsePastedData} disabled={!pastedData.trim() || isProcessing}>
                  <Copy className="h-4 w-4 mr-2" />
                  Parse Data
                </Button>
                <Button variant="outline" onClick={() => setPastedData('')}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Webhook API Integration
              </CardTitle>
              <CardDescription>
                Generate a webhook URL to receive leads from external systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook Endpoint</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookEndpoint}
                    placeholder="Click 'Generate Webhook' to create endpoint"
                    readOnly
                  />
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(webhookEndpoint)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Send POST requests to this endpoint with lead data in JSON format:
                  <pre className="mt-2 text-xs bg-muted p-2 rounded">
{`{
  "phone": "+34600000001",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Company A",
  "source": "Website",
  "notes": "Additional notes"
}`}
                  </pre>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={generateWebhookUrl}>
                  <Link className="h-4 w-4 mr-2" />
                  Generate Webhook
                </Button>
                <Button variant="outline" onClick={testWebhook} disabled={!webhookEndpoint}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Parsed Leads Preview */}
      {parsedLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Parsed Leads Preview</CardTitle>
            <CardDescription>
              {parsedLeads.length} leads ready to upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {parsedLeads.slice(0, 10).map((lead, index) => (
                <div key={index} className="flex items-center gap-4 p-2 border rounded">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{lead.phone}</span>
                  {lead.name && <span className="text-sm">{lead.name}</span>}
                  {lead.email && <Mail className="h-4 w-4 text-muted-foreground" />}
                  {lead.company && <span className="text-sm text-muted-foreground">{lead.company}</span>}
                </div>
              ))}
              {parsedLeads.length > 10 && (
                <div className="text-sm text-muted-foreground text-center">
                  ... and {parsedLeads.length - 10} more leads
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
