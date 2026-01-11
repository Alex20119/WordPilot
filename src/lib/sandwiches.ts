import { supabase } from './supabase'
import { Sandwich, SandwichInsert, SandwichUpdate } from '@/types/database.types'

/**
 * Fetch all sandwiches, optionally filtered by chapter
 */
export async function getSandwiches(chapter?: number) {
  let query = supabase.from('sandwiches').select('*').order('chapter', { ascending: true }).order('name', { ascending: true })

  if (chapter) {
    query = query.eq('chapter', chapter)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data as Sandwich[]
}

/**
 * Fetch a single sandwich by ID
 */
export async function getSandwichById(id: string) {
  const { data, error } = await supabase
    .from('sandwiches')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data as Sandwich
}

/**
 * Search sandwiches by text (searches name, ingredients, and origin)
 */
export async function searchSandwiches(searchTerm: string) {
  const { data, error } = await supabase
    .from('sandwiches')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,ingredients.ilike.%${searchTerm}%,origin.ilike.%${searchTerm}%`)
    .order('chapter', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return data as Sandwich[]
}

/**
 * Create a new sandwich
 */
export async function createSandwich(sandwich: SandwichInsert) {
  const { data, error } = await supabase
    .from('sandwiches')
    .insert(sandwich)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Sandwich
}

/**
 * Update an existing sandwich
 */
export async function updateSandwich(id: string, updates: SandwichUpdate) {
  const { data, error } = await supabase
    .from('sandwiches')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Sandwich
}

/**
 * Delete a sandwich
 */
export async function deleteSandwich(id: string) {
  const { error } = await supabase
    .from('sandwiches')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}

/**
 * Bulk insert sandwiches (for data migration)
 */
export async function bulkInsertSandwiches(sandwiches: SandwichInsert[]) {
  const { data, error } = await supabase
    .from('sandwiches')
    .insert(sandwiches)
    .select()

  if (error) {
    throw error
  }

  return data as Sandwich[]
}