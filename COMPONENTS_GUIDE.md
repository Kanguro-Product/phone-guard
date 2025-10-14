# 🧩 Components Guide - Phone Guard

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pages (Page Components)](#pages-page-components)
3. [Dashboard Components](#dashboard-components)
4. [Number Components](#number-components)
5. [CallOps Components](#callops-components)
6. [System Components](#system-components)
7. [Base UI Components](#base-ui-components)
8. [Custom Hooks](#custom-hooks)
9. [Best Practices](#best-practices)

---

## 🌐 Overview

The Phone Guard system uses:
- **React 18** with hooks
- **Next.js 14** App Router (Server and Client Components)
- **TypeScript** for type safety
- **Shadcn/ui** + Radix UI for base components
- **Tailwind CSS** for styling

### Conventions

```typescript
// ✅ Server Component (default)
export default function Page() {
  // Direct DB access, no hooks
}

// ✅ Client Component (when interactivity is needed)
'use client'
export function InteractiveComponent() {
  const [state, setState] = useState()
  // Hooks, events, state
}
```

---

## 📄 Pages (Page Components)

### 1. **Dashboard** (`app/dashboard/page.tsx` + `components/dashboard-page-client.tsx`)

**Server Component** (`page.tsx`):
```typescript
// Loads data from server
const { data: stats } = await supabase.from('phone_numbers').select('*')
```

**Client Component** (`dashboard-page-client.tsx`):
```typescript
interface DashboardPageClientProps {
  user: any
  stats: any
  phoneNumbers: any[]
  recentCalls: any[]
  weekCalls: any[]
}
```

**Features**:
- 📊 General statistics (DashboardStats)
- 📈 Reputation and call charts
- 🔔 Recent activity and alerts
- 💰 Cost calculator (tab)
- ♻️ Real-time updates
- 📚 Interactive tutorial

**Tabs**:
- `overview`: Overview with stats and charts
- `cost-calculator`: Cost calculator

---

### 2. **Numbers** (`app/numbers/page.tsx` + `components/numbers-page-client.tsx`)

**Props**:
```typescript
interface NumbersPageClientProps {
  user: any
  initialNumbers: PhoneNumber[]
}
```

**Features**:
- 📋 Numbers table with advanced filters
- ✅ Multiple selection (checkboxes)
- 🛡️ Individual and bulk SPAM validation
- 📁 List system (move, copy)
- 🔍 Search and filtering
- 📊 Column sorting
- 🎨 Visual states (active, spam, blocked, etc.)
- ♻️ Real-time updates

**Bulk Actions**:
- Validate SPAM in batch
- Move to list
- Delete selected
- Change status

---

### 3. **Calls** (`app/calls/page.tsx` + `components/calls-page-client.tsx`)

**Props**:
```typescript
interface CallsPageClientProps {
  user: any
  cadences: any[]
  calls: any[]
}
```

**Features**:
- 📞 Call simulator (CallSimulator)
- 📋 Logs table (CallLogsTable)
- 🔄 Real-time number rotation
- 📊 Call statistics
- ♻️ Real-time updates

**Components**:
- `CallSimulator`: Simulates calls and rotation
- `CallLogsTable`: Call history

---

### 4. **Cadences** (`app/cadences/page.tsx` + `components/cadences-page-client.tsx`)

**Props**:
```typescript
interface CadencesPageClientProps {
  user: any
  cadences: any[]
  phoneNumbers: any[]
}
```

**Features**:
- 📋 Cadences table
- ➕ Create/edit cadences
- 🔄 Rotation strategies (round_robin, random, reputation_based)
- 📞 Assign numbers to cadences
- 🎯 Strategy A/B testing

---

### 5. **CallOps Tracker** (`app/callops/page.tsx` + `components/callops/callops-tracker-page.tsx`)

**Props**:
```typescript
interface CallOpsTrackerPageProps {
  user: any
  initialTests: Test[]
  phoneNumbers: PhoneNumber[]
}
```

**Features**:
- 🧪 Complete A/B testing system
- 📊 Metrics and results
- ✅ Changes checklist
- 🔄 Test iterations
- 📈 Results dashboard

**Components**:
- `TestCard`: Test card with status
- `CreateTestDialog`: Create new test
- `TestDetailDialog`: Details and metrics
- `ReportMetricsDialog`: Report metrics

---

### 6. **Integrations** (`app/integrations/page.tsx` + `components/integrations-page-client.tsx`)

**Features**:
- 🔌 External integrations management
- 🔑 API keys configuration
- ✅ Connection testing
- 📊 Quota and usage
- 🔒 Security (no credential exposure)

**Supported Integrations**:
- ChatGPT / OpenAI
- Hiya
- Numverify
- TrueCaller (future)

---

### 7. **Admin Panel** (`app/admin/page.tsx` + `components/admin-page-client.tsx`)

**Props**:
```typescript
interface AdminPageClientProps {
  user: any
  allUsers: any[]
  systemStats: any[]
  recentLogs: any[]
  systemSettings: any[]
}
```

**Features**:
- 👥 User management
- ⚙️ System configuration
- 🌐 Hiya scraping
- 📋 Activity logs
- 📊 System statistics

**Tabs**:
- `overview`: General statistics
- `users`: User management
- `settings`: System settings
- `hiya`: Hiya scraping
- `logs`: Activity logs

**Restriction**: Only accessible for `role = 'admin'`

---

## 📊 Dashboard Components

### DashboardStats
Main statistics cards

```typescript
interface DashboardStatsProps {
  stats: {
    totalNumbers: number
    activeNumbers: number
    spamDetected: number
    avgReputation: number
  }
}
```

**Metrics**:
- Total numbers
- Active numbers
- SPAM detected
- Average reputation
- Daily/weekly calls

---

### ReputationChart
Reputation distribution chart

```typescript
interface ReputationChartProps {
  phoneNumbers: PhoneNumber[]
}
```

**Visualization**:
- Bar chart of reputation ranges
- 0-20, 21-40, 41-60, 61-80, 81-100

---

### CallsChart
Calls per day chart

```typescript
interface CallsChartProps {
  calls: Call[]
}
```

**Visualization**:
- Line chart of calls per day
- Success, failed, spam_detected

---

### RecentActivity
Recent activity feed

```typescript
interface RecentActivityProps {
  calls: Call[]
}
```

**Shows**:
- Last 10 calls
- Status with icons
- Relative timestamp

---

### SystemAlerts
System alerts

```typescript
interface SystemAlertsProps {
  phoneNumbers: PhoneNumber[]
  stats: any
}
```

**Alerts**:
- 🚨 SPAM detected
- ⚠️ Low reputation
- 📉 High failure rate
- 🔄 Pending rotation

---

## 📞 Number Components

### NumbersTable
Main numbers table with all functionalities

```typescript
interface NumbersTableProps {
  numbers: PhoneNumber[]
  selectedNumbers?: Set<string>
  onSelectionChange?: (selected: Set<string>) => void
  onDeleteNumber?: (id: string) => void
  onSelectAll?: () => void
  onBulkAction?: () => void
  user?: { id: string }
}
```

**Features**:
- ✅ Multiple selection
- 🔍 Filters by status, provider, list
- 📊 Column sorting
- 🛡️ Inline SPAM validation
- 📁 Bulk actions
- 🎨 Color coding by status
- 💡 Informative tooltips

**Columns**:
- Checkbox (selection)
- Number
- Provider
- Status (colored badge)
- Reputation (with icons)
- Calls (successful/failed)
- Actions (dropdown)

**Visual States**:
```typescript
const statusColors = {
  active: "bg-green-500",
  inactive: "bg-gray-500",
  blocked: "bg-red-500",
  spam: "bg-orange-500",
  deprecated: "bg-yellow-500"
}
```

---

### SpamValidationPanel
Individual SPAM validation panel

```typescript
interface SpamValidationPanelProps {
  phoneNumber: PhoneNumber
  onClose: () => void
  onValidationComplete: () => void
}
```

**Flow**:
1. Select APIs (Numverify, OpenAI, Hiya)
2. Click "Run SPAM Validation"
3. Show results from each provider
4. Show aggregated result
5. Update number in table

**Result**:
- 🤖 ChatGPT: AI analysis
- 📊 Numverify: Validation and enrichment
- 🛡️ Hiya: Reputation and spam

---

### BulkValidationDialog
Bulk validation dialog

```typescript
interface BulkValidationDialogProps {
  open: boolean
  onClose: () => void
  selectedNumbers: Set<string>
  onValidationComplete: () => void
}
```

**Process**:
1. Select APIs
2. Confirm numbers to validate
3. Execute validation (progress)
4. Show results summary

---

## 🧪 CallOps Components

### TestCard
Test card

```typescript
interface TestCardProps {
  test: Test
  onEdit: () => void
  onViewDetails: () => void
}
```

**Info Displayed**:
- Test key (T-003)
- Name and alternative name
- Status badge
- Variants (A/B/C)
- Dates (start, end)
- Progress

**States**:
- `Pending`: Gray
- `Running`: Blue (animated)
- `ToReport`: Orange
- `Finished`: Green
- `Canceled`: Red

---

### CreateTestDialog
Create test dialog

```typescript
interface CreateTestDialogProps {
  open: boolean
  onClose: () => void
  onTestCreated: (test: Test) => void
}
```

**Steps**:
1. Basic info (name, code, hypothesis)
2. Design (variants, sample, duration)
3. Configuration (variables, criteria)
4. Review and create

---

## ⚙️ System Components

### Navigation
Main navigation bar

```typescript
interface NavigationProps {
  user: any
}
```

**Links**:
- Dashboard
- Numbers
- Calls
- Cadences
- CallOps
- Integrations
- Admin (admin only)

**Features**:
- User menu (logout, settings)
- Dark/light mode toggle
- Active link highlighting

---

### RealtimeStatus
Real-time connection indicator

```typescript
interface RealtimeStatusProps {
  status: 'connected' | 'connecting' | 'disconnected'
  lastUpdate: Date | null
  onRefresh: () => void
}
```

**States**:
- 🟢 Connected: Green
- 🟡 Connecting: Yellow
- 🔴 Disconnected: Red

---

### HiyaScrapeButton
Hiya scraping button

**Features**:
- Preview mode (first row)
- Full scraping
- Rate limiting check
- Show progress
- Post-scraping statistics

---

## 🎨 Base UI Components (shadcn/ui)

### Basic Components

All based on Radix UI + Tailwind:

#### **Button**
```typescript
<Button variant="default|outline|ghost|destructive" size="sm|md|lg">
  Click me
</Button>
```

#### **Card**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### **Table**
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### **Dialog**
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

#### **Badge**
```typescript
<Badge variant="default|outline|destructive">
  Status
</Badge>
```

#### **Tabs**
```typescript
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Form Components

#### **Input**
```typescript
<Input 
  type="text" 
  placeholder="Enter text" 
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

#### **Select**
```typescript
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

#### **Checkbox**
```typescript
<Checkbox 
  checked={checked}
  onCheckedChange={setChecked}
/>
```

### Feedback Components

#### **Toast (Sonner)**
```typescript
import { toast } from "sonner"

toast.success("Success message")
toast.error("Error message")
toast.info("Info message")
```

#### **Alert**
```typescript
<Alert variant="default|destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>This is a warning</AlertDescription>
</Alert>
```

---

## 🔌 Custom Hooks

### usePhoneNumbersRealtime
Real-time updates for numbers

```typescript
const {
  data,              // PhoneNumber[]
  isConnected,       // boolean
  lastUpdate,        // Date | null
  refresh,           // () => void
  status             // 'connected' | 'connecting' | 'disconnected'
} = usePhoneNumbersRealtime()
```

**Usage**:
```typescript
useEffect(() => {
  if (data) {
    setNumbers(data)
  }
}, [data])
```

---

### useCallsRealtime
Real-time updates for calls

```typescript
const {
  data,
  isConnected,
  lastUpdate,
  refresh,
  status
} = useCallsRealtime()
```

---

### useTutorialContext
Interactive tutorial system

```typescript
const {
  shouldShowPageTutorial,  // (page: string) => boolean
  markPageVisited,         // (page: string) => void
  resetTutorial            // () => void
} = useTutorialContext()
```

**Usage**:
```typescript
const [showTutorial, setShowTutorial] = useState(false)

useEffect(() => {
  if (shouldShowPageTutorial("dashboard")) {
    setTimeout(() => setShowTutorial(true), 500)
  }
}, [shouldShowPageTutorial])

const handleCloseTutorial = () => {
  setShowTutorial(false)
  markPageVisited("dashboard")
}
```

---

### useToast
Toast notifications

```typescript
const { toast } = useToast()

toast({
  title: "Success",
  description: "Action completed",
  variant: "default"
})
```

---

## 🎯 Best Practices

### 1. Server vs Client Components

✅ **Use Server Components for**:
- Pages that only display data
- Components without interactivity
- Direct DB access
- Important SEO

✅ **Use Client Components for**:
- Hooks (useState, useEffect)
- Event handlers
- Browser APIs
- Real-time updates
- Interactive forms

---

### 2. Type Safety

```typescript
// ✅ Define clear interfaces
interface PhoneNumber {
  id: string
  number: string
  // ...
}

// ✅ Typed props
interface NumbersTableProps {
  numbers: PhoneNumber[]
  onDelete: (id: string) => void
}

// ❌ Avoid any
// ❌ Avoid unnecessary type assertions
```

---

### 3. State and Props

```typescript
// ✅ Prop drilling maximum 2 levels
<Parent>
  <Child prop={value} />
</Parent>

// ✅ Context for global state
const TutorialContext = createContext()

// ✅ Zustand/Redux for complex state (if needed)
```

---

### 4. Performance

```typescript
// ✅ Memoization when needed
const MemoizedComponent = memo(ExpensiveComponent)

// ✅ useMemo for expensive calculations
const filteredNumbers = useMemo(() => 
  numbers.filter(n => n.status === 'active'),
  [numbers]
)

// ✅ useCallback for functions in props
const handleDelete = useCallback((id: string) => {
  // ...
}, [dependency])
```

---

### 5. Error Handling

```typescript
// ✅ Try/catch in async functions
try {
  const response = await fetch('/api/...')
  if (!response.ok) throw new Error()
  const data = await response.json()
  // ...
} catch (error) {
  toast.error("Error occurred")
  console.error(error)
}

// ✅ Error boundaries for components
```

---

### 6. Accessibility

```typescript
// ✅ Labels in inputs
<Label htmlFor="number">Number</Label>
<Input id="number" />

// ✅ ARIA attributes
<button aria-label="Delete number">
  <Trash2 />
</button>

// ✅ Keyboard navigation
<Dialog onEscapeKeyDown={handleClose}>
```

---

### 7. Styling

```typescript
// ✅ Tailwind classes
<div className="flex items-center gap-4">

// ✅ Conditional classes with cn()
import { cn } from "@/lib/utils"

<div className={cn(
  "base-class",
  condition && "conditional-class",
  variant === "primary" && "primary-class"
)}>

// ❌ Avoid inline styles
// ❌ Avoid !important
```

---

### 8. Data Fetching

```typescript
// ✅ Server Components
const { data } = await supabase.from('table').select('*')

// ✅ Client Components (SWR or React Query)
const { data, error, mutate } = useSWR('/api/numbers', fetcher)

// ✅ Real-time
const { data } = usePhoneNumbersRealtime()
```

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/primitives)

---

**Last update**: October 2025  
**Version**: 1.0  
**Maintainer**: [Your name]
