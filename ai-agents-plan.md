# Ledger CRM — AI Agents & Lead Generation Architecture Plan

> **This is the heart of Ledger.** Everything in this document describes how campaigns spawn autonomous AI agents that discover, enrich, qualify, and deliver real leads into your CRM pipeline.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Decisions](#2-technology-decisions)
3. [System Architecture](#3-system-architecture)
4. [Agent Execution Engine](#4-agent-execution-engine)
5. [Agent Types & Skills](#5-agent-types--skills)
6. [Tool System (MCP Servers)](#6-tool-system-mcp-servers)
7. [Data Sources & APIs](#7-data-sources--apis)
8. [Database Schema](#8-database-schema)
9. [Campaign Lifecycle](#9-campaign-lifecycle)
10. [Real-Time Updates](#10-real-time-updates)
11. [Security & Compliance](#11-security--compliance)
12. [Cost Projections](#12-cost-projections)
13. [Implementation Phases](#13-implementation-phases)
14. [File Structure](#14-file-structure)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        NUXT 4 FRONTEND                          │
│  discovery.vue │ agents.vue │ campaigns │ leads │ analytics     │
│                                                                  │
│  Supabase Realtime ──► Live activity feed, lead cards, progress │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP / SSE
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     NITRO SERVER (API LAYER)                     │
│  /api/campaigns/[id]/start.post.ts                              │
│  /api/campaigns/[id]/stop.post.ts                               │
│  /api/agents/run.post.ts                                         │
│  /api/inngest.ts  (Inngest webhook receiver)                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │ Events
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    INNGEST (ORCHESTRATION)                       │
│  Durable step functions · Retry · Concurrency · Rate limiting   │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Discovery   │  │ Enrichment   │  │ Qualification          │  │
│  │ Agent Fn    │  │ Agent Fn     │  │ Agent Fn               │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────────────┘  │
│         │                │                    │                   │
│         ▼                ▼                    ▼                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              VERCEL AI SDK (LLM Layer)                   │    │
│  │  anthropic("claude-sonnet-4-20250514") + tools + maxSteps      │    │
│  └──────────────────────────┬───────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              TOOL FUNCTIONS                              │    │
│  │  Apollo API │ Hunter.io │ Firecrawl │ Google Places      │    │
│  │  PDL │ ZeroBounce │ SEC EDGAR │ Crawlee │ Jina Reader    │    │
│  └──────────────────────────────────────────────────────────┘    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      SUPABASE (DATA LAYER)                      │
│  discovered_leads │ agent_runs │ agent_steps │ campaign_metrics │
│  Realtime channels → push updates to frontend                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Decisions

### Frameworks Evaluated

| Framework | Language | TypeScript | Verdict |
|-----------|----------|------------|---------|
| **LangGraph** | Python/TS | Good (secondary) | Powerful graph-based workflows, but adds LangChain dependency |
| **CrewAI** | Python | None | Multi-agent orchestration, but Python-only — language mismatch |
| **AutoGen** | Python | None | Multi-agent conversations, but Python-only and API unstable |
| **Vercel AI SDK** | TypeScript | Native | Clean tool calling, streaming, `maxSteps` agent loop |
| **Raw Anthropic SDK** | TypeScript | Native | Full control, no abstractions |

### Decision: Vercel AI SDK + Inngest

**LLM Layer → Vercel AI SDK (`ai` + `@ai-sdk/anthropic`)**

- TypeScript-native, shares types with the Nuxt frontend
- `generateText()` with `maxSteps` handles the agent loop automatically
- `onStepFinish` callback logs each action to Supabase in real-time
- `tool()` with Zod schemas for type-safe tool definitions
- Provider-agnostic: swap between Claude and GPT without code changes

**Orchestration → Inngest**

- No infrastructure to manage (no Redis, no separate worker process)
- Step-based durable execution: each step is independently retried and checkpointed
- `step.waitForEvent()` pauses agents waiting for user approval
- Built-in concurrency limiting, rate limiting, throttling, debouncing
- Serves from existing Nitro API routes (single deployment)
- `step.sleep()` for timed delays between actions
- Event-driven: one agent's output can trigger another agent

**Why not the others:**

- **CrewAI / AutoGen**: Python-only. Would require a separate microservice, separate codebase, and language boundary. Too much friction for a TypeScript project.
- **LangGraph**: Good TypeScript support but adds the LangChain dependency layer. The graph-based model is more complex than needed for our workflows. The same patterns can be achieved with Inngest step functions + AI SDK.
- **Temporal**: Best durability guarantees, but requires a Temporal server cluster. Overkill for our scale; Inngest provides sufficient durability with less operational burden.
- **BullMQ**: Good but requires Redis and manual state management. No step-level checkpointing.
- **Trigger.dev**: Strong alternative to Inngest, purpose-built for AI. Consider if Inngest limitations surface.

---

## 3. System Architecture

### Deployment Model

```
Single Deployment (Nuxt 4 on Vercel/Railway/Fly.io)
├── Frontend (Vue 3 SSR/SPA)
├── Nitro API Routes
│   ├── /api/campaigns/** (CRUD)
│   ├── /api/agents/**    (management)
│   └── /api/inngest      (webhook receiver)
└── Inngest Cloud (calls your /api/inngest endpoint)
    └── Agent functions execute as durable step functions
```

### Dependencies to Add

```json
{
  "dependencies": {
    "ai": "^4.x",
    "@ai-sdk/anthropic": "^1.x",
    "@ai-sdk/openai": "^1.x",
    "inngest": "^3.x",
    "zod": "^3.x",
    "@mendable/firecrawl-js": "^1.x",
    "crawlee": "^3.x",
    "playwright": "^1.x"
  }
}
```

### Environment Variables

```env
# LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Lead Data APIs
APOLLO_API_KEY=...
HUNTER_API_KEY=...
PDL_API_KEY=...
ZEROBOUNCE_API_KEY=...
FIRECRAWL_API_KEY=...
GOOGLE_MAPS_API_KEY=...

# Supabase (already configured)
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_KEY=...  # Server-side only, for agent writes
```

---

## 4. Agent Execution Engine

### How an Agent Run Works

```
1. User clicks "Start Campaign" → POST /api/campaigns/[id]/start
2. API route sends Inngest event: { name: "campaign/started", data: { campaignId } }
3. Inngest picks up the event, runs the durable function
4. Function executes as a series of steps:

   step.run("load-campaign")     → Fetch campaign config from Supabase
   step.run("select-agents")     → Determine which agent types to run
   step.run("run-discovery")     → AI SDK agent loop (search + scrape)
   step.run("run-enrichment")    → AI SDK agent loop (enrich each lead)
   step.run("run-qualification") → AI SDK agent loop (score + rank)
   step.run("finalize")          → Update campaign status, send notification

5. Each step's output is persisted by Inngest
6. If step 3 fails → only step 3 retries (steps 1-2 are not re-executed)
7. Each step writes progress to Supabase → frontend sees updates via Realtime
```

### Core Agent Function (Inngest)

```typescript
// server/agents/campaign-runner.ts

import { inngest } from "../inngest/client";
import { generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { serverSupabaseServiceRole } from "#supabase/server";

export const runCampaign = inngest.createFunction(
  {
    id: "run-campaign",
    concurrency: [{ limit: 5 }],          // Max 5 campaigns running at once
    retries: 3,
  },
  { event: "campaign/started" },
  async ({ event, step }) => {
    const campaignId = event.data.campaignId;
    const supabase = serverSupabaseServiceRole();

    // Step 1: Load campaign configuration
    const campaign = await step.run("load-campaign", async () => {
      const { data } = await supabase
        .from("discovery_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      await supabase
        .from("discovery_campaigns")
        .update({ status: "running" })
        .eq("id", campaignId);

      return data;
    });

    // Step 2: Discovery — find companies and people
    const rawLeads = await step.run("discover-leads", async () => {
      return await runDiscoveryAgent(campaign, supabase);
    });

    // Step 3: Enrichment — gather detailed info on each lead
    const enrichedLeads = await step.run("enrich-leads", async () => {
      return await runEnrichmentAgent(rawLeads, campaign, supabase);
    });

    // Step 4: Qualification — score and rank
    const qualifiedLeads = await step.run("qualify-leads", async () => {
      return await runQualificationAgent(enrichedLeads, campaign, supabase);
    });

    // Step 5: Save results and update campaign
    await step.run("finalize", async () => {
      await supabase
        .from("discovery_campaigns")
        .update({
          status: "completed",
          leads_found: qualifiedLeads.length,
        })
        .eq("id", campaignId);
    });

    return { leadsFound: qualifiedLeads.length };
  }
);
```

### Individual Agent (AI SDK with Tools)

```typescript
// server/agents/discovery-agent.ts

async function runDiscoveryAgent(campaign, supabase) {
  const result = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    maxSteps: 20,
    system: `You are a lead discovery agent for a B2B CRM.
Your job is to find real people who match the campaign criteria.
Use the available tools to search for companies, scrape websites,
and find contact information. Save each lead as you find it.

Campaign criteria:
- Industry: ${campaign.target_industry}
- Roles: ${campaign.target_roles}
- Company Size: ${campaign.target_company_size}
- Region: ${campaign.target_region}
- Search Criteria: ${campaign.search_criteria}
- Minimum Confidence: ${campaign.confidence_threshold}%

Find at least 10 qualified leads. Be thorough and methodical.`,

    tools: {
      searchCompanies: tool({
        description: "Search for companies matching industry and criteria",
        parameters: z.object({
          query: z.string().describe("Search query for companies"),
          industry: z.string().optional(),
          location: z.string().optional(),
        }),
        execute: async ({ query, industry, location }) => {
          // Calls Apollo.io or Google Places
          return await apolloCompanySearch({ query, industry, location });
        },
      }),

      scrapeWebsite: tool({
        description: "Extract company/team info from a website URL",
        parameters: z.object({
          url: z.string().url().describe("The website URL to scrape"),
        }),
        execute: async ({ url }) => {
          // Calls Firecrawl for clean extraction
          return await firecrawlScrape(url);
        },
      }),

      findEmail: tool({
        description: "Find email address for a person at a company",
        parameters: z.object({
          firstName: z.string(),
          lastName: z.string(),
          domain: z.string().describe("Company domain (e.g., acme.com)"),
        }),
        execute: async ({ firstName, lastName, domain }) => {
          // Calls Hunter.io
          return await hunterEmailFinder({ firstName, lastName, domain });
        },
      }),

      saveLead: tool({
        description: "Save a discovered lead to the database",
        parameters: z.object({
          name: z.string(),
          company: z.string(),
          position: z.string(),
          email: z.string().optional(),
          linkedin_url: z.string().optional(),
          confidence_score: z.number().min(0).max(100),
          discovery_source: z.string(),
          ai_summary: z.string().describe("Why this person is a good lead"),
          signals: z.array(z.string()).describe("Discovery signals"),
        }),
        execute: async (lead) => {
          const { error } = await supabase
            .from("discovered_leads")
            .insert({
              ...lead,
              campaign_id: campaign.id,
              status: "pending_review",
            });
          if (error) return `Error saving: ${error.message}`;

          // Log activity
          await supabase.from("agent_activities").insert({
            campaign_id: campaign.id,
            action: "lead_discovered",
            detail: `Found ${lead.name} at ${lead.company}`,
            status: "completed",
          });

          return `Lead saved: ${lead.name} at ${lead.company}`;
        },
      }),
    },

    onStepFinish: async ({ toolCalls, toolResults }) => {
      // Log each tool call as an agent activity (real-time via Supabase)
      if (toolCalls) {
        for (const call of toolCalls) {
          await supabase.from("agent_activities").insert({
            campaign_id: campaign.id,
            action: `tool:${call.toolName}`,
            detail: JSON.stringify(call.args),
            status: "completed",
          });
        }
      }
    },
  });

  return result;
}
```

---

## 5. Agent Types & Skills

### Agent Types

| Agent | Purpose | Tools Used | Output |
|-------|---------|------------|--------|
| **Discovery Agent** | Find companies and people matching ICP | Apollo Search, Google Places, Firecrawl, Jina Reader | Raw lead records |
| **Enrichment Agent** | Add details to raw leads | PDL Enrich, Hunter.io, Crunchbase, SEC EDGAR | Enriched lead records |
| **Qualification Agent** | Score, rank, filter leads | LLM analysis (no external tools) | Scored leads with AI summaries |
| **Outreach Agent** | Draft personalized messages | LLM generation, company website analysis | Email/LinkedIn drafts |
| **Research Agent** | Deep-dive on a specific company/person | Firecrawl, Jina, SEC EDGAR, Crunchbase, web search | Research report |

### Skills System

Skills are reusable capabilities that agents use. Each skill maps to one or more tools:

| Skill | Description | Underlying Tools |
|-------|-------------|-----------------|
| **Company Search** | Find companies by industry, size, location | Apollo API, Google Places API |
| **Contact Finding** | Find people at a specific company | Apollo People Search, PDL Person API |
| **Email Discovery** | Find and verify email addresses | Hunter.io, ZeroBounce |
| **Website Intelligence** | Extract structured data from company websites | Firecrawl, Jina Reader |
| **Web Scraping** | Custom scraping of directories and listings | Crawlee + Playwright |
| **Financial Intel** | Company financials, funding, revenue | Crunchbase API, SEC EDGAR |
| **Lead Scoring** | AI-powered ICP fit analysis | Claude/GPT analysis |
| **Outreach Drafting** | Personalized email/LinkedIn messages | Claude/GPT generation |
| **Data Enrichment** | Augment lead records with additional data | PDL, Clearbit, Apollo Enrich |
| **Email Verification** | Validate email deliverability | ZeroBounce, NeverBounce |

### How Users Configure Agents

Users create agents in `agents.vue` by:
1. Naming the agent and describing its purpose
2. Selecting which skills it has access to
3. Selecting which tools back those skills
4. Setting parameters (model, max steps, confidence threshold)
5. Assigning the agent to campaigns

When a campaign runs, it uses the assigned agents with their configured skills/tools.

---

## 6. Tool System (MCP Servers)

### Future MCP Integration

While the MVP uses direct tool functions within the AI SDK, the architecture is designed so tools can be migrated to MCP servers as the platform scales:

```
Phase 1 (MVP): Tools are TypeScript functions in server/tools/
Phase 2 (Scale): Tools become MCP servers, accessed via MCP client

Benefits of Phase 2:
- Tools are reusable across agents AND interactive AI features
- Tools can run as independent services (microservices)
- Standardized discovery (tools/list) and execution (tools/call)
- OAuth 2.1 authentication between services
```

### Tool Functions (Phase 1)

```
server/
  tools/
    apollo.ts          → searchCompanies(), enrichPerson(), enrichCompany()
    hunter.ts          → findEmail(), verifyEmail(), domainSearch()
    pdl.ts             → enrichPerson(), searchPeople(), searchCompanies()
    firecrawl.ts       → scrapeUrl(), crawlSite(), extractStructured()
    jina.ts            → readUrl(), searchWeb()
    zerobounce.ts      → verifyEmail(), batchVerify()
    google-places.ts   → searchPlaces(), placeDetails()
    sec-edgar.ts       → searchFilings(), companyFacts()
    crunchbase.ts      → searchOrganizations(), getCompany()
    crawlee.ts         → crawlDirectory(), scrapeListings()
```

Each tool function:
- Handles API authentication (keys from env vars)
- Implements rate limiting (respect provider limits)
- Returns structured data (typed with Zod)
- Logs usage for billing/monitoring
- Handles errors gracefully with retry logic

---

## 7. Data Sources & APIs

### Tier 1 — Core (MVP Launch)

| Service | Purpose | Pricing | Free Tier |
|---------|---------|---------|-----------|
| **Apollo.io** | Company & contact search, enrichment | Free: 10K records/mo; Basic: $49/mo | 10,000 records/mo |
| **Hunter.io** | Email finding & verification | Starter: $34/mo (500 finds) | 25 searches/mo |
| **People Data Labs** | Person & company enrichment API | Self-serve: $0.04-0.10/record | 100 free records |
| **ZeroBounce** | Email verification | $16/2,000 credits | 2,000 free (one-time) |
| **Firecrawl** | Website scraping & extraction | Hobby: $16/mo (3,000 pages) | 500 credits |
| **Jina Reader** | URL to markdown conversion | $0.01/page | 1,000/day free |
| **Google Places** | Local business search | $32/1,000 searches | $200/mo free credit |
| **SEC EDGAR** | Public company filings | Free | Unlimited |

**Estimated MVP cost: ~$115–215/month** (enough for hundreds of leads/month)

### Tier 2 — Scale (Growth Phase)

| Service | Purpose | When to Add |
|---------|---------|-------------|
| **Crunchbase** | Funding data, investor intel | When targeting funded startups |
| **RocketReach** | Backup contact finding | When Hunter.io hits limits |
| **Bright Data** | Proxy infrastructure for scraping | When scraping targets start blocking |
| **NeverBounce** | Backup email verification | For bulk verification at scale |
| **Clearbit (HubSpot)** | Premium enrichment | Enterprise customers |
| **ZoomInfo** | Highest-quality B2B data | Enterprise tier ($15K+/yr) |

### API Integration Pattern

```typescript
// server/tools/apollo.ts
import { z } from "zod";

const ApolloCompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  website_url: z.string().nullable(),
  industry: z.string().nullable(),
  estimated_num_employees: z.number().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  short_description: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  founded_year: z.number().nullable(),
});

export async function searchCompanies(params: {
  query: string;
  industry?: string;
  location?: string;
  employeeRange?: string;
}) {
  const res = await fetch("https://api.apollo.io/v1/mixed_companies/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.APOLLO_API_KEY!,
    },
    body: JSON.stringify({
      q_organization_keyword_tags: [params.query],
      organization_industry_tag_ids: params.industry
        ? [params.industry]
        : undefined,
      organization_locations: params.location
        ? [params.location]
        : undefined,
      organization_num_employees_ranges: params.employeeRange
        ? [params.employeeRange]
        : undefined,
      per_page: 25,
    }),
  });

  const data = await res.json();
  return data.organizations?.map((org: any) =>
    ApolloCompanySchema.parse(org)
  ) ?? [];
}

export async function searchPeople(params: {
  organizationId?: string;
  titles?: string[];
  domain?: string;
}) {
  const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.APOLLO_API_KEY!,
    },
    body: JSON.stringify({
      organization_ids: params.organizationId
        ? [params.organizationId]
        : undefined,
      person_titles: params.titles,
      q_organization_domains: params.domain,
      per_page: 25,
    }),
  });

  const data = await res.json();
  return data.people ?? [];
}
```

---

## 8. Database Schema

### New Tables for Agent System

```sql
-- Agent run tracking (one row per campaign execution)
CREATE TABLE agent_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES discovery_campaigns(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,                    -- 'discovery', 'enrichment', 'qualification'
  status TEXT DEFAULT 'pending',               -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  inngest_run_id TEXT,                         -- Inngest function run ID for tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER,
  leads_found INTEGER DEFAULT 0,
  leads_enriched INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  error_message TEXT,
  llm_tokens_used INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  cost_estimate_cents INTEGER DEFAULT 0,       -- Estimated cost in cents
  metadata JSONB DEFAULT '{}',                 -- Flexible storage for run config
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detailed step log for each agent action
CREATE TABLE agent_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES discovery_campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  tool_name TEXT NOT NULL,                     -- 'searchCompanies', 'scrapeWebsite', etc.
  tool_input JSONB,                            -- Arguments passed to the tool
  tool_output JSONB,                           -- Result from the tool
  status TEXT DEFAULT 'running',               -- 'running', 'completed', 'failed', 'skipped'
  duration_ms INTEGER,                         -- How long the step took
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign metrics (aggregated stats)
CREATE TABLE campaign_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES discovery_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  leads_discovered INTEGER DEFAULT 0,
  leads_enriched INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  leads_approved INTEGER DEFAULT 0,
  leads_rejected INTEGER DEFAULT 0,
  emails_found INTEGER DEFAULT 0,
  emails_verified INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  llm_tokens INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

-- API usage tracking (for billing and rate limiting)
CREATE TABLE api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,                      -- 'apollo', 'hunter', 'firecrawl', etc.
  endpoint TEXT NOT NULL,                      -- '/v1/mixed_companies/search', etc.
  campaign_id UUID REFERENCES discovery_campaigns(id),
  run_id UUID REFERENCES agent_runs(id),
  credits_used INTEGER DEFAULT 1,
  response_status INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_agent_runs_campaign ON agent_runs(campaign_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_steps_run ON agent_steps(run_id);
CREATE INDEX idx_agent_steps_campaign ON agent_steps(campaign_id);
CREATE INDEX idx_campaign_metrics_campaign ON campaign_metrics(campaign_id);
CREATE INDEX idx_api_usage_provider ON api_usage(provider);
CREATE INDEX idx_api_usage_campaign ON api_usage(campaign_id);
```

### Updated `discovery_campaigns` Columns

```sql
ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS
  agent_config JSONB DEFAULT '{}';            -- Which agents/skills/tools to use

ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS
  schedule_cron TEXT;                          -- Optional: recurring schedule

ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS
  max_leads_per_run INTEGER DEFAULT 50;

ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS
  total_runs INTEGER DEFAULT 0;

ALTER TABLE discovery_campaigns ADD COLUMN IF NOT EXISTS
  last_run_at TIMESTAMPTZ;
```

---

## 9. Campaign Lifecycle

### State Machine

```
                  ┌──────────┐
                  │  draft   │ ← User creates campaign, configures ICP
                  └────┬─────┘
                       │ User clicks "Start"
                       ▼
                  ┌──────────┐
            ┌─────│ running  │ ← Inngest function executing
            │     └────┬─────┘
            │          │
            │     ┌────┴─────┐
            │     ▼          ▼
       ┌─────────┐    ┌───────────┐
       │ paused  │    │ completed │ ← All steps finished
       └────┬────┘    └───────────┘
            │
            │ User clicks "Resume"
            ▼
       ┌──────────┐
       │ running  │ ← Resumes from last checkpoint
       └──────────┘

  At any point:
  - User can "Stop" → status = 'paused'
  - Error occurs → status = 'failed' (auto-retry up to 3x)
  - User can "Restart" a failed/completed campaign → new run
```

### API Routes

```typescript
// server/api/campaigns/[id]/start.post.ts
export default defineEventHandler(async (event) => {
  const campaignId = getRouterParam(event, "id");
  const supabase = await serverSupabaseServiceRole(event);

  // Validate campaign exists and is startable
  const { data: campaign } = await supabase
    .from("discovery_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) throw createError({ statusCode: 404 });
  if (campaign.status === "running") {
    throw createError({ statusCode: 400, message: "Campaign already running" });
  }

  // Create agent run record
  const { data: run } = await supabase
    .from("agent_runs")
    .insert({
      campaign_id: campaignId,
      agent_type: "full_pipeline",
      status: "pending",
    })
    .select()
    .single();

  // Send event to Inngest
  await inngest.send({
    name: "campaign/started",
    data: {
      campaignId,
      runId: run.id,
    },
  });

  return { success: true, runId: run.id };
});
```

---

## 10. Real-Time Updates

### Supabase Realtime Channels

The frontend subscribes to Supabase Realtime to receive live updates as agents work:

```typescript
// app/composables/useCampaignLive.ts

export function useCampaignLive(campaignId: string) {
  const supabase = useSupabaseClient();
  const activities = ref([]);
  const leads = ref([]);
  const runStatus = ref("idle");

  onMounted(() => {
    // Listen for new agent activities
    const activityChannel = supabase
      .channel(`campaign-activities-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_steps",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          activities.value.unshift(payload.new);
        }
      )
      .subscribe();

    // Listen for new discovered leads
    const leadsChannel = supabase
      .channel(`campaign-leads-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "discovered_leads",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          leads.value.unshift(payload.new);
        }
      )
      .subscribe();

    // Listen for run status changes
    const runChannel = supabase
      .channel(`campaign-run-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agent_runs",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          runStatus.value = payload.new.status;
        }
      )
      .subscribe();

    onUnmounted(() => {
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(leadsChannel);
      supabase.removeChannel(runChannel);
    });
  });

  return { activities, leads, runStatus };
}
```

### What Users See in Real-Time

In `discovery.vue`, when a campaign is running:

1. **Activity Feed** updates live with each agent action:
   - "Searching for SaaS companies in North America..."
   - "Scraping https://acme.com/about for team info..."
   - "Found John Doe, CTO at Acme Corp (confidence: 87%)"
   - "Verifying email j.doe@acme.com..."

2. **Lead Cards** appear in real-time as agents discover them

3. **Progress Bar** updates (steps_completed / steps_total)

4. **Metrics** update live (leads found, emails verified, etc.)

---

## 11. Security & Compliance

### API Key Security

- All API keys stored in environment variables (never client-side)
- Supabase service role key used only in server-side agent code
- User-facing settings page stores display-only masked versions in localStorage
- Actual keys for the agent system come from env vars on the server

### Data Compliance

| Requirement | Implementation |
|-------------|---------------|
| **GDPR** | Opt-out mechanism for discovered leads; data retention policies; right to deletion |
| **CAN-SPAM** | Outreach drafts include required elements (unsubscribe, physical address) |
| **LinkedIn ToS** | Never scrape LinkedIn directly; use compliant providers (Apollo, PDL) |
| **Google Places ToS** | Don't cache data > 30 days; display attribution |
| **Rate Limiting** | Respect all API provider rate limits via per-tool throttling |

### Agent Guardrails

```typescript
// Prevent agents from harmful actions
const AGENT_GUARDRAILS = {
  maxStepsPerRun: 50,              // Hard limit on LLM round-trips
  maxLeadsPerRun: 100,             // Cap leads per run
  maxApiCallsPerRun: 500,          // Cap external API calls
  maxCostPerRunCents: 5000,        // $50 max per run
  blockedDomains: [                // Never scrape these
    "linkedin.com",
    "facebook.com",
    "twitter.com",
  ],
  requiredEmailVerification: true, // Always verify before saving
};
```

---

## 12. Cost Projections

### Per-Campaign Run Estimate

| Component | Usage | Cost |
|-----------|-------|------|
| Claude Sonnet (AI SDK) | ~10K input + 5K output tokens | ~$0.10 |
| Apollo search | 5 searches × 25 results | ~$0.50 (from free quota) |
| Firecrawl scraping | 20 pages | ~$0.11 |
| Hunter.io email finds | 15 lookups | ~$1.02 |
| ZeroBounce verification | 15 verifications | ~$0.12 |
| Jina Reader | 10 reads | ~$0.10 |
| **Total per run** | | **~$1.95** |

### Monthly Projections

| Scale | Campaigns/mo | Leads/mo | Monthly Cost |
|-------|-------------|----------|-------------|
| **Starter** | 10 | 100-200 | ~$20 + API subscriptions ($115) = **~$135** |
| **Growth** | 50 | 500-1,000 | ~$100 + API subscriptions ($250) = **~$350** |
| **Scale** | 200 | 2,000-5,000 | ~$400 + API subscriptions ($500) = **~$900** |

---

## 13. Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

**Goal:** Single-agent discovery pipeline that finds real leads

- [ ] Install dependencies (`ai`, `@ai-sdk/anthropic`, `inngest`, `zod`)
- [ ] Set up Inngest client and API route (`/api/inngest`)
- [ ] Create `server/tools/apollo.ts` (company + people search)
- [ ] Create `server/tools/firecrawl.ts` (website scraping)
- [ ] Create `server/tools/hunter.ts` (email finding)
- [ ] Create `server/tools/zerobounce.ts` (email verification)
- [ ] Create `server/agents/discovery-agent.ts` (AI SDK agent loop)
- [ ] Create `server/agents/campaign-runner.ts` (Inngest durable function)
- [ ] Create API routes: start, stop, status
- [ ] Run database migrations (agent_runs, agent_steps, campaign_metrics, api_usage)
- [ ] Update `database.types.ts` with new tables
- [ ] Test: create campaign → start → watch leads appear in Supabase

### Phase 2: Real-Time & UI

**Goal:** Live updates in the frontend as agents work

- [ ] Create `useCampaignLive` composable (Supabase Realtime)
- [ ] Update `discovery.vue` with live activity feed
- [ ] Update `discovery.vue` with live lead cards
- [ ] Add campaign run history and details view
- [ ] Add agent step viewer (see what the agent did at each step)
- [ ] Add cost tracking display (API usage tab)

### Phase 3: Enrichment & Qualification

**Goal:** Multi-stage pipeline with enrichment and scoring

- [ ] Create `server/tools/pdl.ts` (People Data Labs enrichment)
- [ ] Create `server/tools/jina.ts` (URL reader, web search)
- [ ] Create `server/agents/enrichment-agent.ts`
- [ ] Create `server/agents/qualification-agent.ts`
- [ ] Update campaign runner to chain all three agents
- [ ] Add enrichment data display to lead detail view

### Phase 4: Agent Configuration

**Goal:** Users configure agents with custom skills and tools

- [ ] Update `agents.vue` to save agent configs to Supabase
- [ ] Create agent-skill-tool assignment UI
- [ ] Campaign creation selects which agents to use
- [ ] Dynamic tool loading based on agent config
- [ ] Agent templates (pre-configured for common use cases)

### Phase 5: Advanced Features

**Goal:** Scheduling, multi-agent, and outreach

- [ ] Scheduled campaigns (cron via Inngest)
- [ ] Multi-agent parallel execution (fan-out pattern)
- [ ] Outreach agent (draft personalized emails)
- [ ] Research agent (deep-dive on a company/person)
- [ ] Lead-to-CRM pipeline (auto-create contacts/deals from approved leads)
- [ ] Analytics dashboard with agent performance metrics
- [ ] MCP server migration (optional: expose tools as MCP servers)

---

## 14. File Structure

```
server/
├── inngest/
│   ├── client.ts              → Inngest client initialization
│   └── functions/
│       ├── campaign-runner.ts  → Main campaign orchestration function
│       ├── scheduled-run.ts    → Cron-triggered campaign function
│       └── lead-enrichment.ts  → On-demand single-lead enrichment
│
├── agents/
│   ├── discovery-agent.ts     → AI SDK agent: find companies + people
│   ├── enrichment-agent.ts    → AI SDK agent: enrich lead records
│   ├── qualification-agent.ts → AI SDK agent: score + rank + summarize
│   ├── outreach-agent.ts      → AI SDK agent: draft messages
│   └── research-agent.ts      → AI SDK agent: deep company research
│
├── tools/
│   ├── apollo.ts              → Apollo.io API (search, enrich)
│   ├── hunter.ts              → Hunter.io API (email find, verify)
│   ├── pdl.ts                 → People Data Labs API (enrich)
│   ├── firecrawl.ts           → Firecrawl API (scrape, extract)
│   ├── jina.ts                → Jina Reader API (URL to markdown)
│   ├── zerobounce.ts          → ZeroBounce API (email verify)
│   ├── google-places.ts       → Google Places API (local business)
│   ├── sec-edgar.ts           → SEC EDGAR API (public filings)
│   ├── crunchbase.ts          → Crunchbase API (funding data)
│   └── crawlee.ts             → Crawlee (custom web scraping)
│
├── api/
│   ├── inngest.ts             → Inngest webhook endpoint
│   ├── campaigns/
│   │   ├── [id]/
│   │   │   ├── start.post.ts  → Start campaign
│   │   │   ├── stop.post.ts   → Stop/pause campaign
│   │   │   ├── status.get.ts  → Get current run status
│   │   │   └── runs.get.ts    → List campaign runs
│   │   └── index.get.ts       → List all campaigns
│   └── agents/
│       ├── index.get.ts       → List configured agents
│       └── [id]/
│           ├── test.post.ts   → Test run an agent
│           └── config.put.ts  → Update agent configuration
│
└── utils/
    ├── rate-limiter.ts        → Per-provider rate limiting
    ├── cost-tracker.ts        → Track API costs per run
    └── guardrails.ts          → Agent safety limits
```

---

## Summary

**The stack:**
- **Vercel AI SDK** for LLM interaction (tool calling, agent loop)
- **Inngest** for durable background execution (step functions, retry, scheduling)
- **Supabase** for data persistence and real-time updates
- **10+ data APIs** for real lead generation (Apollo, Hunter, PDL, Firecrawl, etc.)

**The flow:**
1. User creates a campaign with ICP criteria
2. User clicks "Start" → Inngest event fired
3. Inngest runs durable step function
4. Steps execute AI agents that call real APIs
5. Leads appear in Supabase in real-time
6. Frontend updates live via Supabase Realtime
7. User reviews, approves, and imports leads into CRM

**The key insight:** Don't over-abstract with heavy frameworks. The AI SDK + Inngest combination gives you TypeScript-native agent execution with production-grade durability, without the complexity of LangChain or the language mismatch of Python frameworks.
