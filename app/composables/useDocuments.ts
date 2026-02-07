import type { Database } from '~/types/database.types'

export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']

export function useDocuments() {
  const client = useSupabaseClient<Database>()

  const documents = ref<Document[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchDocuments() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await client
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      documents.value = data || []
    } catch (e) {
      error.value = e as Error
      console.error('Error fetching documents:', e)
    } finally {
      loading.value = false
    }
  }

  async function createDocument(doc: DocumentInsert) {
    try {
      const { data, error: insertError } = await client
        .from('documents')
        .insert(doc)
        .select()
        .single()

      if (insertError) throw insertError
      await fetchDocuments()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error creating document:', e)
      throw e
    }
  }

  async function updateDocument(id: string, updates: Partial<Document>) {
    try {
      const { error: updateError } = await client
        .from('documents')
        .update(updates)
        .eq('id', id)

      if (updateError) throw updateError
      await fetchDocuments()
    } catch (e) {
      error.value = e as Error
      console.error('Error updating document:', e)
      throw e
    }
  }

  async function deleteDocument(id: string) {
    try {
      const { error: deleteError } = await client
        .from('documents')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      await fetchDocuments()
    } catch (e) {
      error.value = e as Error
      console.error('Error deleting document:', e)
      throw e
    }
  }

  const stats = computed(() => ({
    total: documents.value.length,
    signed: documents.value.filter(d => d.status === 'signed').length,
    drafts: documents.value.filter(d => d.status === 'draft').length,
  }))

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    stats,
  }
}
