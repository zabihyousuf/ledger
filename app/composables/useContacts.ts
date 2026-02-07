import type { Database } from '~/types/database.types'

export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']

export function useContacts() {
  const client = useSupabaseClient<Database>()

  const contacts = ref<Contact[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchContacts() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await client
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      contacts.value = data || []
    } catch (e) {
      error.value = e as Error
      console.error('Error fetching contacts:', e)
    } finally {
      loading.value = false
    }
  }

  async function createContact(contact: ContactInsert) {
    loading.value = true
    error.value = null
    try {
      const { data, error: insertError } = await client
        .from('contacts')
        .insert(contact)
        .select()
        .single()

      if (insertError) throw insertError
      await fetchContacts()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error creating contact:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateContact(id: string, updates: ContactUpdate) {
    loading.value = true
    error.value = null
    try {
      const { data, error: updateError } = await client
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      await fetchContacts()
      return data
    } catch (e) {
      error.value = e as Error
      console.error('Error updating contact:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteContact(id: string) {
    loading.value = true
    error.value = null
    try {
      const { error: deleteError } = await client
        .from('contacts')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      await fetchContacts()
    } catch (e) {
      error.value = e as Error
      console.error('Error deleting contact:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  }
}
