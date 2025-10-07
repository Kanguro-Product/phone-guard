"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PhoneNumber {
  id: string
  number: string
  provider: string
  status: string
}

interface CreateTestDialogProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onTestCreated: (test: any) => void
  phoneNumbers: PhoneNumber[]
  userId: string
}

const COMMON_OBJECTIVES = [
  "Increase call answer rate by at least 10%",
  "Reduce spam reports below 5%",
  "Improve lead contact rate to above 50%",
  "Decrease cost per lead response by 15%",
  "Optimize callback rate within 2 hours"
]

const DEPENDENT_VARIABLES = [
  { id: "tasa_respuesta", label: "Answer Rate (%)" },
  { id: "tasa_contacto", label: "Contact Rate (%)" },
  { id: "intentos_promedio", label: "Average Attempts" },
  { id: "clr", label: "Cost per Lead (CLR)" },
  { id: "spam_rate", label: "Spam Rate (%)" },
  { id: "callback_2h", label: "Callback Rate 2h (%)" },
  { id: "callback_24h", label: "Callback Rate 24h (%)" },
  { id: "duracion_media", label: "Average Duration (min)" },
  { id: "pct_colgadas", label: "Hang-up Rate (%)" }
]

const CHANNELS = [
  { id: "phone", label: "Phone" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
  { id: "slack", label: "Slack Support" }
]

export function CreateTestDialog({ children, open, onOpenChange, onTestCreated, phoneNumbers, userId }: CreateTestDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    alternative_name: '',
    hypothesis: '',
    objective: '',
    design: '',
    independent_variable: '',
    dependent_variables: [] as string[],
    duration_hours: 24,
    success_criteria: '',
    operational_notes: '',
    planned_start_date: '',
    channels: [] as string[],
    variants: [
      { id: 'A', label: '', sample_size: 100 },
      { id: 'B', label: '', sample_size: 100 }
    ],
    phone_numbers_used: [] as string[]
  })

  // Auto-generate test name
  const generateTestName = () => {
    const date = new Date().toISOString().split('T')[0]
    const variantLabels = formData.variants.map(v => v.label).filter(Boolean).join(' vs ')
    return `${formData.code || 'TEST'} | ${variantLabels || 'Variants'} | ${date}`
  }

  // Validate form
  const validateForm = (): string[] => {
    const newErrors: string[] = []

    if (!formData.code || formData.code.length < 2) {
      newErrors.push("Test code must be at least 2 characters")
    }

    if (!formData.hypothesis || formData.hypothesis.length < 20) {
      newErrors.push("Hypothesis must be at least 20 characters")
    }

    if (!formData.objective) {
      newErrors.push("Objective is required")
    }

    if (!formData.independent_variable) {
      newErrors.push("Independent variable is required")
    }

    if (formData.dependent_variables.length === 0) {
      newErrors.push("At least one dependent variable must be selected")
    }

    if (!formData.design || formData.design.length < 20) {
      newErrors.push("Experimental design must be at least 20 characters")
    }

    if (!formData.success_criteria || formData.success_criteria.length < 10) {
      newErrors.push("Success criteria must be at least 10 characters")
    }

    if (formData.duration_hours < 1 || formData.duration_hours > 72) {
      newErrors.push("Duration must be between 1 and 72 hours")
    }

    // Validate variants
    formData.variants.forEach((variant, index) => {
      if (!variant.label) {
        newErrors.push(`Variant ${variant.id} must have a label`)
      }
      if (variant.sample_size <= 0) {
        newErrors.push(`Variant ${variant.id} sample size must be greater than 0`)
      }
    })

    return newErrors
  }

  // Handle submit
  const handleSubmit = async () => {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setErrors([])

    try {
      const testName = generateTestName()
      
      // Prepare variants and sample sizes
      const variants = formData.variants.map(v => ({ id: v.id, label: v.label }))
      const samplePerVariant = formData.variants.reduce((acc, v) => {
        acc[v.id] = v.sample_size
        return acc
      }, {} as any)

      // Prepare phone numbers
      const selectedPhoneNumbers = phoneNumbers
        .filter(pn => formData.phone_numbers_used.includes(pn.id))
        .map(pn => ({ id: pn.id, number: pn.number }))

      const response = await fetch('/api/callops/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          name: testName,
          alternative_name: formData.alternative_name || null,
          hypothesis: formData.hypothesis,
          objective: formData.objective,
          design: formData.design,
          independent_variable: formData.independent_variable,
          dependent_variables: formData.dependent_variables,
          variants,
          sample_per_variant: samplePerVariant,
          duration_hours: formData.duration_hours,
          success_criteria: formData.success_criteria,
          operational_notes: formData.operational_notes || null,
          planned_start_date: formData.planned_start_date || null,
          channels: formData.channels,
          phone_numbers_used: selectedPhoneNumbers
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create test')
      }

      const { test } = await response.json()

      toast({
        title: "✅ Test Created",
        description: `Test ${test.full_id} has been created successfully`
      })

      onTestCreated(test)
      resetForm()
    } catch (error) {
      console.error('Error creating test:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create test',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      alternative_name: '',
      hypothesis: '',
      objective: '',
      design: '',
      independent_variable: '',
      dependent_variables: [],
      duration_hours: 24,
      success_criteria: '',
      operational_notes: '',
      planned_start_date: '',
      channels: [],
      variants: [
        { id: 'A', label: '', sample_size: 100 },
        { id: 'B', label: '', sample_size: 100 }
      ],
      phone_numbers_used: []
    })
    setErrors([])
  }

  // Add variant
  const addVariant = () => {
    const nextLetter = String.fromCharCode(65 + formData.variants.length)
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { id: nextLetter, label: '', sample_size: 100 }]
    }))
  }

  // Remove variant
  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm()
      onOpenChange(newOpen)
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Test</DialogTitle>
          <DialogDescription>
            Define the hypothesis and parameters of the experiment to ensure a measurable result.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Test Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., FM for Fixed vs Mobile"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternative_name">Alternative Name</Label>
                  <Input
                    id="alternative_name"
                    placeholder="Optional friendly name"
                    value={formData.alternative_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, alternative_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Auto-Generated Test Name</Label>
                <div className="p-3 bg-muted rounded-md font-mono text-sm">
                  {generateTestName()}
                </div>
              </div>
            </div>

            {/* Hypothesis and Objective */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Hypothesis & Objective</h3>
              
              <div className="space-y-2">
                <Label htmlFor="hypothesis">Hypothesis *</Label>
                <Textarea
                  id="hypothesis"
                  placeholder="e.g., Mobile numbers will have a higher answer rate than fixed numbers due to increased portability and personal use..."
                  value={formData.hypothesis}
                  onChange={(e) => setFormData(prev => ({ ...prev, hypothesis: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
                <div className="text-xs text-muted-foreground">
                  {formData.hypothesis.length}/20 characters minimum
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Measurable Objective *</Label>
                <Select
                  value={formData.objective}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, objective: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or enter custom objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_OBJECTIVES.map(obj => (
                      <SelectItem key={obj} value={obj}>{obj}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or enter custom objective..."
                  value={formData.objective}
                  onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                />
              </div>
            </div>

            {/* Variables */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Variables</h3>
              
              <div className="space-y-2">
                <Label htmlFor="independent_variable">Independent Variable *</Label>
                <Input
                  id="independent_variable"
                  placeholder="e.g., phone_number_type"
                  value={formData.independent_variable}
                  onChange={(e) => setFormData(prev => ({ ...prev, independent_variable: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Dependent Variables * (select at least one)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {DEPENDENT_VARIABLES.map(variable => (
                    <div key={variable.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={variable.id}
                        checked={formData.dependent_variables.includes(variable.id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            dependent_variables: checked
                              ? [...prev.dependent_variables, variable.id]
                              : prev.dependent_variables.filter(v => v !== variable.id)
                          }))
                        }}
                      />
                      <Label htmlFor={variable.id} className="text-sm font-normal cursor-pointer">
                        {variable.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Variants</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                  disabled={formData.variants.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              </div>

              <div className="space-y-3">
                {formData.variants.map((variant, index) => (
                  <div key={variant.id} className="flex items-end gap-3 p-3 border rounded-lg">
                    <div className="w-16">
                      <Label>ID</Label>
                      <Input value={variant.id} disabled className="text-center font-bold" />
                    </div>
                    <div className="flex-1">
                      <Label>Label *</Label>
                      <Input
                        placeholder={`e.g., ${index === 0 ? 'Mobile' : 'Fixed'}`}
                        value={variant.label}
                        onChange={(e) => {
                          const newVariants = [...formData.variants]
                          newVariants[index].label = e.target.value
                          setFormData(prev => ({ ...prev, variants: newVariants }))
                        }}
                      />
                    </div>
                    <div className="w-32">
                      <Label>Sample Size *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={variant.sample_size}
                        onChange={(e) => {
                          const newVariants = [...formData.variants]
                          newVariants[index].sample_size = parseInt(e.target.value) || 0
                          setFormData(prev => ({ ...prev, variants: newVariants }))
                        }}
                      />
                    </div>
                    {formData.variants.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Design */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Experimental Design</h3>
              
              <div className="space-y-2">
                <Label htmlFor="design">Design Description *</Label>
                <Textarea
                  id="design"
                  placeholder="Describe population, inclusion criteria, variant assignment, call scripts, cadence, limits per lead..."
                  value={formData.design}
                  onChange={(e) => setFormData(prev => ({ ...prev, design: e.target.value }))}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="success_criteria">Success Criteria *</Label>
                <Textarea
                  id="success_criteria"
                  placeholder="e.g., The variant wins if it achieves higher answer rate AND higher contact rate without increasing spam rate or hang-up rate. In case of tie, lowest average attempts wins."
                  value={formData.success_criteria}
                  onChange={(e) => setFormData(prev => ({ ...prev, success_criteria: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration_hours">Duration (hours) *</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    min={1}
                    max={72}
                    value={formData.duration_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 24 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="planned_start_date">Planned Start Date</Label>
                  <Input
                    id="planned_start_date"
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, planned_start_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Channels Involved</Label>
                <div className="grid grid-cols-2 gap-3">
                  {CHANNELS.map(channel => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`channel-${channel.id}`}
                        checked={formData.channels.includes(channel.id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            channels: checked
                              ? [...prev.channels, channel.id]
                              : prev.channels.filter(c => c !== channel.id)
                          }))
                        }}
                      />
                      <Label htmlFor={`channel-${channel.id}`} className="text-sm font-normal cursor-pointer">
                        {channel.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone Numbers Used</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {phoneNumbers.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No phone numbers available
                    </div>
                  ) : (
                    phoneNumbers.map(pn => (
                      <div key={pn.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`phone-${pn.id}`}
                          checked={formData.phone_numbers_used.includes(pn.id)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              phone_numbers_used: checked
                                ? [...prev.phone_numbers_used, pn.id]
                                : prev.phone_numbers_used.filter(id => id !== pn.id)
                            }))
                          }}
                        />
                        <Label htmlFor={`phone-${pn.id}`} className="text-sm font-normal cursor-pointer flex-1">
                          {pn.number} <span className="text-muted-foreground">({pn.provider})</span>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formData.phone_numbers_used.length} selected
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operational_notes">Operational Notes</Label>
                <Textarea
                  id="operational_notes"
                  placeholder="Any additional notes, constraints, or operational details..."
                  value={formData.operational_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, operational_notes: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
