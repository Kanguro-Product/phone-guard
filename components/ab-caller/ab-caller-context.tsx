"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface TestData {
  test_id: string
  test_name: string
  status: string
  config: any
  metrics: any
  leads: any[]
  numbers: any[]
  templates: any[]
  sampling_config: any
  communication_config: any
  spam_config: any
  scientific_config: any
}

interface ABCallerContextType {
  // Test Data
  currentTest: TestData | null
  setCurrentTest: (test: TestData | null) => void
  
  // Section States
  activeSection: string
  setActiveSection: (section: string) => void
  
  // Data Flow
  updateTestData: (section: string, data: any) => void
  getTestData: (section: string) => any
  
  // Validation
  validateSection: (section: string) => boolean
  getSectionDependencies: (section: string) => string[]
  
  // Navigation
  canNavigateTo: (section: string) => boolean
  getNextSection: (currentSection: string) => string | null
  getPreviousSection: (currentSection: string) => string | null
}

const ABCallerContext = createContext<ABCallerContextType | undefined>(undefined)

export function ABCallerProvider({ children }: { children: ReactNode }) {
  const [currentTest, setCurrentTest] = useState<TestData | null>(null)
  const [activeSection, setActiveSection] = useState("overview")
  const [testData, setTestData] = useState<Record<string, any>>({})

  // Section dependencies and flow
  const sectionFlow = [
    "overview",
    "templates", 
    "sampling",
    "communication",
    "spam",
    "scientific",
    "analytics",
    "reporting"
  ]

  const sectionDependencies = {
    overview: [],
    templates: ["overview"],
    sampling: ["templates"],
    communication: ["sampling"],
    spam: ["communication"],
    scientific: ["spam"],
    analytics: ["scientific"],
    reporting: ["analytics"]
  }

  const updateTestData = (section: string, data: any) => {
    setTestData(prev => ({
      ...prev,
      [section]: data
    }))
  }

  const getTestData = (section: string) => {
    return testData[section] || null
  }

  const validateSection = (section: string): boolean => {
    const dependencies = sectionDependencies[section as keyof typeof sectionDependencies] || []
    return dependencies.every(dep => testData[dep] !== undefined)
  }

  const getSectionDependencies = (section: string): string[] => {
    return sectionDependencies[section as keyof typeof sectionDependencies] || []
  }

  const canNavigateTo = (section: string): boolean => {
    return validateSection(section)
  }

  const getNextSection = (currentSection: string): string | null => {
    const currentIndex = sectionFlow.indexOf(currentSection)
    if (currentIndex === -1 || currentIndex === sectionFlow.length - 1) return null
    return sectionFlow[currentIndex + 1]
  }

  const getPreviousSection = (currentSection: string): string | null => {
    const currentIndex = sectionFlow.indexOf(currentSection)
    if (currentIndex === -1 || currentIndex === 0) return null
    return sectionFlow[currentIndex - 1]
  }

  return (
    <ABCallerContext.Provider value={{
      currentTest,
      setCurrentTest,
      activeSection,
      setActiveSection,
      updateTestData,
      getTestData,
      validateSection,
      getSectionDependencies,
      canNavigateTo,
      getNextSection,
      getPreviousSection
    }}>
      {children}
    </ABCallerContext.Provider>
  )
}

export function useABCaller() {
  const context = useContext(ABCallerContext)
  if (context === undefined) {
    throw new Error('useABCaller must be used within an ABCallerProvider')
  }
  return context
}
