import { supabase } from './supabase'
import { Project, ProjectInsert, ProjectUpdate } from '@/types/database.types'

/**
 * Fetch all projects for a user, ordered by updated_at (most recent first)
 */
export async function getProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return data as Project[]
}

/**
 * Fetch a single project by ID
 */
export async function getProjectById(id: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data as Project
}

/**
 * Create a new project
 */
export async function createProject(project: ProjectInsert): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Project
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, updates: ProjectUpdate): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Project
}

/**
 * Delete a project (cascade will delete associated book_sections)
 */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}

/**
 * Get project statistics (word count, last edited)
 */
export async function getProjectStats(projectId: string): Promise<{ wordCount: number; lastEdited: string | null }> {
  const { data, error } = await supabase
    .from('book_sections')
    .select('word_count, updated_at')
    .eq('project_id', projectId)

  if (error) {
    throw error
  }

  const wordCount = data.reduce((sum, section) => sum + (section.word_count || 0), 0)
  const lastEdited = data.length > 0
    ? data.reduce((latest, section) => {
        if (!latest) return section.updated_at
        return section.updated_at > latest ? section.updated_at : latest
      }, data[0].updated_at)
    : null

  return { wordCount, lastEdited }
}
