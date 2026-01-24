/**
 * Phase-specific utilities.
 * System prompts come from prompt templates (see promptTemplates.ts).
 */

export interface PhaseData {
  number: number
  name: string
  systemPrompt: string
}

export function getPhaseName(phase: number): string {
  const phases: Record<number, string> = {
    1: 'Planning',
    2: 'Research',
    3: 'Fact Checking',
  }
  return phases[phase] || 'Planning'
}

export function parsePhase1JSON(content: string): {
  bookPlan?: {
    topic?: string
    angle?: string
    audience?: string
    depth?: string
    scope?: string
  }
  similarWorks?: Array<{
    title?: string
    author?: string
    howItsDifferent?: string
  }>
  researchPlan?: {
    sections?: Array<{
      title?: string
      description?: string
      itemsToResearch?: string[]
    }>
    researchFields?: string[]
  }
} | null {
  try {
    let jsonString = content.trim()

    if (jsonString.includes('```')) {
      const match = jsonString.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (match) {
        jsonString = match[1]
      }
    }

    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonString = jsonMatch[0]
    }

    const parsed = JSON.parse(jsonString)

    if (!parsed.bookPlan || !parsed.researchPlan) {
      return null
    }

    return parsed
  } catch (error) {
    console.error('Error parsing Phase 1 JSON:', error)
    return null
  }
}
