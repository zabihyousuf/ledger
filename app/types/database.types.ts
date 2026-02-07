export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          type: string
          title: string
          description: string | null
          related_to_type: string | null
          related_to_id: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          description?: string | null
          related_to_type?: string | null
          related_to_id?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          description?: string | null
          related_to_type?: string | null
          related_to_id?: string | null
          user_id?: string | null
          created_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          name: string
          description: string | null
          status: string
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: string
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: string
          config?: Json
          created_at?: string
          updated_at?: string
        }
      }
      agent_skills: {
        Row: {
          id: string
          agent_id: string
          skill_id: string
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          skill_id: string
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          skill_id?: string
          created_at?: string
        }
      }
      agent_tools: {
        Row: {
          id: string
          agent_id: string
          tool_id: string
          config: Json
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          tool_id: string
          config?: Json
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          tool_id?: string
          config?: Json
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          company: string | null
          position: string | null
          linkedin_url: string | null
          twitter_url: string | null
          tags: string[] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          company?: string | null
          position?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          tags?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          company?: string | null
          position?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          tags?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          title: string
          contact_id: string | null
          lead_id: string | null
          value: number
          stage: string
          probability: number | null
          expected_close_date: string | null
          actual_close_date: string | null
          assigned_to: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          contact_id?: string | null
          lead_id?: string | null
          value: number
          stage?: string
          probability?: number | null
          expected_close_date?: string | null
          actual_close_date?: string | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          contact_id?: string | null
          lead_id?: string | null
          value?: number
          stage?: string
          probability?: number | null
          expected_close_date?: string | null
          actual_close_date?: string | null
          assigned_to?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      flows: {
        Row: {
          id: string
          name: string
          description: string | null
          status: string
          trigger_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: string
          trigger_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: string
          trigger_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      flow_nodes: {
        Row: {
          id: string
          flow_id: string
          node_type: string
          label: string
          config: Json
          position_x: number
          position_y: number
          created_at: string
        }
        Insert: {
          id?: string
          flow_id: string
          node_type: string
          label: string
          config?: Json
          position_x?: number
          position_y?: number
          created_at?: string
        }
        Update: {
          id?: string
          flow_id?: string
          node_type?: string
          label?: string
          config?: Json
          position_x?: number
          position_y?: number
          created_at?: string
        }
      }
      flow_connections: {
        Row: {
          id: string
          flow_id: string
          from_node_id: string
          to_node_id: string
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          flow_id: string
          from_node_id: string
          to_node_id: string
          label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          flow_id?: string
          from_node_id?: string
          to_node_id?: string
          label?: string | null
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          position: string | null
          status: string
          source: string
          score: number | null
          value: number | null
          notes: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          position?: string | null
          status?: string
          source?: string
          score?: number | null
          value?: number | null
          notes?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          position?: string | null
          status?: string
          source?: string
          score?: number | null
          value?: number | null
          notes?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      tools: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          config_schema: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          config_schema?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          config_schema?: Json
          created_at?: string
        }
      }
      discovery_campaigns: {
        Row: {
          id: string
          name: string
          status: string
          target_industry: string
          target_roles: string[]
          target_company_size: string
          target_region: string
          search_criteria: string
          agent_id: string | null
          leads_found: number
          leads_approved: number
          leads_rejected: number
          confidence_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: string
          target_industry: string
          target_roles: string[]
          target_company_size: string
          target_region: string
          search_criteria: string
          agent_id?: string | null
          leads_found?: number
          leads_approved?: number
          leads_rejected?: number
          confidence_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: string
          target_industry?: string
          target_roles?: string[]
          target_company_size?: string
          target_region?: string
          search_criteria?: string
          agent_id?: string | null
          leads_found?: number
          leads_approved?: number
          leads_rejected?: number
          confidence_threshold?: number
          created_at?: string
          updated_at?: string
        }
      }
      discovered_leads: {
        Row: {
          id: string
          campaign_id: string
          name: string
          email: string | null
          company: string | null
          position: string | null
          linkedin_url: string | null
          confidence_score: number
          discovery_source: string
          status: string
          ai_summary: string
          signals: string[]
          discovered_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          name: string
          email?: string | null
          company?: string | null
          position?: string | null
          linkedin_url?: string | null
          confidence_score: number
          discovery_source: string
          status?: string
          ai_summary: string
          signals?: string[]
          discovered_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          name?: string
          email?: string | null
          company?: string | null
          position?: string | null
          linkedin_url?: string | null
          confidence_score?: number
          discovery_source?: string
          status?: string
          ai_summary?: string
          signals?: string[]
          discovered_at?: string
        }
      }
      agent_activities: {
        Row: {
          id: string
          agent_id: string
          agent_name: string
          campaign_id: string | null
          action: string
          detail: string
          status: string
          timestamp: string
        }
        Insert: {
          id?: string
          agent_id: string
          agent_name: string
          campaign_id?: string | null
          action: string
          detail: string
          status?: string
          timestamp?: string
        }
        Update: {
          id?: string
          agent_id?: string
          agent_name?: string
          campaign_id?: string | null
          action?: string
          detail?: string
          status?: string
          timestamp?: string
        }
      }
      bug_reports: {
        Row: {
          id: string
          title: string
          description: string
          page_url: string
          screenshot_data: string | null
          browser_info: string
          viewport: string
          console_errors: string[]
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          page_url: string
          screenshot_data?: string | null
          browser_info: string
          viewport: string
          console_errors?: string[]
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          page_url?: string
          screenshot_data?: string | null
          browser_info?: string
          viewport?: string
          console_errors?: string[]
          status?: string
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          name: string
          type: string
          status: string
          size: number
          deal_id: string | null
          contact_id: string | null
          file_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: string
          status?: string
          size?: number
          deal_id?: string | null
          contact_id?: string | null
          file_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          status?: string
          size?: number
          deal_id?: string | null
          contact_id?: string | null
          file_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
