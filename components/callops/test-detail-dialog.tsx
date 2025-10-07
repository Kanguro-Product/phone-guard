"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"

interface Test {
  id: string
  test_key: string
  code: string
  full_id: string
  name: string
  alternative_name?: string
  hypothesis: string
  objective: string
  design: string
  variants: any[]
  sample_per_variant: any
  duration_hours: number
  status: string
  created_at: string
  started_at?: string
  ended_at?: string
  parent_test_key?: string
  iteration_index: number
  success_criteria: string
  independent_variable: string
  dependent_variables: any[]
  planned_start_date?: string
  channels: any[]
  operational_notes?: string
  phone_numbers_used: any[]
}

interface TestDetailDialogProps {
  children: React.ReactNode
  test: Test
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TestDetailDialog({ children, test, open, onOpenChange }: TestDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{test.alternative_name || test.name}</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {test.full_id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="iterations">Iterations</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            {/* Configuration Tab */}
            <TabsContent value="config" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Test Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Test Key:</span>
                      <span className="ml-2 font-mono">{test.test_key}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Code:</span>
                      <span className="ml-2"><Badge variant="secondary">{test.code}</Badge></span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2">{test.duration_hours} hours</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2"><Badge>{test.status}</Badge></span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2">{format(new Date(test.created_at), 'PPp')}</span>
                    </div>
                    {test.started_at && (
                      <div>
                        <span className="text-muted-foreground">Started:</span>
                        <span className="ml-2">{format(new Date(test.started_at), 'PPp')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Hypothesis</h3>
                  <p className="text-sm text-muted-foreground">{test.hypothesis}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Objective</h3>
                  <p className="text-sm text-muted-foreground">{test.objective}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Variables</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Independent:</span>
                      <span className="ml-2 text-muted-foreground">{test.independent_variable}</span>
                    </div>
                    <div>
                      <span className="font-medium">Dependent:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {test.dependent_variables.map((v: string) => (
                          <Badge key={v} variant="outline">{v}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Variants</h3>
                  <div className="space-y-2">
                    {test.variants.map((variant: any) => (
                      <div key={variant.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">Variant {variant.id}:</span>
                          <span className="ml-2">{variant.label}</span>
                        </div>
                        <Badge variant="secondary">
                          Sample: {test.sample_per_variant[variant.id]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Experimental Design</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{test.design}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Success Criteria</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{test.success_criteria}</p>
                </div>

                {test.phone_numbers_used && test.phone_numbers_used.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Phone Numbers Used ({test.phone_numbers_used.length})</h3>
                      <div className="flex flex-wrap gap-2">
                        {test.phone_numbers_used.map((pn: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="font-mono">
                            {pn.number}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {test.channels && test.channels.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Channels</h3>
                      <div className="flex flex-wrap gap-2">
                        {test.channels.map((channel: string) => (
                          <Badge key={channel} variant="secondary">{channel}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {test.operational_notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Operational Notes</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{test.operational_notes}</p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4 mt-4">
              <div className="text-center py-12 text-muted-foreground">
                Metrics data will be displayed here after reporting
              </div>
            </TabsContent>

            {/* Iterations Tab */}
            <TabsContent value="iterations" className="space-y-4 mt-4">
              <div className="text-center py-12 text-muted-foreground">
                {test.iteration_index === 0 
                  ? "This is the base test. Iterations will appear here once created."
                  : `This is iteration ${test.iteration_index}. Parent test: ${test.parent_test_key}`
                }
              </div>
            </TabsContent>

            {/* Audit Tab */}
            <TabsContent value="audit" className="space-y-4 mt-4">
              <div className="text-center py-12 text-muted-foreground">
                Audit log will be displayed here
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
