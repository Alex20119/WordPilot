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