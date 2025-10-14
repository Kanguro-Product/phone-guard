"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calculator, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Brain,
  Zap,
  Shield,
  Activity,
  Gauge,
  PieChart,
  LineChart
} from "lucide-react"

interface StatisticalAnalysis {
  pValue: number
  confidenceLevel: number
  statisticalPower: number
  effectSize: number
  sampleSize: number
  minimumDetectableEffect: number
  significance: boolean
  confidenceInterval: [number, number]
  standardError: number
  degreesOfFreedom: number
}

interface PowerAnalysis {
  currentPower: number
  requiredPower: number
  currentSampleSize: number
  requiredSampleSize: number
  effectSize: number
  alpha: number
  beta: number
}

interface ScientificTestingProps {
  testData: any
  onAnalysisComplete: (analysis: StatisticalAnalysis) => void
}

export function ScientificTesting({ testData, onAnalysisComplete }: ScientificTestingProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [analysis, setAnalysis] = useState<StatisticalAnalysis | null>(null)
  const [powerAnalysis, setPowerAnalysis] = useState<PowerAnalysis | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Calculate statistical analysis
  const calculateStatisticalAnalysis = async () => {
    setIsCalculating(true)
    
    // Simulate calculation time
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const groupA = testData?.group_a || { answered_calls: 25, total_calls: 100 }
    const groupB = testData?.group_b || { answered_calls: 30, total_calls: 100 }
    
    // Calculate proportions
    const p1 = groupA.answered_calls / groupA.total_calls
    const p2 = groupB.answered_calls / groupB.total_calls
    
    // Calculate pooled proportion
    const pooledP = (groupA.answered_calls + groupB.answered_calls) / (groupA.total_calls + groupB.total_calls)
    
    // Calculate standard error
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/groupA.total_calls + 1/groupB.total_calls))
    
    // Calculate z-score
    const zScore = (p1 - p2) / se
    
    // Calculate p-value (two-tailed)
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))
    
    // Calculate confidence interval (95%)
    const marginOfError = 1.96 * se
    const confidenceInterval: [number, number] = [
      (p1 - p2) - marginOfError,
      (p1 - p2) + marginOfError
    ]
    
    // Calculate effect size (Cohen's h)
    const effectSize = 2 * Math.asin(Math.sqrt(p1)) - 2 * Math.asin(Math.sqrt(p2))
    
    // Calculate statistical power
    const alpha = 0.05
    const beta = 0.20
    const statisticalPower = calculatePower(p1, p2, groupA.total_calls, groupB.total_calls, alpha)
    
    const statisticalAnalysis: StatisticalAnalysis = {
      pValue,
      confidenceLevel: 95,
      statisticalPower,
      effectSize: Math.abs(effectSize),
      sampleSize: groupA.total_calls + groupB.total_calls,
      minimumDetectableEffect: calculateMDE(groupA.total_calls, groupB.total_calls, alpha, 0.8),
      significance: pValue < 0.05,
      confidenceInterval,
      standardError: se,
      degreesOfFreedom: groupA.total_calls + groupB.total_calls - 2
    }
    
    setAnalysis(statisticalAnalysis)
    onAnalysisComplete(statisticalAnalysis)
    
    // Calculate power analysis
    const powerAnalysis: PowerAnalysis = {
      currentPower: statisticalPower,
      requiredPower: 0.8,
      currentSampleSize: groupA.total_calls + groupB.total_calls,
      requiredSampleSize: calculateRequiredSampleSize(p1, p2, alpha, 0.8),
      effectSize: Math.abs(effectSize),
      alpha,
      beta
    }
    
    setPowerAnalysis(powerAnalysis)
    setIsCalculating(false)
  }

  // Helper functions for statistical calculations
  const normalCDF = (x: number) => {
    return 0.5 * (1 + erf(x / Math.sqrt(2)))
  }

  const erf = (x: number) => {
    // Approximation of error function
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  const calculatePower = (p1: number, p2: number, n1: number, n2: number, alpha: number) => {
    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2)
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2))
    const zAlpha = 1.96 // For alpha = 0.05
    const zBeta = (Math.abs(p1 - p2) - zAlpha * se) / se
    return normalCDF(zBeta)
  }

  const calculateMDE = (n1: number, n2: number, alpha: number, power: number) => {
    const zAlpha = 1.96
    const zBeta = 0.84 // For power = 0.8
    const pooledP = 0.5 // Conservative estimate
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2))
    return (zAlpha + zBeta) * se
  }

  const calculateRequiredSampleSize = (p1: number, p2: number, alpha: number, power: number) => {
    const zAlpha = 1.96
    const zBeta = 0.84
    const pooledP = (p1 + p2) / 2
    const effectSize = Math.abs(p1 - p2)
    return Math.ceil(Math.pow((zAlpha + zBeta) / effectSize, 2) * 2 * pooledP * (1 - pooledP))
  }

  const getSignificanceColor = (pValue: number) => {
    if (pValue < 0.01) return 'text-green-600'
    if (pValue < 0.05) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSignificanceText = (pValue: number) => {
    if (pValue < 0.01) return 'Highly Significant'
    if (pValue < 0.05) return 'Significant'
    if (pValue < 0.10) return 'Marginally Significant'
    return 'Not Significant'
  }

  const getEffectSizeText = (effectSize: number) => {
    if (effectSize < 0.2) return 'Small'
    if (effectSize < 0.5) return 'Medium'
    if (effectSize < 0.8) return 'Large'
    return 'Very Large'
  }

  const getPowerColor = (power: number) => {
    if (power >= 0.8) return 'text-green-600'
    if (power >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  useEffect(() => {
    if (testData) {
      calculateStatisticalAnalysis()
    }
  }, [testData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scientific Analysis</h2>
          <p className="text-muted-foreground">Statistical significance and power analysis</p>
        </div>
        <Button 
          onClick={calculateStatisticalAnalysis} 
          disabled={isCalculating}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isCalculating ? (
            <>
              <Activity className="h-4 w-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Recalculate
            </>
          )}
        </Button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">P-Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSignificanceColor(analysis?.pValue || 0)}`}>
                {analysis?.pValue?.toFixed(4) || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                {getSignificanceText(analysis?.pValue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Statistical Power</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPowerColor(analysis?.statisticalPower || 0)}`}>
                {((analysis?.statisticalPower || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {(analysis?.statisticalPower || 0) >= 0.8 ? 'Adequate' : 'Insufficient'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Effect Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analysis?.effectSize?.toFixed(3) || 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                {getEffectSizeText(analysis?.effectSize || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sample Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analysis?.sampleSize || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                {powerAnalysis && (analysis?.sampleSize || 0) >= powerAnalysis.requiredSampleSize ? 'Adequate' : 'Insufficient'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

        {/* Alerts */}
        {analysis && (
          <div className="space-y-4">
            {analysis?.pValue && analysis.pValue < 0.05 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Statistically Significant!</strong> The difference between groups is statistically significant (p = {analysis?.pValue?.toFixed(4) || 'N/A'}).
              </AlertDescription>
            </Alert>
          )}

          {analysis?.statisticalPower && analysis.statisticalPower < 0.8 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Low Statistical Power:</strong> Current power is {((analysis?.statisticalPower || 0) * 100).toFixed(1)}%. 
                Consider increasing sample size for more reliable results.
              </AlertDescription>
            </Alert>
          )}

          {powerAnalysis && (analysis?.sampleSize || 0) < powerAnalysis.requiredSampleSize && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Insufficient Sample Size:</strong> Need {powerAnalysis.requiredSampleSize} samples for 80% power. 
                Current: {analysis?.sampleSize || 0}.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Detailed Analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="significance">Significance</TabsTrigger>
          <TabsTrigger value="power">Power Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistical Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">P-Value:</span>
                      <span className={`font-medium ${getSignificanceColor(analysis?.pValue || 0)}`}>
                        {analysis?.pValue?.toFixed(4) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Confidence Level:</span>
                      <span className="font-medium">{analysis?.confidenceLevel || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Effect Size:</span>
                      <span className="font-medium">{analysis?.effectSize?.toFixed(3) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Standard Error:</span>
                      <span className="font-medium">{analysis?.standardError?.toFixed(4) || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Confidence Interval</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {analysis?.confidenceInterval?.[0]?.toFixed(3) || 'N/A'} to {analysis?.confidenceInterval?.[1]?.toFixed(3) || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        95% Confidence Interval
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: '100%',
                          marginLeft: `${Math.max(0, ((analysis?.confidenceInterval?.[0] || 0) + 0.1) * 100)}%`,
                          marginRight: `${Math.max(0, (0.1 - (analysis?.confidenceInterval?.[1] || 0)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="significance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Significance Testing</CardTitle>
              <CardDescription>Understanding statistical significance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">What does this mean?</h4>
                  <p className="text-sm text-blue-800">
                    {analysis?.pValue && analysis.pValue < 0.05 
                      ? `With a p-value of ${analysis.pValue.toFixed(4)}, we can be confident that the observed difference is not due to random chance.`
                      : `With a p-value of ${analysis?.pValue?.toFixed(4) || 'N/A'}, we cannot rule out that the observed difference is due to random chance.`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold">α = 0.05</div>
                    <div className="text-sm text-muted-foreground">Significance Level</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold">p = {analysis?.pValue?.toFixed(4) || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">Observed P-Value</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className={`text-lg font-bold ${(analysis?.pValue || 0) < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                      {(analysis?.pValue || 0) < 0.05 ? 'Significant' : 'Not Significant'}
                    </div>
                    <div className="text-sm text-muted-foreground">Conclusion</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="power" className="space-y-6">
          {powerAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Power Analysis</CardTitle>
                <CardDescription>Statistical power and sample size requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Current Power</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={powerAnalysis.currentPower * 100} className="w-32" />
                      <span className="font-medium">{(powerAnalysis.currentPower * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Required Power</span>
                    <span className="font-medium">80%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Current Sample Size</span>
                    <span className="font-medium">{powerAnalysis.currentSampleSize}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Required Sample Size</span>
                    <span className="font-medium">{powerAnalysis.requiredSampleSize}</span>
                  </div>
                </div>

                {powerAnalysis.currentPower < 0.8 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Low Power:</strong> Consider increasing sample size to {powerAnalysis.requiredSampleSize} 
                      for 80% statistical power.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Actionable insights based on statistical analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {(analysis?.pValue || 0) < 0.05 ? (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">✅ Significant Result</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• The test shows a statistically significant difference</li>
                      <li>• You can confidently implement the winning variant</li>
                      <li>• Consider the practical significance of the effect size</li>
                    </ul>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">⚠️ Not Significant</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• The difference is not statistically significant</li>
                      <li>• Consider running the test longer or increasing sample size</li>
                      <li>• Check if the effect size is practically meaningful</li>
                    </ul>
                  </div>
                )}

                {(analysis?.statisticalPower || 0) < 0.8 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📊 Power Recommendations</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Increase sample size to {powerAnalysis?.requiredSampleSize} for 80% power</li>
                      <li>• Consider running the test for a longer duration</li>
                      <li>• Ensure equal distribution between test groups</li>
                    </ul>
                  </div>
                )}

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">🎯 Next Steps</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Document all findings and methodology</li>
                  <li>• Plan follow-up tests to validate results</li>
                  <li>• Consider segmenting results by demographics</li>
                  <li>• Share results with stakeholders</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
