"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ArrowRight,
  Target,
  Users,
  MessageSquare,
  Shield,
  Brain,
  BarChart3,
  FileText
} from "lucide-react"
import { useABCaller } from "./ab-caller-context"

interface SectionValidatorProps {
  section: string
  className?: string
}

export function SectionValidator({ section, className = "" }: SectionValidatorProps) {
  const { 
    validateSection, 
    getSectionDependencies, 
    getTestData, 
    canNavigateTo,
    getNextSection 
  } = useABCaller()

  const sectionInfo = {
    overview: { name: "Overview", icon: Target, description: "Dashboard and test management" },
    templates: { name: "Templates", icon: FileText, description: "Test templates and configurations" },
    sampling: { name: "Sampling", icon: Users, description: "Lead selection and grouping" },
    communication: { name: "Communication", icon: MessageSquare, description: "Nudges and messaging" },
    spam: { name: "Spam Protection", icon: Shield, description: "Spam detection and filtering" },
    scientific: { name: "Scientific", icon: Brain, description: "Statistical analysis setup" },
    analytics: { name: "Analytics", icon: BarChart3, description: "Performance analysis" },
    reporting: { name: "Reporting", icon: FileText, description: "Reports and exports" }
  }

  const isValid = validateSection(section)
  const dependencies = getSectionDependencies(section)
  const nextSection = getNextSection(section)
  const canNavigate = canNavigateTo(section)

  const getValidationStatus = () => {
    if (isValid) return { status: "valid", icon: CheckCircle, color: "text-green-600" }
    if (dependencies.length === 0) return { status: "ready", icon: Target, color: "text-blue-600" }
    return { status: "invalid", icon: XCircle, color: "text-red-600" }
  }

  const validationStatus = getValidationStatus()
  const Icon = validationStatus.icon

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Icon className={`h-5 w-5 ${validationStatus.color}`} />
          <CardTitle className="text-lg">
            {sectionInfo[section as keyof typeof sectionInfo]?.name} Validation
          </CardTitle>
        </div>
        <CardDescription>
          {sectionInfo[section as keyof typeof sectionInfo]?.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge 
              variant={validationStatus.status === "valid" ? "default" : "secondary"}
              className={validationStatus.status === "valid" ? "bg-green-100 text-green-800" : ""}
            >
              {validationStatus.status === "valid" ? "Ready" : 
             validationStatus.status === "ready" ? "Available" : "Blocked"}
            </Badge>
            {nextSection && (
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <span>Next:</span>
                <span className="font-medium">{sectionInfo[nextSection as keyof typeof sectionInfo]?.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dependencies Check */}
        {dependencies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Dependencies</h4>
            <div className="space-y-1">
              {dependencies.map((dep) => {
                const depData = getTestData(dep)
                const isDepValid = depData !== null && depData !== undefined
                return (
                  <div key={dep} className="flex items-center space-x-2 text-sm">
                    {isDepValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={isDepValid ? "text-green-700" : "text-red-700"}>
                      {sectionInfo[dep as keyof typeof sectionInfo]?.name}
                    </span>
                    {isDepValid && (
                      <Badge variant="outline" className="text-xs">
                        ✓ Complete
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Current Section Data */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Current Data</h4>
          <div className="p-3 bg-gray-50 rounded-lg">
            {getTestData(section) ? (
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Configuration saved</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">No configuration yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Status */}
        {!canNavigate && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Complete the required dependencies before accessing this section.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {isValid && nextSection && (
            <Button size="sm" className="flex items-center space-x-1">
              <span>Continue to {sectionInfo[nextSection as keyof typeof sectionInfo]?.name}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
