"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Phone,
  BarChart3,
  Settings,
  PhoneCall,
  Shield,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TutorialStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
  target?: string
  position?: "top" | "bottom" | "left" | "right"
}

interface TutorialOverlayProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  onNeverShowAgain: () => void
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Phone Manager! 📞",
    description: "Your comprehensive solution for managing phone numbers and sales cadences",
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <Phone className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">Let's get you started with a quick tour!</p>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">What you'll learn:</h4>
          <ul className="space-y-1 text-sm">
            <li>• How to manage your phone numbers</li>
            <li>• Setting up sales cadences</li>
            <li>• Monitoring call performance</li>
            <li>• Understanding reputation scores</li>
          </ul>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
          <span>This tutorial takes about 3 minutes</span>
        </div>
      </div>
    ),
  },
  {
    id: "navigation",
    title: "Navigation Overview",
    description: "Understanding the main sections of your dashboard",
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-sm">Dashboard</div>
              <div className="text-xs text-muted-foreground">Overview & metrics</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-sm">Numbers</div>
              <div className="text-xs text-muted-foreground">Manage phone numbers</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Settings className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-sm">Cadences</div>
              <div className="text-xs text-muted-foreground">Sales sequences</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <PhoneCall className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-sm">Calls</div>
              <div className="text-xs text-muted-foreground">Call history & logs</div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Admin section available for admin users</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard - Your Command Center",
    description: "Monitor performance and get insights at a glance",
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300 animate-pulse">24</div>
            <div className="text-sm text-green-600 dark:text-green-400">Active Numbers</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 animate-pulse">87%</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Avg Reputation</div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Key Features:</h4>
          <ul className="space-y-1 text-sm">
            <li>
              • <strong>Real-time metrics</strong> - Track your numbers' performance
            </li>
            <li>
              • <strong>Reputation monitoring</strong> - Avoid spam classifications
            </li>
            <li>
              • <strong>Call analytics</strong> - Understand your success rates
            </li>
            <li>
              • <strong>System alerts</strong> - Get notified of issues
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "numbers",
    title: "Phone Numbers Management",
    description: "Add, organize, and monitor your phone numbers",
    content: (
      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Sample Phone Number</span>
            <Badge variant="secondary" className="animate-pulse">
              Active
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>+1 (555) 123-4567</div>
            <div>Provider: Twilio</div>
            <div className="flex items-center gap-2">
              <span>Reputation:</span>
              <div className="flex-1 bg-green-200 dark:bg-green-800 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-4/5 animate-pulse"></div>
              </div>
              <span className="text-green-600 dark:text-green-400">85%</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">What you can do:</h4>
          <ul className="space-y-1 text-sm">
            <li>
              • <strong>Add numbers individually</strong> or in bulk (up to 200)
            </li>
            <li>
              • <strong>Monitor reputation scores</strong> to avoid spam flags
            </li>
            <li>
              • <strong>Track usage statistics</strong> and performance
            </li>
            <li>
              • <strong>Set up A/B testing</strong> with different numbers
            </li>
          </ul>
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            Pro tip: Use bulk upload to add multiple numbers at once!
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "cadences",
    title: "Sales Cadences",
    description: "Create automated calling sequences for maximum efficiency",
    content: (
      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Sample Cadence</span>
            <Badge className="animate-pulse">Running</Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Day 1:</span>
              <span className="text-muted-foreground">Initial call</span>
            </div>
            <div className="flex justify-between">
              <span>Day 3:</span>
              <span className="text-muted-foreground">Follow-up call</span>
            </div>
            <div className="flex justify-between">
              <span>Day 7:</span>
              <span className="text-muted-foreground">Final attempt</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Cadence Features:</h4>
          <ul className="space-y-1 text-sm">
            <li>
              • <strong>Automated scheduling</strong> - Set call intervals
            </li>
            <li>
              • <strong>A/B testing</strong> - Compare different approaches
            </li>
            <li>
              • <strong>Performance tracking</strong> - Monitor success rates
            </li>
            <li>
              • <strong>Smart routing</strong> - Use best-performing numbers
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "calls",
    title: "Call Management & Analytics",
    description: "Track every call and optimize your performance",
    content: (
      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recent Call</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Connected
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>To: +1 (555) 987-6543</div>
              <div>Duration: 2m 34s</div>
              <div>From: +1 (555) 123-4567</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
            <div className="text-lg font-bold text-green-700 dark:text-green-300 animate-pulse">67%</div>
            <div className="text-xs text-green-600 dark:text-green-400">Connect Rate</div>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300 animate-pulse">2.1m</div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Avg Duration</div>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200 dark:border-purple-800">
            <div className="text-lg font-bold text-purple-700 dark:text-purple-300 animate-pulse">156</div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Total Calls</div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Call Analytics:</h4>
          <ul className="space-y-1 text-sm">
            <li>
              • <strong>Detailed call logs</strong> - Every call recorded
            </li>
            <li>
              • <strong>Success metrics</strong> - Track what works
            </li>
            <li>
              • <strong>Spam detection</strong> - Monitor reputation impact
            </li>
            <li>
              • <strong>Performance trends</strong> - Identify patterns
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "tips",
    title: "Pro Tips & Best Practices",
    description: "Get the most out of Phone Manager",
    content: (
      <div className="space-y-4">
        <div className="grid gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="font-medium text-green-700 dark:text-green-300 mb-1">🎯 Reputation Management</div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Keep reputation scores above 80% to avoid spam filters
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">📊 A/B Testing</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Test different numbers and cadences to optimize results
            </div>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">⏰ Timing Matters</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              Schedule calls during optimal hours for better connect rates
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <div className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</div>
            <div>
              <div className="font-medium text-yellow-700 dark:text-yellow-300 mb-1">Important Disclaimer</div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                Always comply with local regulations and obtain proper consent before making sales calls. Phone Manager
                is a tool to help manage your legitimate business communications.
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export function TutorialOverlay({ isOpen, onClose, onComplete, onNeverShowAgain }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsAnimating(false)
      }, 150)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsAnimating(false)
      }, 150)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep(stepIndex)
      setIsAnimating(false)
    }, 150)
  }

  if (!isOpen) return null

  const currentTutorialStep = tutorialSteps[currentStep]
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {currentStep + 1} of {tutorialSteps.length}
              </Badge>
              <CardTitle className="text-xl">{currentTutorialStep.title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>{currentTutorialStep.description}</CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>

        <CardContent className="pb-6">
          <div
            className={cn("transition-all duration-150", isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100")}
          >
            {currentTutorialStep.content}
          </div>
        </CardContent>

        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentStep ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep === 0 && (
                <Button variant="outline" onClick={onNeverShowAgain}>
                  Don't show again
                </Button>
              )}
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === tutorialSteps.length - 1 ? "Got it!" : "Next"}
                {currentStep < tutorialSteps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
