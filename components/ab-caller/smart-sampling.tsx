"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  Users, 
  MapPin, 
  Building, 
  Phone, 
  Star, 
  Target, 
  Zap,
  TrendingUp,
  Clock,
  Shield,
  Brain,
  Sparkles
} from "lucide-react"

interface LeadProfile {
  id: string
  name: string
  company: string
  sector: string
  province: string
  phone: string
  email: string
  quality_score: number
  conversion_probability: number
  best_time_to_call: string
  preferred_channel: string
  risk_level: 'low' | 'medium' | 'high'
  tags: string[]
  last_contact?: string
  notes?: string
}

interface SmartSamplingProps {
  onGenerateLeads: (leads: LeadProfile[]) => void
  onAnalyzePatterns: (analysis: any) => void
}

export function SmartSampling({ onGenerateLeads, onAnalyzePatterns }: SmartSamplingProps) {
  const [samplingConfig, setSamplingConfig] = useState({
    totalLeads: 100,
    geographicDistribution: 'balanced' as 'balanced' | 'madrid_focused' | 'barcelona_focused' | 'custom',
    sectorDistribution: 'diverse' as 'diverse' | 'tech_focused' | 'finance_focused' | 'custom',
    qualityLevel: 'mixed' as 'high' | 'medium' | 'low' | 'mixed',
    timePatterns: true,
    seasonalEffects: true,
    riskProfiling: true,
    aiOptimization: true
  })

  const [generatedLeads, setGeneratedLeads] = useState<LeadProfile[]>([])
  const [analysis, setAnalysis] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Realistic data pools
  const names = [
    'Alejandro García', 'María Rodríguez', 'Carlos López', 'Ana Martínez', 'David Sánchez',
    'Laura Fernández', 'Javier González', 'Carmen Pérez', 'Miguel Martín', 'Isabel Ruiz',
    'Antonio Díaz', 'Elena Moreno', 'Francisco Jiménez', 'Pilar Álvarez', 'José Muñoz',
    'Teresa Romero', 'Manuel Navarro', 'Cristina Herrera', 'Rafael Torres', 'Mónica Ramos'
  ]

  const companies = [
    'TechCorp Solutions', 'InnovateLab', 'Digital Dynamics', 'Future Systems', 'Smart Solutions',
    'FinancePro', 'Banking Solutions', 'Investment Partners', 'Capital Group', 'Wealth Management',
    'HealthCare Plus', 'Medical Systems', 'Wellness Corp', 'BioTech Solutions', 'Life Sciences',
    'Real Estate Pro', 'Property Solutions', 'Urban Development', 'Housing Corp', 'Estate Partners',
    'EduTech Solutions', 'Learning Systems', 'Academic Partners', 'Education Corp', 'Knowledge Hub'
  ]

  const sectors = [
    { name: 'Technology', weight: 0.25, conversionRate: 0.35 },
    { name: 'Finance', weight: 0.20, conversionRate: 0.28 },
    { name: 'Healthcare', weight: 0.18, conversionRate: 0.32 },
    { name: 'Real Estate', weight: 0.15, conversionRate: 0.25 },
    { name: 'Education', weight: 0.12, conversionRate: 0.30 },
    { name: 'Retail', weight: 0.10, conversionRate: 0.22 }
  ]

  const provinces = [
    { name: 'Madrid', weight: 0.30, population: 6.7 },
    { name: 'Barcelona', weight: 0.25, population: 5.6 },
    { name: 'Valencia', weight: 0.15, population: 2.6 },
    { name: 'Sevilla', weight: 0.10, population: 1.9 },
    { name: 'Bilbao', weight: 0.08, population: 1.0 },
    { name: 'Málaga', weight: 0.07, population: 1.7 },
    { name: 'Zaragoza', weight: 0.05, population: 0.7 }
  ]

  const generateRealisticLeads = async () => {
    setIsGenerating(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const leads: LeadProfile[] = []
    
    for (let i = 0; i < samplingConfig.totalLeads; i++) {
      const name = names[Math.floor(Math.random() * names.length)]
      const company = companies[Math.floor(Math.random() * companies.length)]
      const sector = selectWeightedSector()
      const province = selectWeightedProvince()
      
      // Generate realistic phone number
      const phone = `+34${600000000 + i}`
      const email = `${name.toLowerCase().replace(' ', '.')}@${company.toLowerCase().replace(' ', '')}.com`
      
      // Calculate quality score based on multiple factors
      const qualityScore = calculateQualityScore(sector, province, i)
      const conversionProb = calculateConversionProbability(sector, qualityScore)
      const bestTime = calculateBestTimeToCall(province, sector)
      const preferredChannel = selectPreferredChannel(sector, qualityScore)
      const riskLevel = calculateRiskLevel(qualityScore, sector)
      
      const lead: LeadProfile = {
        id: `lead_${i + 1}`,
        name,
        company,
        sector: sector.name,
        province: province.name,
        phone,
        email,
        quality_score: qualityScore,
        conversion_probability: conversionProb,
        best_time_to_call: bestTime,
        preferred_channel: preferredChannel,
        risk_level: riskLevel,
        tags: generateTags(sector, province, qualityScore),
        last_contact: Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        notes: generateNotes(sector, qualityScore)
      }
      
      leads.push(lead)
    }
    
    setGeneratedLeads(leads)
    
    // Generate analysis
    const analysis = generateAnalysis(leads)
    setAnalysis(analysis)
    onAnalyzePatterns(analysis)
    
    setIsGenerating(false)
  }

  const selectWeightedSector = () => {
    const random = Math.random()
    let cumulative = 0
    
    for (const sector of sectors) {
      cumulative += sector.weight
      if (random <= cumulative) {
        return sector
      }
    }
    return sectors[0]
  }

  const selectWeightedProvince = () => {
    const random = Math.random()
    let cumulative = 0
    
    for (const province of provinces) {
      cumulative += province.weight
      if (random <= cumulative) {
        return province
      }
    }
    return provinces[0]
  }

  const calculateQualityScore = (sector: any, province: any, index: number) => {
    let score = 50 // Base score
    
    // Sector bonus
    score += sector.conversionRate * 20
    
    // Province bonus (Madrid and Barcelona have higher quality)
    if (province.name === 'Madrid' || province.name === 'Barcelona') {
      score += 10
    }
    
    // Random variation
    score += (Math.random() - 0.5) * 20
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  const calculateConversionProbability = (sector: any, qualityScore: number) => {
    const baseProb = sector.conversionRate
    const qualityBonus = (qualityScore - 50) / 100 * 0.2
    return Math.max(0.1, Math.min(0.8, baseProb + qualityBonus))
  }

  const calculateBestTimeToCall = (province: any, sector: any) => {
    const times = ['09:00', '10:30', '14:00', '15:30', '16:00']
    const sectorPreferences = {
      'Technology': [0, 1, 2], // Morning and early afternoon
      'Finance': [0, 3, 4], // Morning and late afternoon
      'Healthcare': [1, 2], // Mid-morning and early afternoon
      'Real Estate': [2, 3], // Afternoon
      'Education': [1, 2], // Mid-morning and early afternoon
      'Retail': [0, 4] // Early morning and late afternoon
    }
    
    const preferredTimes = sectorPreferences[sector.name as keyof typeof sectorPreferences] || [1, 2]
    const randomIndex = preferredTimes[Math.floor(Math.random() * preferredTimes.length)]
    return times[randomIndex]
  }

  const selectPreferredChannel = (sector: any, qualityScore: number) => {
    const channels = ['phone', 'whatsapp', 'email']
    const sectorPreferences = {
      'Technology': ['whatsapp', 'phone', 'email'],
      'Finance': ['phone', 'email', 'whatsapp'],
      'Healthcare': ['phone', 'whatsapp', 'email'],
      'Real Estate': ['phone', 'email', 'whatsapp'],
      'Education': ['email', 'whatsapp', 'phone'],
      'Retail': ['whatsapp', 'phone', 'email']
    }
    
    const preferences = sectorPreferences[sector.name as keyof typeof sectorPreferences] || channels
    return preferences[Math.floor(Math.random() * preferences.length)]
  }

  const calculateRiskLevel = (qualityScore: number, sector: any) => {
    if (qualityScore >= 80) return 'low'
    if (qualityScore >= 60) return 'medium'
    return 'high'
  }

  const generateTags = (sector: any, province: any, qualityScore: number) => {
    const tags = []
    
    if (qualityScore >= 80) tags.push('high-quality')
    if (qualityScore >= 70) tags.push('premium')
    if (sector.name === 'Technology') tags.push('tech-savvy')
    if (sector.name === 'Finance') tags.push('financial')
    if (province.name === 'Madrid' || province.name === 'Barcelona') tags.push('urban')
    if (Math.random() > 0.8) tags.push('influencer')
    if (Math.random() > 0.9) tags.push('decision-maker')
    
    return tags
  }

  const generateNotes = (sector: any, qualityScore: number) => {
    const notes = []
    
    if (qualityScore >= 80) {
      notes.push('High-value prospect')
    }
    if (sector.name === 'Technology') {
      notes.push('Early adopter, interested in innovation')
    }
    if (Math.random() > 0.7) {
      notes.push('Previous positive interaction')
    }
    
    return notes.join('; ')
  }

  const generateAnalysis = (leads: LeadProfile[]) => {
    const totalLeads = leads.length
    const avgQualityScore = leads.reduce((sum, lead) => sum + lead.quality_score, 0) / totalLeads
    const avgConversionProb = leads.reduce((sum, lead) => sum + lead.conversion_probability, 0) / totalLeads
    
    const sectorDistribution = leads.reduce((acc, lead) => {
      acc[lead.sector] = (acc[lead.sector] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const provinceDistribution = leads.reduce((acc, lead) => {
      acc[lead.province] = (acc[lead.province] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const riskDistribution = leads.reduce((acc, lead) => {
      acc[lead.risk_level] = (acc[lead.risk_level] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const channelDistribution = leads.reduce((acc, lead) => {
      acc[lead.preferred_channel] = (acc[lead.preferred_channel] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalLeads,
      avgQualityScore: Math.round(avgQualityScore),
      avgConversionProb: Math.round(avgConversionProb * 100) / 100,
      sectorDistribution,
      provinceDistribution,
      riskDistribution,
      channelDistribution,
      highQualityLeads: leads.filter(lead => lead.quality_score >= 80).length,
      expectedConversions: Math.round(leads.reduce((sum, lead) => sum + lead.conversion_probability, 0))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Lead Sampling</h2>
          <p className="text-muted-foreground">AI-powered lead generation with realistic profiles</p>
        </div>
        <Button 
          onClick={generateRealisticLeads} 
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isGenerating ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Leads
            </>
          )}
        </Button>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Sampling Configuration</CardTitle>
          <CardDescription>Configure AI-powered lead generation parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="geographic">Geographic</TabsTrigger>
              <TabsTrigger value="sector">Sector</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Leads</Label>
                  <Input
                    type="number"
                    value={samplingConfig.totalLeads}
                    onChange={(e) => setSamplingConfig(prev => ({ ...prev, totalLeads: parseInt(e.target.value) || 100 }))}
                  />
                </div>
                <div>
                  <Label>Quality Level</Label>
                  <Select 
                    value={samplingConfig.qualityLevel} 
                    onValueChange={(value) => setSamplingConfig(prev => ({ ...prev, qualityLevel: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Quality</SelectItem>
                      <SelectItem value="medium">Medium Quality</SelectItem>
                      <SelectItem value="low">Low Quality</SelectItem>
                      <SelectItem value="mixed">Mixed Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="geographic" className="space-y-4">
              <div>
                <Label>Geographic Distribution</Label>
                <Select 
                  value={samplingConfig.geographicDistribution} 
                  onValueChange={(value) => setSamplingConfig(prev => ({ ...prev, geographicDistribution: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced (All regions)</SelectItem>
                    <SelectItem value="madrid_focused">Madrid Focused</SelectItem>
                    <SelectItem value="barcelona_focused">Barcelona Focused</SelectItem>
                    <SelectItem value="custom">Custom Distribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="sector" className="space-y-4">
              <div>
                <Label>Sector Distribution</Label>
                <Select 
                  value={samplingConfig.sectorDistribution} 
                  onValueChange={(value) => setSamplingConfig(prev => ({ ...prev, sectorDistribution: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diverse">Diverse (All sectors)</SelectItem>
                    <SelectItem value="tech_focused">Tech Focused</SelectItem>
                    <SelectItem value="finance_focused">Finance Focused</SelectItem>
                    <SelectItem value="custom">Custom Distribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Time Patterns</Label>
                    <p className="text-sm text-muted-foreground">Consider optimal calling times</p>
                  </div>
                  <Switch
                    checked={samplingConfig.timePatterns}
                    onCheckedChange={(checked) => setSamplingConfig(prev => ({ ...prev, timePatterns: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Seasonal Effects</Label>
                    <p className="text-sm text-muted-foreground">Apply seasonal variations</p>
                  </div>
                  <Switch
                    checked={samplingConfig.seasonalEffects}
                    onCheckedChange={(checked) => setSamplingConfig(prev => ({ ...prev, seasonalEffects: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Risk Profiling</Label>
                    <p className="text-sm text-muted-foreground">Assess spam risk levels</p>
                  </div>
                  <Switch
                    checked={samplingConfig.riskProfiling}
                    onCheckedChange={(checked) => setSamplingConfig(prev => ({ ...prev, riskProfiling: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>AI Optimization</Label>
                    <p className="text-sm text-muted-foreground">Use ML for lead scoring</p>
                  </div>
                  <Switch
                    checked={samplingConfig.aiOptimization}
                    onCheckedChange={(checked) => setSamplingConfig(prev => ({ ...prev, aiOptimization: checked }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generated Leads Preview */}
      {generatedLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Leads Preview</CardTitle>
            <CardDescription>{generatedLeads.length} leads generated with realistic profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Analysis Summary */}
              {analysis && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.totalLeads}</div>
                    <div className="text-sm text-muted-foreground">Total Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.avgQualityScore}</div>
                    <div className="text-sm text-muted-foreground">Avg Quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.avgConversionProb}</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.expectedConversions}</div>
                    <div className="text-sm text-muted-foreground">Expected Conversions</div>
                  </div>
                </div>
              )}

              {/* Lead Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {generatedLeads.slice(0, 12).map((lead) => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{lead.name}</div>
                          <Badge variant={lead.risk_level === 'low' ? 'default' : lead.risk_level === 'medium' ? 'secondary' : 'destructive'}>
                            {lead.risk_level}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{lead.company}</div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{lead.sector}</Badge>
                          <Badge variant="outline">{lead.province}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>{lead.quality_score}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span>{Math.round(lead.conversion_probability * 100)}%</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Best time: {lead.best_time_to_call} • {lead.preferred_channel}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={() => onGenerateLeads(generatedLeads)}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Use These Leads for Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
