"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Lock,
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

interface SectionNavigationProps {
  className?: string
}

export function SectionNavigation({ className = "" }: SectionNavigationProps) {
  const { 
    activeSection, 
    setActiveSection, 
    canNavigateTo, 
    getNextSection, 
    getPreviousSection,
    validateSection 
  } = useABCaller()

  const sections = [
    { id: "overview", name: "Overview", icon: Target, description: "Dashboard and test management" },
    { id: "templates", name: "Templates", icon: FileText, description: "Test templates and configurations" },
    { id: "sampling", name: "Sampling", icon: Users, description: "Lead selection and grouping" },
    { id: "communication", name: "Communication", icon: MessageSquare, description: "Nudges and messaging" },
    { id: "spam", name: "Spam Protection", icon: Shield, description: "Spam detection and filtering" },
    { id: "scientific", name: "Scientific", icon: Brain, description: "Statistical analysis setup" },
    { id: "analytics", name: "Analytics", icon: BarChart3, description: "Performance analysis" },
    { id: "reporting", name: "Reporting", icon: FileText, description: "Reports and exports" }
  ]

  const currentIndex = sections.findIndex(s => s.id === activeSection)
  const progress = ((currentIndex + 1) / sections.length) * 100

  const handleNext = () => {
    const nextSection = getNextSection(activeSection)
    if (nextSection && canNavigateTo(nextSection)) {
      setActiveSection(nextSection)
    }
  }

  const handlePrevious = () => {
    const prevSection = getPreviousSection(activeSection)
    if (prevSection) {
      setActiveSection(prevSection)
    }
  }

  const handleSectionClick = (sectionId: string) => {
    if (canNavigateTo(sectionId)) {
      setActiveSection(sectionId)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Test Configuration Flow</CardTitle>
            <CardDescription>
              Follow the logical sequence to configure your A/B test
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={!getPreviousSection(activeSection)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={!getNextSection(activeSection) || !canNavigateTo(getNextSection(activeSection) || "")}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sections.map((section, index) => {
            const Icon = section.icon
            const isActive = section.id === activeSection
            const isCompleted = index < currentIndex
            const isAccessible = canNavigateTo(section.id)
            const isLocked = !isAccessible && !isActive

            return (
              <div
                key={section.id}
                className={`
                  relative p-3 rounded-lg border cursor-pointer transition-all
                  ${isActive ? 'border-blue-500 bg-blue-50' : ''}
                  ${isCompleted ? 'border-green-500 bg-green-50' : ''}
                  ${isLocked ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' : ''}
                  ${isAccessible && !isActive ? 'border-gray-300 hover:border-gray-400' : ''}
                `}
                onClick={() => !isLocked && handleSectionClick(section.id)}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : isLocked ? (
                      <Lock className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                      {section.name}
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {section.description}
                </p>
                {isActive && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Current Section Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Current: {sections.find(s => s.id === activeSection)?.name}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {sections.find(s => s.id === activeSection)?.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
