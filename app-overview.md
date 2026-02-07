# Ledger CRM — Application Overview

## What It Is

Ledger CRM is an AI-powered lead generation and customer relationship management platform. It combines traditional CRM features (leads, contacts, deals) with AI-driven lead discovery, automation flows, and intelligent agent management. The frontend is fully built; the backend requires Supabase table creation and data wiring to go live.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Nuxt | 4.3.0 |
| UI Library | Vue | 3.5.27 |
| CSS | Tailwind CSS | 4.x (via `@tailwindcss/vite`) |
| Component Library | shadcn-vue (new-york style) | via `shadcn-nuxt` 2.4.3 |
| UI Primitives | reka-ui | 2.8.0 |
| Icons | lucide-vue-next | 0.563.0 |
| Toasts | vue-sonner | 2.0.9 |
| Table | @tanstack/vue-table | 8.21.3 |
| Backend | Supabase | via `@nuxtjs/supabase` 2.0.3 |
| Utilities | @vueuse/core | 14.2.0 |
| Font | Inter (Google Fonts) | 300-700 |

---

## Project Structure

```
ledger/
├── nuxt.config.ts              # Nuxt config — modules, Supabase, Tailwind, fonts
├── package.json                # Dependencies and scripts
├── app/
│   ├── app.vue                 # Root — wraps NuxtLayout + NuxtPage
│   ├── assets/css/tailwind.css # Tailwind base + OKLCH color tokens
│   ├── layouts/
│   │   └── default.vue         # SidebarProvider + SidebarInset + Toaster
│   ├── components/
│   │   ├── AppSidebar.vue      # Main navigation sidebar with collapse toggle + bug reporter
│   │   └── ui/                 # shadcn-vue components (auto-imported via shadcn-nuxt)
│   │       ├── sidebar/        # Sidebar primitives
│   │       ├── sonner/         # Toast component wrapper
│   │       ├── button/
│   │       ├── dialog/
│   │       ├── badge/
│   │       ├── input/
│   │       ├── select/
│   │       ├── tabs/
│   │       ├── textarea/
│   │       ├── avatar/
│   │       ├── card/
│   │       ├── dropdown-menu/
│   │       ├── tooltip/
│   │       └── table/
│   ├── composables/            # Business logic (10 composables)
│   │   ├── useLeads.ts         # Lead CRUD + stats + activity logging (Supabase)
│   │   ├── useContacts.ts      # Contact CRUD (Supabase)
│   │   ├── useDeals.ts         # Deal CRUD + pipeline stages + activity logging (Supabase)
│   │   ├── useFlows.ts         # Flow CRUD + nodes + connections + batch save (Supabase)
│   │   ├── useAgents.ts        # Agent CRUD + skills/tools attach/detach (Supabase)
│   │   ├── useActivities.ts    # Activity log read/create (Supabase)
│   │   ├── useDiscovery.ts     # Discovery campaigns + discovered leads + agent activities (MOCK)
│   │   ├── useSettings.ts      # App settings with API keys (localStorage)
│   │   ├── useBugReports.ts    # Bug reporting (Supabase with localStorage fallback)
│   │   └── useCrmNavigation.ts # Sidebar navigation structure (pure data)
│   ├── pages/                  # 12 page files
│   │   ├── index.vue           # Dashboard — stats, recent leads, agent status, campaigns
│   │   ├── leads.vue           # Lead management — table, CRUD, search/filter, messaging
│   │   ├── contacts.vue        # Contact directory — table, CRUD, tags, social links
│   │   ├── deals.vue           # Deal pipeline — Kanban + table views, drag-drop stages
│   │   ├── discovery.vue       # AI lead discovery — campaigns, review queue, agent activity
│   │   ├── agents.vue          # AI agent management — grid/detail views, skills, tools
│   │   ├── activity.vue        # Agent activity log — grouped by campaign, filters
│   │   ├── analytics.vue       # Analytics dashboard — pipeline, sources, conversions
│   │   ├── documents.vue       # Document library — upload, search, filter, types
│   │   ├── settings.vue        # Settings — 6 tabs (General, Integrations, Notifications, AI, Display, Outreach)
│   │   └── flows/
│   │       ├── index.vue       # Flow list — grid cards, CRUD, status toggle
│   │       └── [id].vue        # Flow builder — visual node editor, drag/drop, SVG connections
│   └── types/
│       └── database.types.ts   # Supabase DB types — 12 tables defined
```

---

## Navigation Structure

The sidebar organizes pages into 6 groups:

| Group | Pages | Route |
|-------|-------|-------|
| **Overview** | Dashboard | `/` |
| **Intelligence** | Discovery, Agents, Activity | `/discovery`, `/agents`, `/activity` |
| **CRM** | Leads, Contacts, Deals | `/leads`, `/contacts`, `/deals` |
| **Automation** | Flows | `/flows` |
| **Reports** | Analytics, Documents | `/analytics`, `/documents` |
| **System** | Settings | `/settings` |

