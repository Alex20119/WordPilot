import { supabase } from './supabase'

export interface ResearchItem {
  id: string
  project_id: string
  section: string
  name: string
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ResearchPlanSection {
  title?: string
  description?: string
  itemsToResearch?: string[]
}

/**
 * Create research structure from Phase 1 research plan
 */
export async function createResearchStructure(
  researchPlan: {
    sections?: ResearchPlanSection[]
  },
  projectId: string
): Promise<{ error: Error | null; itemCount: number }> {
  if (!researchPlan.sections || researchPlan.sections.length === 0) {
    return { error: null, itemCount: 0 }
  }

  const items: Array<{
    project_id: string
    section: string
    name: string
    data: Record<string, any>
  }> = []

  researchPlan.sections.forEach((section) => {
    if (section.title && section.itemsToResearch) {
      section.itemsToResearch.forEach((itemName) => {
        items.push({
          project_id: projectId,
          section: section.title!,
          name: itemName,
          data: {},
        })
      })
    }
  })

  if (items.length === 0) {
    return { error: null, itemCount: 0 }
  }

  const { error } = await supabase.from('research_items').insert(items)

  if (error) {
    console.error('Error creating research structure:', error)
    return { error: new Error(error.message), itemCount: 0 }
  }

  return { error: null, itemCount: items.length }
}

/**
 * Load research items for a project
 */
export async function loadResearchItems(projectId: string): Promise<{
  data: ResearchItem[] | null
  error: Error | null
}> {
  const { data, error } = await supabase
    .from('research_items')
    .select('*')
    .eq('project_id', projectId)
    .order('section', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error loading research items:', error)
    return { data: null, error: new Error(error.message) }
  }

  return { data: data as ResearchItem[], error: null }
}

/**
 * Save research data for a specific item
 */
export async function saveResearch(
  itemName: string,
  researchData: Record<string, any>,
  projectId: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('research_items')
    .update({
      data: researchData,
      updated_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('name', itemName)

  if (error) {
    console.error('Error saving research:', error)
    return { error: new Error(error.message) }
  }

  return { error: null }
}

/**
 * Update a specific field in research data
 */
export async function updateResearchField(
  itemId: string,
  field: string,
  newContent: string
): Promise<{ error: Error | null }> {
  // Get current data
  const { data: item, error: fetchError } = await supabase
    .from('research_items')
    .select('data')
    .eq('id', itemId)
    .single()

  if (fetchError) {
    console.error('Error fetching research item:', fetchError)
    return { error: new Error(fetchError.message) }
  }

  if (!item) {
    return { error: new Error('Research item not found') }
  }

  // Update specific field
  const updatedData = {
    ...(item.data || {}),
    [field]: newContent,
  }

  // Save back to database
  const { error } = await supabase
    .from('research_items')
    .update({
      data: updatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating research:', error)
    return { error: new Error(error.message) }
  }

  return { error: null }
}

/**
 * Update complete research data for an item
 */
export async function updateResearchData(
  itemId: string,
  updatedData: Record<string, any>
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('research_items')
    .update({
      data: updatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating research:', error)
    return { error: new Error(error.message) }
  }

  return { error: null }
}

/**
 * Find a research item by name
 */
export async function findResearchItemByName(
  itemName: string,
  projectId: string
): Promise<{ data: ResearchItem | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('research_items')
    .select('*')
    .eq('project_id', projectId)
    .eq('name', itemName)
    .maybeSingle()

  if (error) {
    console.error('Error finding research item:', error)
    return { data: null, error: new Error(error.message) }
  }

  return { data: data as ResearchItem | null, error: null }
}

/**
 * Subscribe to real-time changes for research items
 */
export function subscribeToResearchItems(
  projectId: string,
  callback: () => void
): () => void {
  const channel = supabase
    .channel(`research_items:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'research_items',
        filter: `project_id=eq.${projectId}`,
      },
      () => {
        callback()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
