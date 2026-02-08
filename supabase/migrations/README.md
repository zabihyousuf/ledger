# Database Migrations - Setup Guide

This directory contains all SQL migrations needed to set up the Ledger CRM database in Supabase.

## Overview

These migrations create **21 tables** with full schema, indexes, RLS policies, and seed data:

### Core CRM Tables (4)

- `activities` - Activity log entries
- `leads` - Lead records
- `contacts` - Contact directory
- `deals` - Sales pipeline deals

### Agent & Skills Tables (5)

- `agents` - AI agent configurations
- `skills` - Available agent skills
- `tools` - Available agent tools
- `agent_skills` - Agent-skill junction table
- `agent_tools` - Agent-tool junction table

### Flow Tables (3)

- `flows` - Automation workflows
- `flow_nodes` - Nodes within flows
- `flow_connections` - Connections between nodes

### Discovery Tables (5)

- `discovery_campaigns` - AI lead discovery campaigns
- `discovered_leads` - Leads found by AI agents
- `agent_activities` - Agent action log
- `bug_reports` - User-submitted bug reports
- `documents` - Document library

### AI Execution Tables (4)

- `agent_runs` - Campaign execution tracking
- `agent_steps` - Tool calls made by agents
- `campaign_metrics` - Daily campaign statistics
- `api_usage` - API call tracking

## How to Run Migrations

### Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Access to the Supabase SQL Editor

### Step-by-Step Instructions

1. **Log into Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open the SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Run Migrations in Order**

   Run each file in **this exact order**:

   ```
   ✅ 001_core_tables.sql          (activities, leads, contacts, deals)
   ✅ 002_agent_tables.sql         (agents, skills, tools, junctions)
   ✅ 003_flow_tables.sql          (flows, flow_nodes, flow_connections)
   ✅ 004_discovery_tables.sql     (campaigns, discovered_leads, activities, bugs, docs)
   ✅ 005_execution_tables.sql     (agent_runs, agent_steps, metrics, api_usage)
   ✅ 006_marketplace_columns.sql  (adds columns for marketplace + multi-agent)
   ✅ 007_seed_data.sql            (skills, tools, pre-configured agents)
   ✅ 008_triggers.sql             (auto-update triggers for updated_at)
   ✅ 009_rls_policies.sql         (Row Level Security policies)
   ```

4. **For Each Migration:**
   - Copy the entire contents of the `.sql` file
   - Paste into the Supabase SQL Editor
   - Click "Run" button
   - ✅ Verify "Success. No rows returned" message
   - ❌ If errors occur, read the error message and fix before proceeding

5. **Verify Tables Were Created**
   - Go to "Table Editor" in Supabase
   - You should see all 21 tables listed
   - Check that seed data exists in `skills`, `tools`, and `agents` tables

## What Each Migration Does

| File                          | Tables Created                                                                  | Notes                                      |
| ----------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| `001_core_tables.sql`         | activities, leads, contacts, deals                                              | Basic CRM functionality                    |
| `002_agent_tables.sql`        | agents, skills, tools, agent_skills, agent_tools                                | AI agent system                            |
| `003_flow_tables.sql`         | flows, flow_nodes, flow_connections                                             | Automation workflows                       |
| `004_discovery_tables.sql`    | discovery_campaigns, discovered_leads, agent_activities, bug_reports, documents | Discovery features                         |
| `005_execution_tables.sql`    | agent_runs, agent_steps, campaign_metrics, api_usage                            | AI execution tracking                      |
| `006_marketplace_columns.sql` | N/A (adds columns)                                                              | Marketplace support, multi-agent campaigns |
| `007_seed_data.sql`           | N/A (inserts data)                                                              | Pre-populates skills, tools, agents        |
| `008_triggers.sql`            | N/A (creates triggers)                                                          | Auto-updates `updated_at` columns          |
| `009_rls_policies.sql`        | N/A (creates policies)                                                          | Security policies (permissive for now)     |

## Troubleshooting

### Error: "relation already exists"

- Table already created from a previous run
- **Solution**: Either drop the table first, or skip that specific table creation

### Error: "column already exists"

- Column was added in a previous run
- **Solution**: Migration 006 uses `ADD COLUMN IF NOT EXISTS` so this shouldn't happen

### Error: "foreign key violation"

- Migrations run out of order
- **Solution**: Start fresh by dropping all tables and running migrations 001-009 in order

### Error: "trigger already exists"

- Trigger was created in a previous run
- **Solution**: Use `CREATE OR REPLACE FUNCTION` (already in migration 008)

## Next Steps

After running all migrations:

1. **Update TypeScript Types**
   - The types in `app/types/database.types.ts` should already match the schema
   - If regeneration is needed, use Supabase CLI: `npx supabase gen types typescript --project-id [YOUR_PROJECT_ID]`

2. **Test the Connection**
   - Restart your dev server: `npm run dev`
   - Navigate to different pages (Agents, Discovery, etc.)
   - Check browser console for any Supabase errors

3. **Verify Seed Data**
   - Go to `/agents` page - should see 3 pre-configured agents
   - Check that Skills and Tools modals show the seeded data

## Security Note

⚠️ **Current RLS policies are PERMISSIVE** (allow all access without authentication)

This is intentional for development, but **you must update these policies before production deployment** to implement proper user-based access control.

To update RLS policies when adding authentication:

1. Replace policies in `009_rls_policies.sql` with user-specific ones
2. Use `auth.uid()` to filter rows by user
3. Re-run the RLS migration

## Support

If you encounter issues:

1. Check the Supabase logs in the Dashboard
2. Verify your `.env` file has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Ensure all migrations ran successfully in order
