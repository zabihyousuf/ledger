import type { Database } from '~/types/database.types'

export type Flow = Database['public']['Tables']['flows']['Row']
export type FlowInsert = Database['public']['Tables']['flows']['Insert']
export type FlowUpdate = Database['public']['Tables']['flows']['Update']
export type FlowNodeRow = Database['public']['Tables']['flow_nodes']['Row']
export type FlowNodeInsert = Database['public']['Tables']['flow_nodes']['Insert']
export type FlowConnectionRow = Database['public']['Tables']['flow_connections']['Row']
export type FlowConnectionInsert = Database['public']['Tables']['flow_connections']['Insert']

export interface FlowWithCounts extends Flow {
  node_count: number
  connection_count: number
}

export function useFlows() {
  const client = useSupabaseClient<Database>()

  const flows = ref<Flow[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // ── Flow CRUD ──
  async function fetchFlows() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await client
        .from('flows')
        .select('*')
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError
      flows.value = data || []
    } catch (e) {
      error.value = e as Error
      console.error('Error fetching flows:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchFlow(id: string): Promise<Flow | null> {
    try {
      const { data, error: fetchError } = await client
        .from('flows')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      return data
    } catch (e) {
      console.error('Error fetching flow:', e)
      return null
    }
  }

  async function createFlow(flow: FlowInsert): Promise<Flow | null> {
    loading.value = true
    error.value = null
    try {
      const { data, error: insertError } = await client
        .from('flows')
        .insert(flow)
        .select()
        .single()

      if (insertError) throw insertError
      await fetchFlows()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error creating flow:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateFlow(id: string, updates: FlowUpdate): Promise<Flow | null> {
    try {
      const { data, error: updateError } = await client
        .from('flows')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      return data
    } catch (e) {
      console.error('Error updating flow:', e)
      return null
    }
  }

  async function deleteFlow(id: string) {
    try {
      // Delete connections first, then nodes, then flow
      await client.from('flow_connections').delete().eq('flow_id', id)
      await client.from('flow_nodes').delete().eq('flow_id', id)
      const { error: deleteError } = await client.from('flows').delete().eq('id', id)
      if (deleteError) throw deleteError
      await fetchFlows()
    } catch (e) {
      console.error('Error deleting flow:', e)
    }
  }

  async function duplicateFlow(id: string): Promise<Flow | null> {
    try {
      const original = await fetchFlow(id)
      if (!original) return null

      // Create new flow
      const { data: newFlow, error: createError } = await client
        .from('flows')
        .insert({
          name: `${original.name} (copy)`,
          description: original.description,
          status: 'draft',
          trigger_type: original.trigger_type,
        })
        .select()
        .single()

      if (createError || !newFlow) throw createError

      // Copy nodes
      const { data: oldNodes } = await client
        .from('flow_nodes')
        .select('*')
        .eq('flow_id', id)

      if (oldNodes && oldNodes.length > 0) {
        const nodeIdMap: Record<string, string> = {}

        for (const node of oldNodes) {
          const { data: newNode } = await client
            .from('flow_nodes')
            .insert({
              flow_id: newFlow.id,
              node_type: node.node_type,
              label: node.label,
              config: node.config,
              position_x: node.position_x,
              position_y: node.position_y,
            })
            .select()
            .single()

          if (newNode) {
            nodeIdMap[node.id] = newNode.id
          }
        }

        // Copy connections with mapped node IDs
        const { data: oldConns } = await client
          .from('flow_connections')
          .select('*')
          .eq('flow_id', id)

        if (oldConns && oldConns.length > 0) {
          const newConns = oldConns
            .filter(c => nodeIdMap[c.from_node_id] && nodeIdMap[c.to_node_id])
            .map(c => ({
              flow_id: newFlow.id,
              from_node_id: nodeIdMap[c.from_node_id],
              to_node_id: nodeIdMap[c.to_node_id],
              label: c.label,
            }))

          if (newConns.length > 0) {
            await client.from('flow_connections').insert(newConns)
          }
        }
      }

      await fetchFlows()
      return newFlow
    } catch (e) {
      console.error('Error duplicating flow:', e)
      return null
    }
  }

  // ── Node CRUD ──
  async function fetchNodes(flowId: string): Promise<FlowNodeRow[]> {
    try {
      const { data, error: fetchError } = await client
        .from('flow_nodes')
        .select('*')
        .eq('flow_id', flowId)
        .order('created_at')

      if (fetchError) throw fetchError
      return data || []
    } catch (e) {
      console.error('Error fetching nodes:', e)
      return []
    }
  }

  async function createNode(node: FlowNodeInsert): Promise<FlowNodeRow | null> {
    try {
      const { data, error: insertError } = await client
        .from('flow_nodes')
        .insert(node)
        .select()
        .single()

      if (insertError) throw insertError
      return data
    } catch (e) {
      console.error('Error creating node:', e)
      return null
    }
  }

  async function updateNode(id: string, updates: Partial<FlowNodeInsert>) {
    try {
      const { error: updateError } = await client
        .from('flow_nodes')
        .update(updates)
        .eq('id', id)

      if (updateError) throw updateError
    } catch (e) {
      console.error('Error updating node:', e)
    }
  }

  async function deleteNode(id: string) {
    try {
      // Delete connections involving this node first
      await client.from('flow_connections').delete().or(`from_node_id.eq.${id},to_node_id.eq.${id}`)
      const { error: deleteError } = await client.from('flow_nodes').delete().eq('id', id)
      if (deleteError) throw deleteError
    } catch (e) {
      console.error('Error deleting node:', e)
    }
  }

  // ── Connection CRUD ──
  async function fetchConnections(flowId: string): Promise<FlowConnectionRow[]> {
    try {
      const { data, error: fetchError } = await client
        .from('flow_connections')
        .select('*')
        .eq('flow_id', flowId)

      if (fetchError) throw fetchError
      return data || []
    } catch (e) {
      console.error('Error fetching connections:', e)
      return []
    }
  }

  async function createConnection(conn: FlowConnectionInsert): Promise<FlowConnectionRow | null> {
    try {
      const { data, error: insertError } = await client
        .from('flow_connections')
        .insert(conn)
        .select()
        .single()

      if (insertError) throw insertError
      return data
    } catch (e) {
      console.error('Error creating connection:', e)
      return null
    }
  }

  async function deleteConnection(id: string) {
    try {
      const { error: deleteError } = await client
        .from('flow_connections')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
    } catch (e) {
      console.error('Error deleting connection:', e)
    }
  }

  // ── Save entire flow (batch) ──
  async function saveFlowData(
    flowId: string,
    nodesData: Array<{ id?: string; node_type: string; label: string; config?: any; position_x: number; position_y: number }>,
    connectionsData: Array<{ from_local_id: number; to_local_id: number; label?: string | null }>,
    localIdToDbId: Map<number, string>
  ) {
    try {
      // Delete old nodes and connections
      await client.from('flow_connections').delete().eq('flow_id', flowId)
      await client.from('flow_nodes').delete().eq('flow_id', flowId)

      // Insert new nodes
      const newIdMap = new Map<number, string>()

      for (let i = 0; i < nodesData.length; i++) {
        const nd = nodesData[i]
        const { data } = await client
          .from('flow_nodes')
          .insert({
            flow_id: flowId,
            node_type: nd.node_type,
            label: nd.label,
            config: nd.config || {},
            position_x: nd.position_x,
            position_y: nd.position_y,
          })
          .select()
          .single()

        if (data) {
          newIdMap.set(i, data.id)
        }
      }

      // Insert new connections
      const connInserts: FlowConnectionInsert[] = []
      for (const cd of connectionsData) {
        const fromDbId = newIdMap.get(cd.from_local_id)
        const toDbId = newIdMap.get(cd.to_local_id)
        if (fromDbId && toDbId) {
          connInserts.push({
            flow_id: flowId,
            from_node_id: fromDbId,
            to_node_id: toDbId,
            label: cd.label || null,
          })
        }
      }

      if (connInserts.length > 0) {
        await client.from('flow_connections').insert(connInserts)
      }

      // Update the flow's updated_at
      await updateFlow(flowId, {})

      return true
    } catch (e) {
      console.error('Error saving flow data:', e)
      return false
    }
  }

  return {
    flows,
    loading,
    error,
    fetchFlows,
    fetchFlow,
    createFlow,
    updateFlow,
    deleteFlow,
    duplicateFlow,
    fetchNodes,
    createNode,
    updateNode,
    deleteNode,
    fetchConnections,
    createConnection,
    deleteConnection,
    saveFlowData,
  }
}
