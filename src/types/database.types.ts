// Database types for TypeScript
export type WritingStatus = 'not_started' | 'drafted' | 'revised' | 'final'

export interface Sandwich {
  id: string
  chapter: number
  name: string
  origin: string
  ingredients: string
  significance: string
  fun_facts: string
  researched: boolean
  writing_status: WritingStatus
  personal_notes: string | null
  created_at: string
  updated_at: string
}

export interface SandwichInsert {
  chapter: number
  name: string
  origin: string
  ingredients: string
  significance: string
  fun_facts: string
  researched: boolean
  writing_status?: WritingStatus
  personal_notes?: string | null
}

export interface SandwichUpdate {
  chapter?: number
  name?: string
  origin?: string
  ingredients?: string
  significance?: string
  fun_facts?: string
  researched?: boolean
  writing_status?: WritingStatus
  personal_notes?: string | null
}

// Project types
export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface ProjectInsert {
  user_id: string
  title: string
  description?: string | null
}

export interface ProjectUpdate {
  title?: string
  description?: string | null
}

// Book sections types
export interface BookSection {
  id: string
  user_id: string
  project_id: string
  title: string
  content: string
  parent_id: string | null
  order_number: number
  word_count: number
  created_at: string
  updated_at: string
}

export interface BookSectionInsert {
  user_id: string
  project_id: string
  title: string
  content?: string
  parent_id?: string | null
  order_number: number
  word_count?: number
}

export interface BookSectionUpdate {
  title?: string
  content?: string
  parent_id?: string | null
  order_number?: number
  word_count?: number
}