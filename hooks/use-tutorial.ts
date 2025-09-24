"use client"

import { useState, useEffect } from "react"

interface TutorialState {
  mainTutorialCompleted: boolean
  neverShowAgain: boolean
  pageVisits: Record<string, boolean>
  hasVisitedApp: boolean
}

const TUTORIAL_STORAGE_KEY = "phone-manager-tutorial-state"

const defaultState: TutorialState = {
  mainTutorialCompleted: false,
  neverShowAgain: false,
  pageVisits: {},
  hasVisitedApp: false,
}

export function useTutorial() {
  const [tutorialState, setTutorialState] = useState<TutorialState>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (stored) {
      try {
        const parsedState = JSON.parse(stored)
        setTutorialState({
          ...defaultState,
          ...parsedState,
          hasVisitedApp: parsedState.hasVisitedApp ?? parsedState.mainTutorialCompleted ?? false,
        })
      } catch (error) {
        console.error("Failed to parse tutorial state:", error)
      }
    }
    setIsLoaded(true)
  }, [])

  const updateTutorialState = (updates: Partial<TutorialState>) => {
    const newState = { ...tutorialState, ...updates }
    setTutorialState(newState)
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(newState))
  }

  const markPageVisited = (page: string) => {
    updateTutorialState({
      pageVisits: { ...tutorialState.pageVisits, [page]: true },
    })
  }

  const completeMainTutorial = () => {
    updateTutorialState({
      mainTutorialCompleted: true,
      hasVisitedApp: true,
    })
  }

  const setNeverShowAgain = () => {
    updateTutorialState({
      neverShowAgain: true,
      mainTutorialCompleted: true,
      hasVisitedApp: true,
    })
  }

  const resetTutorial = () => {
    setTutorialState(defaultState)
    localStorage.removeItem(TUTORIAL_STORAGE_KEY)
  }

  const shouldShowMainTutorial = () => {
    // Only show main tutorial if user is authenticated and hasn't seen it
    return isLoaded && !tutorialState.hasVisitedApp && !tutorialState.neverShowAgain
  }

  const shouldShowPageTutorial = (page: string) => {
    return isLoaded && tutorialState.hasVisitedApp && !tutorialState.pageVisits[page]
  }

  const markAppVisited = () => {
    if (!tutorialState.hasVisitedApp) {
      updateTutorialState({ hasVisitedApp: true })
    }
  }

  return {
    tutorialState,
    isLoaded,
    markPageVisited,
    completeMainTutorial,
    setNeverShowAgain,
    resetTutorial,
    shouldShowMainTutorial,
    shouldShowPageTutorial,
    markAppVisited,
  }
}
