import { supabase } from './supabase'

export interface ChatMessage {
  id: string
  project_id: string
  phase: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
  is_summary?: boolean
}

/**
 * Save a chat message to the database
 */
export async function saveChatMessage(
  projectId: string,
  phase: number,
  role: 'user' | 'assistant',
  content: string,
  isSummary: boolean = false
): Promise<{ data: ChatMessage | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('research_chat_messages')
    .insert({
      project_id: projectId,
      phase: phase,
      role: role,
      content: content,
      is_summary: isSummary,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving chat message:', error)
    return { data: null, error: new Error(error.message) }
  }

  return { data: data as ChatMessage, error: null }
}

/**
 * Load all chat messages for a project
 */
export async function loadChatMessages(
  projectId: string
): Promise<{ data: ChatMessage[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('research_chat_messages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error loading chat messages:', error)
    return { data: null, error: new Error(error.message) }
  }

  return { data: data as ChatMessage[], error: null }
}

/**
 * Load chat messages for a specific phase
 */
export async function loadChatMessagesByPhase(
  projectId: string,
  phase: number
): Promise<{ data: ChatMessage[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('research_chat_messages')
    .select('*')
    .eq('project_id', projectId)
    .eq('phase', phase)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error loading chat messages by phase:', error)
    return { data: null, error: new Error(error.message) }
  }

  return { data: data as ChatMessage[], error: null }
}

/**
 * Delete all chat messages for a project
 */
export async function deleteAllChatMessages(
  projectId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('research_chat_messages')
    .delete()
    .eq('project_id', projectId)

  if (error) {
    console.error('Error deleting chat messages:', error)
    return { error: new Error(error.message) }
  }

  return { error: null }
}

/**
 * Delete specific chat messages by id (for rolling summarization).
 * Only deletes messages belonging to the project.
 */
export async function deleteChatMessagesByIds(
  projectId: string,
  ids: string[]
): Promise<{ error: Error | null }> {
  if (ids.length === 0) return { error: null }

  const { error } = await supabase
    .from('research_chat_messages')
    .delete()
    .eq('project_id', projectId)
    .in('id', ids)

  if (error) {
    console.error('Error deleting chat messages by ids:', error)
    return { error: new Error(error.message) }
  }

  return { error: null }
}
