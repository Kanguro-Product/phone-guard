"use client"

import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { HelpCircle, Info } from "lucide-react"

interface SectionTooltipProps {
  section: string
  children: React.ReactNode
  className?: string
}

export function SectionTooltip({ section, children, className = "" }: SectionTooltipProps) {
  const tooltipContent = {
    overview: {
      title: "Overview Dashboard",
      description: "Real-time dashboard showing key performance indicators, test status, and quick actions for managing your A/B tests.",
      dataSource: "Live data from test execution, call logs, and performance metrics",
      features: [
        "Test status monitoring",
        "Quick action buttons",
        "Real-time metrics",
        "Performance summaries"
      ]
    },
    templates: {
      title: "Test Templates",
      description: "Pre-configured test templates and the ability to create custom test configurations for different scenarios.",
      dataSource: "Template library and custom test configurations",
      features: [
        "Pre-built test templates",
        "Custom test creation",
        "Template cloning",
        "Configuration management"
      ]
    },
    analytics: {
      title: "Advanced Analytics",
      description: "Comprehensive analytics with detailed metrics, conversion funnels, geographic analysis, and performance insights.",
      dataSource: "Call logs, conversion tracking, geographic data, and performance metrics",
      features: [
        "Conversion funnel analysis",
        "Geographic performance maps",
        "Timeline analytics",
        "Performance comparisons"
      ]
    },
    sampling: {
      title: "Smart Sampling",
      description: "Intelligent lead sampling algorithms that optimize test groups based on lead characteristics, quality scores, and demographic data.",
      dataSource: "Lead database, quality scores, demographic data, and historical performance",
      features: [
        "Lead profile analysis",
        "Quality-based sampling",
        "Demographic optimization",
        "Statistical sampling methods"
      ]
    },
    scientific: {
      title: "Scientific Testing",
      description: "Statistical analysis tools including p-value calculations, confidence intervals, effect size analysis, and statistical significance testing.",
      dataSource: "Test results, statistical models, and performance data",
      features: [
        "P-value calculations",
        "Confidence intervals",
        "Effect size analysis",
        "Statistical significance testing"
      ]
    },
    communication: {
      title: "Communication System",
      description: "Multi-channel communication management including WhatsApp, Email, SMS, and Voicemail with template management and nudge configuration.",
      dataSource: "Communication logs, template library, and channel performance data",
      features: [
        "Multi-channel messaging",
        "Template management",
        "Nudge configuration",
        "Channel performance tracking"
      ]
    },
    spam: {
      title: "Spam Protection",
      description: "Advanced spam detection and protection system with real-time scoring, risk assessment, and automated filtering.",
      dataSource: "Spam detection APIs, phone reputation databases, and risk assessment algorithms",
      features: [
        "Real-time spam scoring",
        "Risk assessment",
        "Automated filtering",
        "Reputation monitoring"
      ]
    },
    vonage: {
      title: "Vonage Voice Configuration",
      description: "Configure derivation IDs and calling strategies for A/B testing with Vonage Voice API integration.",
      dataSource: "Vonage Voice API, derivation IDs, and call configuration",
      features: [
        "Derivation ID management",
        "Call strategy configuration",
        "Webhook setup",
        "Test call functionality"
      ]
    },
    reporting: {
      title: "Reporting System",
      description: "Comprehensive reporting and export capabilities with customizable reports, data visualization, and export formats.",
      dataSource: "Test data, performance metrics, and analytics results",
      features: [
        "Custom report generation",
        "Data export capabilities",
        "Visualization tools",
        "Scheduled reporting"
      ]
    }
  }

  const content = tooltipContent[section as keyof typeof tooltipContent]

  if (!content) return <>{children}</>

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-md">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm">{content.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{content.description}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Data Sources:</p>
              <p className="text-xs">{content.dataSource}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Key Features:</p>
              <ul className="text-xs space-y-1">
                {content.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface MetricTooltipProps {
  metric: string
  children: React.ReactNode
  className?: string
}

export function MetricTooltip({ metric, children, className = "" }: MetricTooltipProps) {
  const metricContent = {
    total_calls: {
      title: "Total Calls",
      description: "Total number of calls made across all channels and attempts during the test period.",
      calculation: "Sum of all call attempts across voice, WhatsApp, and other channels",
      dataSource: "Call logs and attempt tracking system"
    },
    answered_calls: {
      title: "Answered Calls",
      description: "Number of calls that were successfully answered by the recipient.",
      calculation: "Calls with 'answered' status from voice API responses",
      dataSource: "Voice API call outcome tracking"
    },
    conversion_rate: {
      title: "Conversion Rate",
      description: "Percentage of leads that converted to successful outcomes (meetings, sales, etc.).",
      calculation: "(Converted leads / Total leads contacted) × 100",
      dataSource: "Lead status tracking and conversion funnel analysis"
    },
    avg_call_duration: {
      title: "Average Call Duration",
      description: "Average duration of answered calls in minutes and seconds.",
      calculation: "Total call duration / Number of answered calls",
      dataSource: "Call duration logs from voice API"
    },
    peak_hours: {
      title: "Peak Performance Hours",
      description: "Hours of the day with highest success rates and engagement levels.",
      calculation: "Analysis of call outcomes by hour of day",
      dataSource: "Call logs with timestamp analysis"
    },
    geographic_distribution: {
      title: "Geographic Distribution",
      description: "Performance metrics broken down by geographic regions or cities.",
      calculation: "Lead location data and performance correlation",
      dataSource: "Lead database with geographic information"
    },
    channel_performance: {
      title: "Channel Performance",
      description: "Performance metrics across different communication channels (voice, WhatsApp, email, SMS).",
      calculation: "Success rate and engagement by communication channel",
      dataSource: "Multi-channel communication logs"
    },
    spam_score: {
      title: "Spam Score",
      description: "Risk score indicating the likelihood of a phone number being spam or fraudulent.",
      calculation: "Weighted score from multiple spam detection algorithms",
      dataSource: "Internal spam checker and phone reputation APIs"
    },
    quality_score: {
      title: "Quality Score",
      description: "Overall quality assessment of leads based on engagement and response patterns.",
      calculation: "Weighted score from lead engagement metrics",
      dataSource: "Lead quality assessment algorithms"
    },
    cost_per_lead: {
      title: "Cost per Lead",
      description: "Average cost to acquire each lead including all channel costs.",
      calculation: "Total campaign cost / Number of leads acquired",
      dataSource: "Cost tracking and lead attribution system"
    },
    roi: {
      title: "Return on Investment (ROI)",
      description: "Return on investment calculated from revenue generated vs costs incurred.",
      calculation: "((Revenue - Cost) / Cost) × 100",
      dataSource: "Revenue tracking and financial attribution"
    }
  }

  const content = metricContent[metric as keyof typeof metricContent]

  if (!content) return <>{children}</>

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            <div>
              <h4 className="font-semibold text-sm">{content.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{content.description}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground">Calculation:</p>
              <p className="text-xs">{content.calculation}</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-muted-foreground">Data Source:</p>
              <p className="text-xs">{content.dataSource}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface HelpButtonProps {
  section: string
  className?: string
  showText?: boolean
}

export function HelpButton({ section, className = "", showText = true }: HelpButtonProps) {
  return (
    <SectionTooltip section={section}>
      <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs text-muted-foreground ${className}`}>
        <HelpCircle className="h-3 w-3 mr-1" />
        {showText && "What is this?"}
      </Button>
    </SectionTooltip>
  )
}

interface InfoCircleProps {
  section: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function InfoCircle({ section, className = "", size = 'sm' }: InfoCircleProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <SectionTooltip section={section}>
      <div className={`inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-help ${sizeClasses[size]} ${className}`}>
        <Info className="h-3 w-3" />
      </div>
    </SectionTooltip>
  )
}

interface InfoIconProps {
  metric: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function InfoIcon({ metric, className = "", size = 'sm' }: InfoIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <MetricTooltip metric={metric}>
      <div className={`inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-help ${sizeClasses[size]} ${className}`}>
        <Info className="h-3 w-3" />
      </div>
    </MetricTooltip>
  )
}
