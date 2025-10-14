# 📱 Phone Guard - Complete Developer Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Installation & Setup](#installation--setup)
6. [Database](#database)
7. [APIs & Routes](#apis--routes)
8. [Main Components](#main-components)
9. [Workflows](#workflows)
10. [External Integrations](#external-integrations)
11. [Security](#security)
12. [Testing & QA](#testing--qa)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)

---

## 📖 Overview

**Phone Guard** is a comprehensive phone number management and protection platform designed for sales teams and operations. The system allows:

- 📞 **Phone Number Management**: Complete lifecycle control
- 🛡️ **SPAM Detection**: Multi-provider validation including AI (ChatGPT)
- 🔄 **Smart Rotation**: Optimization strategies for campaigns
- 📊 **Reputation Monitoring**: Real-time reputation tracking
- 🧪 **A/B Testing (CallOps)**: Complete experimentation system with metrics
- 🌐 **Hiya Scraping**: Automatic reputation data extraction
- 📈 **Analytics**: Detailed dashboard with statistics
- 👥 **Multi-user**: Role and permission system (admin, manager, user)
- 🔌 **Integrations**: APIs to connect with external systems

### Main Use Cases

1. **Sales Teams**: Manage multiple numbers for outbound campaigns
2. **Call Centers**: Rotate numbers to avoid spam blocking
3. **Marketing**: A/B test numbers across different channels
4. **Compliance**: Continuous reputation monitoring and alerts

---

## 🏗️ System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │ Numbers  │  │ CallOps  │  │  Admin  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│              API ROUTES (Next.js App Router)            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ /api/numbers │  │ /api/callops │  │ /api/validate │ │
│  │ /api/calls   │  │ /api/hiya-*  │  │ /api/rotation │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Supabase │  │Browserless│  │ ChatGPT  │  │  Hiya   │ │
│  │   (DB)   │  │(Scraping) │  │   (AI)   │  │  (API)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Architectural Patterns

1. **Server Components (Next.js 14)**: Server-side rendering by default
2. **Client Components**: Only when interactivity is needed
3. **API Routes**: Business logic and external calls
4. **Real-time Updates**: Supabase Realtime for live updates
5. **Row Level Security (RLS)**: Database-level security
6. **Middleware**: Authentication and session management

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14.2.16 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Themes**: next-themes (dark/light mode)
- **Notifications**: Sonner (toast)

### Backend
- **Runtime**: Node.js (Vercel Serverless)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Supabase Client
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (if needed)
- **Real-time**: Supabase Realtime

### Scraping & Automation
- **Browser Automation**: Puppeteer Core 24.23.0
- **Headless Browser**: Browserless.io (cloud service)
- **Scraping Target**: Hiya Dashboard

### AI & Validation
- **ChatGPT**: OpenAI API (spam validation)
- **Numverify**: Number validation
- **TrueCaller**: Number reputation
- **Hiya API**: Spam data

### DevOps & Hosting
- **Hosting**: Vercel
- **CI/CD**: Vercel Git Integration
- **Monitoring**: Vercel Analytics
- **Env Management**: Vercel Environment Variables

### Languages
- **TypeScript**: 100% of code
- **SQL**: Migrations and DB functions

---

## 📁 Project Structure

```
phone-guard/
│
├── 📂 app/                          # Next.js App Router
│   ├── 📂 api/                      # API Routes
│   │   ├── bulk-validate/           # Bulk validation
│   │   ├── call-stats/              # Call statistics
│   │   ├── callops/                 # CallOps tracker
│   │   ├── hiya-scrape/             # Hiya scraping
│   │   ├── hiya-upload/             # Upload numbers to Hiya
│   │   ├── integrations/            # External integrations
│   │   ├── log-call/                # Call logging
│   │   ├── number-lists/            # List management
│   │   ├── numbers/                 # Number CRUD
│   │   ├── rotation/                # Number rotation
│   │   ├── spam-context/            # Spam context
│   │   └── validate-spam/           # Individual validation
│   │
│   ├── 📂 auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── callback/
│   │   ├── sign-up/
│   │   └── error/
│   │
│   ├── 📂 dashboard/                # Main dashboard
│   ├── 📂 numbers/                  # Number management
│   ├── 📂 calls/                    # Call history
│   ├── 📂 cadences/                 # A/B cadences
│   ├── 📂 callops/                  # CallOps tracker
│   ├── 📂 integrations/             # Integrations
│   ├── 📂 admin/                    # Admin panel
│   │
│   ├── layout.tsx                   # Main layout
│   ├── page.tsx                     # Home page
│   └── globals.css                  # Global styles
│
├── 📂 components/                   # React Components
│   ├── 📂 ui/                       # Base components (shadcn)
│   ├── 📂 callops/                  # CallOps components
│   ├── 📂 tutorial/                 # Tutorial system
│   │
│   ├── numbers-table.tsx            # Numbers table
│   ├── calls-chart.tsx              # Call charts
│   ├── spam-validation-panel.tsx    # Validation panel
│   ├── hiya-scrape-button.tsx       # Hiya scraping
│   └── ... (30+ components)
│
├── 📂 lib/                          # Libraries & utilities
│   ├── 📂 supabase/                 # Supabase client
│   │   ├── client.ts                # Frontend client
│   │   ├── server.ts                # Backend client
│   │   └── middleware.ts            # Auth middleware
│   │
│   ├── call-rotation.ts             # Rotation logic
│   ├── rotation-service.ts          # Rotation service
│   ├── spam-validation.ts           # Spam validation
│   └── utils.ts                     # General utilities
│
├── 📂 hooks/                        # Custom React Hooks
│   ├── use-realtime-updates.ts      # Real-time updates
│   ├── use-tutorial.ts              # Tutorial system
│   └── use-toast.ts                 # Notifications
│
├── 📂 scripts/                      # SQL migrations
│   ├── 001_create_tables.sql        # Base tables
│   ├── 004_add_user_roles.sql       # Role system
│   ├── 041_create_callops_tracker.sql
│   ├── 044_create_hiya_scraping_tables.sql
│   └── ... (48 SQL scripts)
│
├── 📂 public/                       # Static assets
│   ├── logo.svg
│   └── placeholder-*.{jpg,svg}
│
├── 📂 styles/                       # Additional styles
│
├── 📄 middleware.ts                 # Next.js middleware
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 package.json                  # Dependencies
├── 📄 next.config.mjs               # Next.js config
├── 📄 tailwind.config.ts            # Tailwind config
│
├── 📄 README_DEV.md                 # 👈 This documentation
├── 📄 QUICK_START_HIYA.md           # Hiya quick start
├── 📄 HIYA_IMPLEMENTATION.md        # Hiya implementation
├── 📄 HIYA_SELECTOR_GUIDE.md        # CSS selectors
├── 📄 ENV_SETUP.md                  # Environment variables
└── 📄 CHATGPT_UI_DESIGN.md          # ChatGPT UI design
```

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js**: v18+ 
- **pnpm**: v8+ (package manager)
- **Supabase Account**: PostgreSQL database
- **Vercel Account**: Hosting (optional, can use local)
- **Browserless Account**: For Hiya scraping (optional)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd phone-guard
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create `.env.local` in root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Browserless (Hiya scraping)
BROWSERLESS_URL=wss://production-sfo.browserless.io?token=YOUR_TOKEN

# Hiya Credentials
HIYA_EMAIL=your_email@hiya.com
HIYA_PASSWORD=your_password

# Hiya URLs (optional, have defaults)
HIYA_LOGIN_URL=https://www.hiya.com/login
HIYA_TRACKED_URL=https://dashboard.hiya.com/tracked

# Limits
MAX_PER_RUN=200
RATE_LIMIT_MINUTES=5

# ChatGPT (if implemented)
OPENAI_API_KEY=your_openai_key

# Other services
NUMVERIFY_API_KEY=your_numverify_key
TRUECALLER_API_KEY=your_truecaller_key
```

> ⚠️ **IMPORTANT**: Never commit `.env.local` to repository

### 4. Configure Database (Supabase)

#### a) Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and API Keys

#### b) Run Migrations
Go to Supabase → SQL Editor and execute scripts in order:

```sql
-- 1. Base tables
scripts/001_create_tables.sql

-- 2. Helper functions
scripts/002_create_functions.sql

-- 3. Role system
scripts/004_add_user_roles.sql

-- 4. Integrations
scripts/007_create_integrations.sql

-- 5. Enrichment
scripts/010_alter_phone_numbers_enrichment.sql
scripts/011_add_score_columns.sql

-- 6. Real-time
scripts/012_enable_realtime.sql

-- 7. Number lists
scripts/017_add_number_lists_clean.sql

-- 8. CallOps Tracker
scripts/041_create_callops_tracker.sql

-- 9. Hiya Scraping
scripts/044_create_hiya_scraping_tables.sql
scripts/045_add_hiya_columns_to_phone_numbers.sql

-- 10. Seed data (optional)
scripts/003_seed_data.sql
```

> 💡 **Tip**: Review scripts to understand structure before executing

### 5. Create Admin User

Run in Supabase SQL Editor:

```sql
-- Replace with your actual email
INSERT INTO user_profiles (user_id, email, role, full_name)
SELECT id, email, 'admin'::user_role, 'Admin User'
FROM auth.users
WHERE email = 'your_email@example.com';
```

### 6. Run in Development

```bash
pnpm dev
```

The app will be at: `http://localhost:3000`

### 7. Login and Test

1. Go to `/auth/login`
2. Login with your Supabase account
3. You should see the dashboard
4. Test creating a number at `/numbers`

---

## 🗄️ Database

See complete documentation at: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

### Main Tables

#### 1. **users** - System users
```sql
- id: UUID (PK, ref auth.users)
- email: TEXT
- role: TEXT (admin|user)
- created_at, updated_at: TIMESTAMPTZ
```

#### 2. **user_profiles** - Extended profiles
```sql
- id: UUID (PK)
- user_id: UUID (FK → auth.users)
- email: TEXT (unique)
- full_name: TEXT
- role: user_role (admin|manager|user)
- is_active: BOOLEAN
- created_at, updated_at: TIMESTAMPTZ
```

#### 3. **phone_numbers** - Phone numbers with enrichment
```sql
- id: UUID (PK)
- number: TEXT (unique, E.164)
- provider: TEXT
- status: TEXT (active|inactive|blocked|spam)
- reputation_score: INTEGER (0-100)
- spam_reports: INTEGER
- successful_calls, failed_calls: INTEGER
- user_id: UUID (FK → users)
- enrichment_data: JSONB
- hiya_label, hiya_score, hiya_is_spam: TEXT|NUMERIC|BOOLEAN
```

#### 4. **calls** - Call logs
```sql
- id: UUID (PK)
- phone_number_id: UUID (FK → phone_numbers)
- cadence_id: UUID (FK → cadences)
- destination_number: TEXT
- status: TEXT (success|failed|busy|no_answer|spam_detected)
- duration: INTEGER (seconds)
- cost: DECIMAL
- call_time: TIMESTAMPTZ
- metadata: JSONB
```

#### 5. **cadences** - A/B Testing cadences
```sql
- id: UUID (PK)
- name, description: TEXT
- phone_numbers: UUID[] (array of IDs)
- rotation_strategy: TEXT (round_robin|random|reputation_based)
- is_active: BOOLEAN
- user_id: UUID (FK → users)
```

### Relationships

```
users (1) ──→ (N) phone_numbers
users (1) ──→ (N) cadences
users (1) ──→ (N) calls
users (1) ──→ (N) number_lists
users (1) ──→ (N) integrations
users (1) ──→ (N) tests

phone_numbers (1) ──→ (N) calls
cadences (1) ──→ (N) calls
tests (1) ──→ (N) test_metrics

number_lists (N) ←→ (N) phone_numbers (via number_list_items)
```

---

## 🚀 APIs & Routes

See complete documentation at: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Authentication

| Method | Route | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/sign-up` | User registration |
| GET | `/auth/callback` | OAuth callback |
| POST | `/auth/logout` | Logout |

### Phone Numbers

| Method | Route | Description |
|--------|------|-------------|
| GET | `/api/numbers` | List user's numbers |
| POST | `/api/numbers` | Create new number |
| PATCH | `/api/numbers/[id]` | Update number |
| DELETE | `/api/numbers/[id]` | Delete number |
| GET | `/api/get-next-number` | Get next number (rotation) |

### SPAM Validation

| Method | Route | Description |
|--------|------|-------------|
| POST | `/api/validate-spam` | Validate individual number |
| POST | `/api/bulk-validate` | Validate multiple numbers |
| GET | `/api/spam-context` | Get spam context |

### Hiya Scraping

| Method | Route | Description |
|--------|------|-------------|
| POST | `/api/hiya-scrape` | Execute scraping |
| POST | `/api/hiya-upload` | Upload numbers to Hiya |
| GET | `/api/debug-browserless` | Debug connection |

---

## 🧩 Main Components

See complete documentation at: [COMPONENTS_GUIDE.md](./COMPONENTS_GUIDE.md)

### Pages (Page Components)

- **Dashboard** (`dashboard-page-client.tsx`)
- **Numbers** (`numbers-page-client.tsx`)
- **Calls** (`calls-page-client.tsx`)
- **Cadences** (`cadences-page-client.tsx`)
- **CallOps** (`callops-tracker-page.tsx`)
- **Integrations** (`integrations-page-client.tsx`)
- **Admin** (`admin-page-client.tsx`)

### Key Components

- `NumbersTable`: Main numbers table
- `SpamValidationPanel`: SPAM validation panel
- `CallSimulator`: Call simulator
- `TestCard`: CallOps test card
- `HiyaScrapeButton`: Hiya scraping button
- `Navigation`: Main navigation bar
- `RealtimeStatus`: Real-time connection indicator

---

## 🔄 Workflows

See complete documentation at: [SETUP_AND_WORKFLOWS.md](./SETUP_AND_WORKFLOWS.md)

### 1. SPAM Validation Flow

```mermaid
graph TD
    A[User selects number] --> B[Click "Validate SPAM"]
    B --> C[POST /api/validate-spam]
    C --> D{Providers}
    D --> E[ChatGPT AI]
    D --> F[Hiya]
    D --> G[Numverify]
    E --> H[Aggregate results]
    F --> H
    G --> H
    H --> I[Calculate final score]
    I --> J[Update database]
    J --> K[Show results in UI]
```

### 2. Hiya Scraping Flow

```mermaid
graph TD
    A[Admin click "Refresh Hiya"] --> B{Rate limit OK?}
    B -->|No| C[Show remaining time]
    B -->|Yes| D[POST /api/hiya-scrape]
    D --> E[Connect Browserless]
    E --> F[Login to Hiya]
    F --> G[Navigate to tracked numbers]
    G --> H[Extract data with CSS selectors]
    H --> I{More pages?}
    I -->|Yes| H
    I -->|No| J[Process data]
    J --> K[Detect spam by keywords]
    K --> L[Upsert in hiya_numbers]
    L --> M[Log in hiya_runs]
    M --> N[Close browser]
    N --> O[Show statistics]
```

---

## 🔌 External Integrations

See complete documentation at: [SETUP_AND_WORKFLOWS.md](./SETUP_AND_WORKFLOWS.md)

### 1. Supabase

**Purpose**: PostgreSQL database, Auth, Real-time

**Services Used**:
- PostgreSQL Database
- Supabase Auth (email/password, OAuth)
- Real-time subscriptions
- Edge Functions (optional)

### 2. Browserless

**Purpose**: Cloud headless browser for web scraping

**Endpoints**:
```bash
# US West (recommended for Americas)
wss://production-sfo.browserless.io?token=XXX

# UK (Europe)
wss://production-lon.browserless.io?token=XXX

# Amsterdam (Europe)
wss://production-ams.browserless.io?token=XXX
```

### 3. OpenAI (ChatGPT)

**Purpose**: Intelligent SPAM analysis with AI

**Model**: GPT-4 (configurable to GPT-3.5)

**Cost**: ~$0.01 per validation

### 4. Numverify

**Purpose**: Phone number validation and enrichment

**Data Returned**:
- Number validity
- Carrier (operator)
- Line type (mobile, landline)
- Country, location

### 5. Hiya

**Purpose**: Reputation and spam data

**Access Methods**:
- Web Scraping (implemented)
- Official API (if available - future)

---

## 🔐 Security

### Authentication

**Method**: Supabase Auth with JWT

**Flow**:
1. User login → Supabase generates JWT
2. JWT stored in httpOnly cookie
3. Middleware verifies JWT on each request
4. RLS policies filter data by user_id

### Row Level Security (RLS)

**All tables** have RLS enabled:

```sql
-- Example: phone_numbers
CREATE POLICY "phone_numbers_select_own" 
  ON phone_numbers FOR SELECT 
  USING (auth.uid() = user_id);
```

### Roles and Permissions

**Roles**:
- `admin`: Full access, admin panel
- `manager`: Team management, reports
- `user`: Basic access to own data

### Environment Variables

**Never in client**:
- `SUPABASE_SERVICE_ROLE_KEY`
- `BROWSERLESS_URL`
- `HIYA_EMAIL`, `HIYA_PASSWORD`
- `OPENAI_API_KEY`

**Public** (prefix `NEXT_PUBLIC_`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🧪 Testing & QA

### Manual Testing

**Checklist before deploy**:

- [ ] Login works correctly
- [ ] Can create number from UI
- [ ] SPAM validation (all providers)
- [ ] Hiya scraping (preview and full)
- [ ] Number rotation
- [ ] Create CallOps test
- [ ] Report metrics
- [ ] Admin panel (admin only)
- [ ] Dark/light mode
- [ ] Responsive (mobile, tablet, desktop)

---

## 🚀 Deployment

### Vercel (Recommended)

#### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Framework: Next.js (auto-detected)

#### 2. Configure Variables

In Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BROWSERLESS_URL
HIYA_EMAIL
HIYA_PASSWORD
MAX_PER_RUN
RATE_LIMIT_MINUTES
```

**Apply to**: Production, Preview, Development

#### 3. Deploy

```bash
git add .
git commit -m "feat: ready for production"
git push origin main
```

Vercel automatically deploys.

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to connect to Browserless"

**Cause**: Incorrect URL or invalid token

**Solution**:
- Verify `BROWSERLESS_URL` in Vercel
- Use regional endpoint: `wss://production-sfo.browserless.io?token=XXX`
- DO NOT use `chrome.browserless.io` (obsolete)

#### 2. "Supabase RLS: Row not found"

**Cause**: RLS policies blocking access

**Solution**:
```sql
-- Verify policies
SELECT * FROM pg_policies 
WHERE tablename = 'phone_numbers';

-- Debug: Temporarily disable RLS (dev only)
ALTER TABLE phone_numbers DISABLE ROW LEVEL SECURITY;
```

#### 3. "User not authenticated"

**Cause**: Expired session or cookie not sent

**Solution**:
- Verify middleware.ts is configured
- Clear browser cookies
- Re-login

---

## 📚 Additional Resources

### Internal Documentation

- [QUICK_START_HIYA.md](./QUICK_START_HIYA.md) - Hiya quick start
- [HIYA_IMPLEMENTATION.md](./HIYA_IMPLEMENTATION.md) - Technical implementation
- [HIYA_SELECTOR_GUIDE.md](./HIYA_SELECTOR_GUIDE.md) - Adjust selectors
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables
- [CHATGPT_UI_DESIGN.md](./CHATGPT_UI_DESIGN.md) - UI design

### External Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/primitives)
- [shadcn/ui](https://ui.shadcn.com)
- [Puppeteer](https://pptr.dev)
- [Browserless](https://www.browserless.io/docs)

---

## 🎯 Roadmap & TODOs

### Implemented ✅
- [x] Authentication system
- [x] Phone number management
- [x] Multi-provider SPAM validation
- [x] Hiya scraping
- [x] CallOps Tracker (A/B testing)
- [x] List system
- [x] Analytics dashboard
- [x] Admin panel
- [x] Interactive tutorial
- [x] Dark mode
- [x] Real-time updates

### In Development 🚧
- [ ] Credentials encryption in DB
- [ ] API rate limiting
- [ ] Webhook notifications
- [ ] CSV/PDF export
- [ ] Automated tests

### Future 🔮
- [ ] Direct integration with call APIs (Twilio, etc.)
- [ ] Machine Learning for spam prediction
- [ ] Mobile application
- [ ] Webhooks for integrations
- [ ] Multi-language (i18n)
- [ ] Improved onboarding

---

## 👥 Contributing

### Development Setup

1. Fork the repository
2. Create a branch: `git checkout -b feature/new-feature`
3. Make commits: `git commit -m 'feat: add X'`
4. Push: `git push origin feature/new-feature`
5. Open a Pull Request

### Conventions

**Commits**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Maintenance tasks

**Code**:
- Strict TypeScript
- ESLint + Prettier
- Functional components with hooks
- Server Components by default, Client only when necessary

---

## 📞 Support

**Technical issues**: Open an issue on GitHub

**Questions**: Check documentation first

**Bugs**: Include:
- Problem description
- Steps to reproduce
- Relevant logs
- Screenshots (if applicable)

---

## 📝 License

[Your license here]

---

## 🙏 Acknowledgments

- Next.js team
- Supabase team
- shadcn for UI components
- Open source community

---

**Last update**: October 2025

**System version**: 1.0.0

**Maintainers**: [Your name/team]
