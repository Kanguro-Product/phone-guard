"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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

interface PhoneNumber {
  id: string
  number: string
  provider: string
  reputation_score: number
}

interface AddCadenceDialogProps {
  children: React.ReactNode
  phoneNumbers: PhoneNumber[]
}

export function AddCadenceDialog({ children, phoneNumbers }: AddCadenceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rotation_strategy: "round_robin",
    selectedNumbers: [] as string[],
  })

  const router = useRouter()
  const supabase = createClient()

  const handleNumberToggle = (numberId: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        selectedNumbers: [...prev.selectedNumbers, numberId],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedNumbers: prev.selectedNumbers.filter((id) => id !== numberId),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.selectedNumbers.length === 0) {
      alert("Please select at least one phone number")
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("cadences").insert({
        name: formData.name,
        description: formData.description,
        phone_numbers: formData.selectedNumbers,
        rotation_strategy: formData.rotation_strategy,
        is_active: true,
        user_id: user.id,
      })

      if (error) throw error

      setFormData({
        name: "",
        description: "",
        rotation_strategy: "round_robin",
        selectedNumbers: [],
      })
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating cadence:", error)
      alert("Error creating cadence. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Cadence</DialogTitle>
          <DialogDescription>Set up a new A/B testing cadence with phone number rotation.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-foreground">
                Cadence Name
              </Label>
              <Input
                id="name"
                placeholder="Sales Outreach A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Primary sales cadence for lead generation"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="strategy" className="text-foreground">
                Rotation Strategy
              </Label>
              <Select
                value={formData.rotation_strategy}
                onValueChange={(value) => setFormData({ ...formData, rotation_strategy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="reputation_based">Reputation Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-foreground">Select Phone Numbers</Label>
              {phoneNumbers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active phone numbers available. Add some numbers first.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {phoneNumbers.map((number) => (
                    <div key={number.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={number.id}
                        checked={formData.selectedNumbers.includes(number.id)}
                        onCheckedChange={(checked) => handleNumberToggle(number.id, checked as boolean)}
                      />
                      <Label htmlFor={number.id} className="text-sm font-mono text-foreground flex-1 cursor-pointer">
                        {number.number}
                      </Label>
                      <span className="text-xs text-muted-foreground">{number.provider}</span>
                      <span className="text-xs text-muted-foreground">Rep: {number.reputation_score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || phoneNumbers.length === 0}>
              {loading ? "Creating..." : "Create Cadence"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
