import { supabase } from './supabase'
import { BookSection, BookSectionInsert, BookSectionUpdate } from '@/types/database.types'

/**
 * Fetch all book sections for a project, ordered by order_number
 */
export async function getBookSections(projectId: string) {
  const { data, error } = await supabase
    .from('book_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('order_number', { ascending: true })

  if (error) {
    throw error
  }

  return data as BookSection[]
}

/**
 * Fetch a single book section by ID
 */
export async function getBookSectionById(id: string) {
  const { data, error } = await supabase
    .from('book_sections')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data as BookSection
}

/**
 * Create a new book section
 */
export async function createBookSection(section: BookSectionInsert) {
  const { data, error } = await supabase
    .from('book_sections')
    .insert(section)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as BookSection
}

/**
 * Update an existing book section
 */
export async function updateBookSection(id: string, updates: BookSectionUpdate) {
  const { data, error } = await supabase
    .from('book_sections')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as BookSection
}

/**
 * Delete a book section
 */
export async function deleteBookSection(id: string) {
  const { error } = await supabase
    .from('book_sections')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}

/**
 * Calculate word count from HTML content
 */
export function calculateWordCount(html: string): number {
  if (!html) return 0
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, ' ')
  // Remove extra whitespace and split by spaces
  const words = text.trim().split(/\s+/).filter(word => word.length > 0)
  return words.length
}
