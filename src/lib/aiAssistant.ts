import Anthropic from '@anthropic-ai/sdk'
import { getBookSectionById, updateBookSection } from './bookSections'
import { calculateWordCount } from './bookSections'

const ANTHROPIC_API_KEY_STORAGE_KEY = 'anthropic_api_key'

export async function addResearchWithAI(
  researchText: string,
  sectionId: string
): Promise<string> {
  const apiKey = localStorage.getItem(ANTHROPIC_API_KEY_STORAGE_KEY)
  if (!apiKey) {
    throw new Error('Anthropic API key not found. Please set it in Settings.')
  }

  // Get current section content
  const section = await getBookSectionById(sectionId)
  const currentContent = section.content || ''

  const client = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  })

  const prompt = `You are helping integrate research facts into a book draft. 

Research fact to integrate:
${researchText}

Current draft content (may be empty):
${currentContent || '(Empty - this is a new section)'}

Task: Weave the research fact naturally into the existing draft. If the draft is empty, create a natural paragraph incorporating the fact. If the draft already has content, seamlessly integrate the new fact in a way that flows well with the existing text.

Requirements:
- Write in clear, engaging prose
- Maintain the existing writing style if content exists
- Do not use markdown formatting, just plain HTML paragraphs
- Keep the integration natural and contextual
- If adding to existing content, append the new content at the end

Return ONLY the complete, integrated text (including the original content plus the new addition) as HTML paragraphs. Do not include any explanation or meta-commentary.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    }

    throw new Error('Unexpected response format from AI')
  } catch (error: any) {
    if (error?.message) {
      throw new Error(error.message)
    }
    throw new Error('Failed to generate AI content')
  }
}

export async function saveAIContent(sectionId: string, htmlContent: string): Promise<void> {
  const wordCount = calculateWordCount(htmlContent)
  await updateBookSection(sectionId, {
    content: htmlContent,
    word_count: wordCount,
  })
}
