-- ============================================
-- PART 9: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enables RLS with permissive policies (no auth required for now)
-- Replace with user-based policies when authentication is added

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PERMISSIVE POLICIES (ALLOW ALL ACCESS)
-- ============================================
-- Replace these with proper user-based policies when auth is added

CREATE POLICY "Allow all access" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.skills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.tools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.agent_skills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.agent_tools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.flows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.flow_nodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.flow_connections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.discovery_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.discovered_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.agent_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.bug_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.agent_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.agent_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.campaign_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.api_usage FOR ALL USING (true) WITH CHECK (true);