---

## Feature Breakdown

### 1. Dashboard (`/`)
- Time-based greeting with current date
- 6 quick-action navigation cards
- 4 stat cards: Total Leads, Qualified, In Progress, Converted (from `useLeads` stats)
- Recent leads list with status badges
- Agent status panel showing running agents
- Campaign progress panel
- AI Discovery active banner with live agent activities
- **Data source**: `useLeads`, `useDeals`, `useDiscovery` (discovery parts are mock)

### 2. Leads (`/leads`)
- Full CRUD with dialog forms
- Search by name/email/company
- Filter by status (new, contacted, qualified, converted, lost) and source
- Sortable columns (name, created_at, value, score)
- AI message generation buttons (LinkedIn + Email) with clipboard copy
- Auto-creates activity records on lead creation and status changes
- **Data source**: `useLeads` (Supabase — `leads` table)

### 3. Contacts (`/contacts`)
- Full CRUD with dialog forms
- Search by name/email/company, filter by company
- Avatar with initials, social media links (LinkedIn, Twitter)
- Tags system with badge display
- **Data source**: `useContacts` (Supabase — `contacts` table)

### 4. Deals (`/deals`)
- Dual view: Kanban board + sortable table
- 6 pipeline stages: Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost
- Drag-and-drop between stages (Kanban) with auto activity logging
- Deal value, probability, expected close date
- Stage-colored progress indicators
- **Data source**: `useDeals` (Supabase — `deals` table)

### 5. Discovery (`/discovery`)
- Campaign management: create campaigns with ICP targeting criteria
- Campaign detail view: leads found, approved, rejected; agent activities
- Review queue: lead cards with confidence scores, AI summaries, signals
- Approve/reject workflow for discovered leads
- Agent activity timeline grouped by campaign
- **Data source**: `useDiscovery` (ALL MOCK DATA — no Supabase)

### 6. Agents (`/agents`)
- Grid view with agent cards (name, status, skill/tool counts)
- Detail view with two-column layout:
  - Left: config form (name, description, status), skills list
  - Right: tools list, action buttons
- Attach/detach skills and tools to agents
- Test agent button, assign to campaign link
- **Data source**: `useAgents` (Supabase — `agents`, `agent_skills`, `agent_tools`, `skills`, `tools` tables)

### 7. Activity (`/activity`)
- Agent activity monitoring dashboard
- Stats: Total Actions, Active Agents, Success Rate, Running Campaigns
- Search + filter by agent, action, status, campaign
- Activities grouped by campaign (collapsible sections)
- Status indicators: running (pulsing), completed, error
- **Data source**: `useDiscovery` (MOCK DATA — `agentActivities`)

### 8. Analytics (`/analytics`)
- Overview stats: Total Leads, Pipeline Value, Conversion Rate, Active Campaigns
- Period selector (7d, 30d, 90d, All)
- Pipeline breakdown by stage with progress bars
- Lead sources analysis
- Lead status distribution with percentages
- Discovery campaign performance table
- Recent activity log
- **Data source**: `useLeads`, `useDeals`, `useActivities`, `useDiscovery` (mix of real + mock)

### 9. Documents (`/documents`)
- Document library with search and filters (type, status)
- Document types: Proposal, Contract, Invoice, Report, Template
- Statuses: Draft, Sent, Signed, Expired
- Upload dialog, view/download/edit/delete actions
- Stats cards: Total, Signed, Drafts
- **Data source**: ALL MOCK DATA (hardcoded in page, no composable, no table)

### 10. Flows (`/flows`)
- **List page** (`/flows`): Grid of flow cards with status badges, search, status filter
- Create flow dialog with trigger type selection (manual, lead_created, deal_stage_changed, contact_added, scheduled, webhook)
- Duplicate, activate/deactivate, delete flows
- **Builder page** (`/flows/[id]`): Visual node-based workflow editor
  - 8 node types: Trigger, Action, Condition, Delay, Email, SMS, Filter, Webhook
  - Drag-and-drop from palette to canvas
  - SVG connection drawing between node ports
  - Pan/zoom controls, inline label editing
  - Batch save (nodes + connections)
- **Data source**: `useFlows` (Supabase — `flows`, `flow_nodes`, `flow_connections` tables)

### 11. Settings (`/settings`)
- 6 tabs organized into:
  - **General**: Company name, timezone, date format, currency
  - **Integrations**: AI provider (OpenAI/Anthropic), API keys with show/hide toggle, model selection
  - **Notifications**: Email alerts, desktop notifications, activity digest frequency
  - **AI & Discovery**: Confidence threshold slider, auto-approve toggle, max concurrent campaigns
  - **Display**: Default page size, compact mode, show animations
  - **Outreach**: Default message tone, signature settings
- Reset to defaults button
- **Data source**: `useSettings` (localStorage only — key: `ledger-crm-settings`)

