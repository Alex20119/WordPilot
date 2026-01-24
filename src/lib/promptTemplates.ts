/**
 * Prompt template system for research phases.
 * Templates are stored in localStorage; can be migrated to Supabase later.
 */

const STORAGE_KEY = 'prompt-templates'
const SELECTED_KEY = 'selected-prompt-template'

export interface PromptTemplate {
  name: string
  phase1: string
  phase2: string
  phase3: string
}

export type PromptTemplatesMap = Record<string, PromptTemplate>

const DEFAULT_TEMPLATES: PromptTemplatesMap = {
  default: {
    name: 'Default Template',
    phase1: `You are helping an author plan a research-intensive non-fiction book.

Tasks:
1. Understand their topic and refine the scope
2. Identify similar existing works
3. Define target audience and research depth
4. Create a structured research plan with sections and items to research
5. Define what information fields to collect for each item

When ready, output JSON only in this format (no other fields):

{
  "bookPlan": { "topic": "...", "angle": "...", "audience": "...", "depth": "..." },
  "similarWorks": [{"title": "...", "author": "...", "howItsDifferent": "..."}],
  "researchPlan": {
    "sections": [{"title": "...", "description": "...", "itemsToResearch": ["..."]}],
    "researchFields": ["field1", "field2", ...]
  }
}

Be conversational and thorough.`,

    phase2: `You are researching items for a non-fiction book.

When the user asks you to research an item:
1. Gather thorough information from credible sources
2. Structure your research using the fields defined in the research plan
3. Provide complete source citations with full bibliographic details

For books: Author (Year). Title. Publisher. ISBN.
For websites: "Title" - Source. URL (Accessed: Date)
For articles: Author (Year). "Title". Journal, Volume(Issue), Pages.

Output research in clearly labeled sections matching the research fields.
Include a SOURCES section with numbered references.`,

    phase3: `You are fact-checking and verifying research for a non-fiction book.

Your tasks:
1. Review research items for accuracy
2. Check for contradictory information across sources
3. Verify source citations are complete and legitimate
4. Identify gaps in research coverage
5. Suggest corrections or additional research where needed

Be thorough and highlight any concerns about source quality or missing information.`,
  },
}

function ensureDefaultExists(templates: PromptTemplatesMap): PromptTemplatesMap {
  if (!templates.default) {
    return { ...DEFAULT_TEMPLATES, ...templates }
  }
  return templates
}

/** Load all templates from localStorage. Ensures default exists. */
export function loadTemplates(): PromptTemplatesMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = { ...DEFAULT_TEMPLATES }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw) as PromptTemplatesMap
    const withDefault = ensureDefaultExists(parsed)
    if (parsed !== withDefault) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withDefault))
    }
    return withDefault
  } catch {
    const initial = { ...DEFAULT_TEMPLATES }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }
}

/** Save templates to localStorage. */
export function saveTemplates(templates: PromptTemplatesMap): void {
  const withDefault = ensureDefaultExists(templates)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withDefault))
}

/** Get the selected template id from localStorage. */
export function getSelectedTemplateId(): string {
  try {
    const id = localStorage.getItem(SELECTED_KEY)
    if (id && id.length > 0) return id
  } catch {}
  return 'default'
}

/** Set the selected template id in localStorage. */
export function setSelectedTemplateId(id: string): void {
  localStorage.setItem(SELECTED_KEY, id)
}

/** Get system prompt for a phase from the selected template. */
export function getPhasePromptFromTemplate(
  phase: 1 | 2 | 3,
  templates: PromptTemplatesMap,
  selectedId: string
): string {
  const fallback = DEFAULT_TEMPLATES.default
  const t = templates[selectedId] ?? templates.default ?? fallback
  const key = `phase${phase}` as 'phase1' | 'phase2' | 'phase3'
  return t?.[key] ?? fallback[key]
}

/** Add a custom template. Returns the new template id. */
export function addCustomTemplate(
  templates: PromptTemplatesMap,
  name: string,
  phase1: string,
  phase2: string,
  phase3: string
): { templates: PromptTemplatesMap; id: string } {
  const id = `custom-${Date.now()}`
  const next: PromptTemplatesMap = {
    ...templates,
    [id]: { name, phase1, phase2, phase3 },
  }
  saveTemplates(next)
  return { templates: next, id }
}

/** Update an existing custom template. */
export function updateCustomTemplate(
  templates: PromptTemplatesMap,
  id: string,
  updates: Partial<PromptTemplate>
): PromptTemplatesMap {
  if (!templates[id]) return templates
  const next: PromptTemplatesMap = {
    ...templates,
    [id]: { ...templates[id], ...updates },
  }
  saveTemplates(next)
  return next
}
