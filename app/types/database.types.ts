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
    }
  }
}
