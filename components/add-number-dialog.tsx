"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface AddNumberDialogProps {
  children: React.ReactNode
}

export function AddNumberDialog({ children }: AddNumberDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    number: "",
    provider: "",
  })

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar que los campos estén completos
      if (!formData.number.trim()) {
        throw new Error("Phone number is required")
      }
      if (!formData.provider.trim()) {
        throw new Error("Provider is required")
      }

      // Validar formato básico del número de teléfono
      const phoneRegex = /^\+?[1-9]\d{1,14}$/
      if (!phoneRegex.test(formData.number.replace(/\s/g, ""))) {
        throw new Error("Please enter a valid phone number (e.g., +1234567890)")
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      console.log("Attempting to insert phone number:", {
        number: formData.number,
        provider: formData.provider,
        user_id: user.id
      })

      const { error } = await supabase.from("phone_numbers").insert({
        number: formData.number.trim(),
        provider: formData.provider,
        status: "active",
        reputation_score: 100,
        user_id: user.id,
      })

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      console.log("Phone number added successfully")
      setFormData({ number: "", provider: "" })
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error adding number:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Error adding phone number: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Phone Number</DialogTitle>
          <DialogDescription>Add a new phone number to your account for use in cadences.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="number" className="text-foreground">
                Phone Number
              </Label>
              <Input
                id="number"
                placeholder="+1234567890"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="provider" className="text-foreground">
                Provider
              </Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Twilio">Twilio</SelectItem>
                  <SelectItem value="Vonage">Vonage</SelectItem>
                  <SelectItem value="Plivo">Plivo</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Number"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
