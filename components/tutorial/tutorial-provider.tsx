"use client"

import type React from "react"

import { createContext, useContext, useEffect } from "react"
import { useTutorial } from "@/hooks/use-tutorial"
import { TutorialOverlay } from "./tutorial-overlay"

interface TutorialContextType {
  shouldShowMainTutorial: () => boolean
  shouldShowPageTutorial: (page: string) => boolean
  markPageVisited: (page: string) => void
  resetTutorial: () => void
  markAppVisited: () => void
}

const TutorialContext = createContext<TutorialContextType | null>(null)

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const tutorial = useTutorial()

  useEffect(() => {
    // Only mark app as visited if we're on an authenticated page
    if (tutorial.isLoaded && !tutorial.shouldShowMainTutorial()) {
      const timer = setTimeout(() => {
        tutorial.markAppVisited()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [tutorial.isLoaded, tutorial.shouldShowMainTutorial, tutorial.markAppVisited])

  return (
    <TutorialContext.Provider value={tutorial}>
      {children}
      {/* Only show tutorial overlay on authenticated pages */}
      <TutorialOverlay
        isOpen={tutorial.shouldShowMainTutorial()}
        onClose={tutorial.completeMainTutorial}
        onComplete={tutorial.completeMainTutorial}
        onNeverShowAgain={tutorial.setNeverShowAgain}
      />
    </TutorialContext.Provider>
  )
}

export function useTutorialContext() {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error("useTutorialContext must be used within TutorialProvider")
  }
  return context
}
