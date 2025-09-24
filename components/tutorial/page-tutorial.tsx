"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageTutorialProps {
  page: string
  title: string
  description: string
  content: React.ReactNode
  isOpen: boolean
  onClose: () => void
}

export function PageTutorial({ page, title, description, content, isOpen, onClose }: PageTutorialProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 100)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-start justify-center p-4 pt-20">
      <Card
        className={cn(
          "w-full max-w-lg transition-all duration-300",
          isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4",
        )}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="pb-6">
          {content}

          <div className="mt-6 flex justify-end">
            <Button onClick={onClose}>Got it!</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
