import type { Database } from '~/types/database.types'

export type Agent = Database['public']['Tables']['agents']['Row'] & {
  skills?: string[]
  tools?: string[]
}
export type AgentInsert = Database['public']['Tables']['agents']['Insert']
export type AgentUpdate = Database['public']['Tables']['agents']['Update']
export type Skill = Database['public']['Tables']['skills']['Row']
export type Tool = Database['public']['Tables']['tools']['Row']

export function useAgents() {
  const client = useSupabaseClient<Database>()

  const agents = ref<Agent[]>([])
  const skills = ref<Skill[]>([])
  const tools = ref<Tool[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchAgents() {
    loading.value = true
    error.value = null
    try {
      // Fetch agents
      const { data: agentsData, error: agentsError } = await client
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })

      if (agentsError) throw agentsError

      // Fetch agent skills and tools for each agent
      const agentsWithRelations = await Promise.all(
        (agentsData || []).map(async (agent) => {
          const [skillsRes, toolsRes] = await Promise.all([
            client
              .from('agent_skills')
              .select('skill_id, skills(name)')
              .eq('agent_id', agent.id),
            client
              .from('agent_tools')
              .select('tool_id, tools(name)')
              .eq('agent_id', agent.id),
          ])

          return {
            ...agent,
            skills: skillsRes.data?.map((s: any) => s.skills.name) || [],
            tools: toolsRes.data?.map((t: any) => t.tools.name) || [],
          }
        })
      )

      agents.value = agentsWithRelations
    } catch (e) {
      error.value = e as Error
      console.error('Error fetching agents:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchSkills() {
    try {
      const { data, error: fetchError } = await client
        .from('skills')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError
      skills.value = data || []
    } catch (e) {
      console.error('Error fetching skills:', e)
    }
  }

  async function fetchTools() {
    try {
      const { data, error: fetchError } = await client
        .from('tools')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError
      tools.value = data || []
    } catch (e) {
      console.error('Error fetching tools:', e)
    }
  }

  async function createAgent(agent: AgentInsert) {
    loading.value = true
    error.value = null
    try {
      const { data, error: insertError } = await client
        .from('agents')
        .insert(agent)
        .select()
        .single()

      if (insertError) throw insertError
      await fetchAgents()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error creating agent:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateAgent(id: string, updates: AgentUpdate) {
    loading.value = true
    error.value = null
    try {
      const { data, error: updateError } = await client
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      await fetchAgents()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error updating agent:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteAgent(id: string) {
    loading.value = true
    error.value = null
    try {
      const { error: deleteError } = await client
        .from('agents')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      await fetchAgents()
    } catch (e) {
      error.value = e as Error
      console.error('Error deleting agent:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function attachSkill(agentId: string, skillId: string) {
    try {
      const { error: attachError } = await client
        .from('agent_skills')
        .insert({ agent_id: agentId, skill_id: skillId })

      if (attachError) throw attachError
      await fetchAgents()
    } catch (e) {
      console.error('Error attaching skill:', e)
      throw e
    }
  }

  async function detachSkill(agentId: string, skillId: string) {
    try {
      const { error: detachError } = await client
        .from('agent_skills')
        .delete()
        .eq('agent_id', agentId)
        .eq('skill_id', skillId)

      if (detachError) throw detachError
      await fetchAgents()
    } catch (e) {
      console.error('Error detaching skill:', e)
      throw e
    }
  }

  async function attachTool(agentId: string, toolId: string) {
    try {
      const { error: attachError } = await client
        .from('agent_tools')
        .insert({ agent_id: agentId, tool_id: toolId })

      if (attachError) throw attachError
      await fetchAgents()
    } catch (e) {
      console.error('Error attaching tool:', e)
      throw e
    }
  }

  async function detachTool(agentId: string, toolId: string) {
    try {
      const { error: detachError } = await client
        .from('agent_tools')
        .delete()
        .eq('agent_id', agentId)
        .eq('tool_id', toolId)

      if (detachError) throw detachError
      await fetchAgents()
    } catch (e) {
      console.error('Error detaching tool:', e)
      throw e
    }
  }

  return {
    agents,
    skills,
    tools,
    loading,
    error,
    fetchAgents,
    fetchSkills,
    fetchTools,
    createAgent,
    updateAgent,
    deleteAgent,
    attachSkill,
    detachSkill,
    attachTool,
    detachTool,
  }
}
