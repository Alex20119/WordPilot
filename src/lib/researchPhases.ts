/**
 * Phase-specific system prompts and utilities
 */

export interface PhaseData {
  number: number
  name: string
  systemPrompt: string
}

const PHASE_1_STOCK_PROMPT = `You are helping an author plan a research-intensive non-fiction book. Phase 1 covers all planning activities before research begins.

YOUR ROLE IN PHASE 1:

IDEA DEVELOPMENT (if needed)
- If user has vague idea, help them develop it
- Brainstorm potential book topics within their area of interest
- Explain why each topic could work as a book

TOPIC EXPLORATION
- Once user has a topic, explore it conversationally
- Ask: What specific angle or focus?
- Ask: What makes this unique or interesting?
- Help refine broad ideas into specific book concepts

FIND SIMILAR WORKS
- Identify books that cover similar territory
- Explain how their book could differ or fill gaps
- Note what's been done vs. what's missing in existing literature

DEFINE BOOK PARAMETERS
- Target audience (general readers, students, academics, practitioners)
- Research depth needed (overview, thorough, academic-level)
- Scope and length (essay-length, standard book, comprehensive)
- Tone and approach (narrative, analytical, instructional, etc.)

CREATE RESEARCH PLAN
- Suggest logical structure for organizing research
- Identify major topics/themes to research
- List specific items that need research
- Define what information to collect (research fields)

GENERATE PHASE 2 INSTRUCTIONS
- Create customized research prompt for Phase 2
- Tailor it to this specific book's needs

When the user is ready to proceed to research, output JSON:
{
  "bookPlan": {
    "topic": "clear topic statement",
    "angle": "specific focus",
    "audience": "target readers",
    "depth": "research depth needed",
    "scope": "book length/scope"
  },
  "similarWorks": [
    {"title": "Book Title", "author": "Author", "howItsDifferent": "explanation"}
  ],
  "researchPlan": {
    "sections": [
      {
        "title": "Section title",
        "description": "What this covers",
        "itemsToResearch": ["item1", "item2", "item3"]
      }
    ],
    "researchFields": ["field1", "field2", "field3"]
  },
  "phase2Prompt": "Detailed instructions for Phase 2 research, customized for this book..."
}

CONVERSATION APPROACH:
- Be exploratory and helpful
- Ask clarifying questions
- Make suggestions but let user guide
- Don't rush - take time to develop a solid plan
- Only output JSON when user confirms they're ready for Phase 2

Start by understanding what stage they're at: Do they have a clear topic or are they still developing their idea?`

const PHASE_2_GENERIC_PROMPT = `Help user conduct thorough research on their book topic, including identifying key themes, gathering sources, and organizing research items.`

const PHASE_3_GENERIC_PROMPT = `Review research for accuracy, verify sources, check for gaps, and resolve contradictions.`

export function getPhaseSystemPrompt(
  phase: number,
  sessionData: any
): string {
  switch (phase) {
    case 1:
      return PHASE_1_STOCK_PROMPT
    case 2:
      return sessionData?.phases?.phase2?.generatedPrompt || PHASE_2_GENERIC_PROMPT
    case 3:
      return sessionData?.phases?.phase3?.generatedPrompt || PHASE_3_GENERIC_PROMPT
    default:
      return PHASE_1_STOCK_PROMPT
  }
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
  phase2Prompt?: string
} | null {
  try {
    // Try to extract JSON from the content (might be wrapped in markdown code blocks)
    let jsonString = content.trim()
    
    // Remove markdown code blocks if present
    if (jsonString.includes('```')) {
      const match = jsonString.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (match) {
        jsonString = match[1]
      }
    }
    
    // Try to find JSON object in the text
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonString = jsonMatch[0]
    }
    
    const parsed = JSON.parse(jsonString)
    
    // Validate that this looks like Phase 1 JSON (has bookPlan and researchPlan)
    if (!parsed.bookPlan || !parsed.researchPlan) {
      return null
    }
    
    return parsed
  } catch (error) {
    console.error('Error parsing Phase 1 JSON:', error)
    return null
  }
}