### 12. Bug Reporter (Sidebar)
- Bug icon in sidebar footer
- Dialog with auto-captured page context (URL, viewport)
- Title + description fields
- Submits to Supabase `bug_reports` table (falls back to localStorage)
- **Data source**: `useBugReports` (Supabase with localStorage fallback)

---

## Data Flow & Dependencies

### Composable → Supabase Table Mapping

| Composable | Tables Used | Status |
|------------|------------|--------|
| `useLeads` | `leads`, `activities` | Tables exist in types |
| `useContacts` | `contacts` | Table exists in types |
| `useDeals` | `deals`, `activities` | Tables exist in types |
| `useFlows` | `flows`, `flow_nodes`, `flow_connections` | Tables exist in types |
| `useAgents` | `agents`, `agent_skills`, `agent_tools`, `skills`, `tools` | Tables exist in types |
| `useActivities` | `activities` | Table exists in types |
| `useDiscovery` | None (mock) | **Needs: `discovery_campaigns`, `discovered_leads`, `agent_activities`** |
| `useSettings` | None (localStorage) | No DB needed |
| `useBugReports` | `bug_reports` | **Not in types — needs table creation** |
| `useCrmNavigation` | None | Pure data, no DB needed |

### Cross-Composable Dependencies

```
Dashboard (index.vue)
  ├── useLeads → stats (total, qualified, in_progress, converted)
  ├── useDeals → pipeline value
  └── useDiscovery → active campaigns, discovered/pending/approved counts, agent activities

Analytics (analytics.vue)
  ├── useLeads → lead stats, sources, status distribution
  ├── useDeals → pipeline breakdown by stage
  ├── useActivities → recent activity log
  └── useDiscovery → campaign performance

Activity (activity.vue)
  └── useDiscovery → agentActivities (grouped by campaign)

Discovery (discovery.vue)
  └── useDiscovery → campaigns, discoveredLeads, agentActivities

useLeads → useActivities (auto-logs on create/status change)
useDeals → useActivities (auto-logs on create/stage change)
```

---

## What Uses Real Data vs Mock Data

### Real Data (Supabase)
- Leads (full CRUD)
- Contacts (full CRUD)
- Deals (full CRUD)
- Flows (full CRUD including nodes and connections)
- Agents (full CRUD including skill/tool attachments)
- Activities (read/create)

### Mock Data (In-Memory / Hardcoded)
- **Discovery** — campaigns, discovered leads, agent activities are all in-memory mock data in `useDiscovery.ts`
- **Documents** — entirely hardcoded mock data inside `documents.vue`, no composable or table
- **Activity page** — reads from `useDiscovery.agentActivities` (mock)
- **Analytics** — partially mock (discovery campaign stats from mock, rest is real)
- **Dashboard** — discovery stats and agent activities are mock

### localStorage Only
- **Settings** — all user preferences stored client-side
- **Bug Reports** — fallback when Supabase table doesn't exist

---

## Authentication

**No authentication system exists.** The sidebar shows a hardcoded user ("User" / "user@example.com"). Supabase redirect is disabled in `nuxt.config.ts`. No RLS policies are referenced. All data is accessible without auth.

---

## What Is Missing for Production

1. **Database tables not created** — The 12 tables in `database.types.ts` need to be created in Supabase. Plus 4 additional tables needed: `discovery_campaigns`, `discovered_leads`, `agent_activities`, `bug_reports`.

2. **Discovery system is entirely mock** — `useDiscovery.ts` uses `seedMockData()` with hardcoded campaigns, leads, and agent activities. This needs to be converted to real Supabase CRUD.

3. **Documents page has no backend** — No composable, no table, no storage. Everything is hardcoded in the page template.

4. **No authentication** — No user login, no session management, no RLS policies.

5. **No server API routes** — All database access is direct client-side Supabase calls. For security (especially API keys), server routes may be needed.

6. **Settings stored client-side only** — API keys for OpenAI/Anthropic are in localStorage (not encrypted). For production, these should be stored server-side.

7. **No seed data for skills/tools** — The agents page expects `skills` and `tools` table data to exist. These need seed records.

8. **Activity page depends on mock data** — Uses `useDiscovery.agentActivities` which is mock. Needs real `agent_activities` table.

9. **No error boundaries** — No global error handling or error pages.

10. **No environment variables documented** — Supabase URL and anon key need to be set but there's no `.env.example`.

---

## Design System

- **Font**: Inter (300-700 weights)
- **Colors**: OKLCH color system defined in `tailwind.css`
- **Page headers**: `text-2xl font-bold tracking-tight` + `text-muted-foreground` subtitle
- **Section headers**: `text-lg font-semibold`
- **Cards**: `rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow`
- **No gradients** anywhere in the UI
- **No translateY hover effects**
- **Consistent toast notifications** on all CRUD operations across every page
