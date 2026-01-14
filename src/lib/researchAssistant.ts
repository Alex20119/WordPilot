import Anthropic from '@anthropic-ai/sdk'

const ANTHROPIC_API_KEY_STORAGE_KEY = 'anthropic_api_key'

const SYSTEM_PROMPT = `You are an AI research assistant helping an author plan and conduct research for their non-fiction book. Your job is to:

1. Help the user define their book topic and structure
2. Create a research plan with chapters and items to research
3. Conduct thorough research on each item when requested
4. Output research in structured format with fields the user defines

Be conversational, helpful, and thorough. Start by understanding what they want to write about.`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Get the API key from localStorage
 */
export function getApiKey(): string | null {
  return localStorage.getItem(ANTHROPIC_API_KEY_STORAGE_KEY)
}

/**
 * Check if API key is set
 */
export function hasApiKey(): boolean {
  return !!getApiKey()
}

/**
 * Send a message to Claude and get a streaming response
 */
export async function sendMessageToClaude(
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('Anthropic API key not found. Please add your Anthropic API key in Settings to use the research assistant.')
  }

  const client = new Anthropic({
    apiKey: apiKey,
  })

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    let fullResponse = ''

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text
        fullResponse += text
        onChunk(text)
      }
    }

    return fullResponse
  } catch (error: any) {
    // Handle specific error types
    if (error?.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.')
    }
    if (error?.status === 401) {
      throw new Error('Invalid API key. Please check your API key in Settings.')
    }
    if (error?.message) {
      throw new Error(`Failed to connect to Claude: ${error.message}`)
    }
    throw new Error('Failed to connect to Claude. Please check your API key and try again.')
  }
}

/**
 * Send a message to Claude and get a complete response (non-streaming fallback)
 */
export async function sendMessageToClaudeComplete(messages: ChatMessage[]): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('Anthropic API key not found. Please add your Anthropic API key in Settings to use the research assistant.')
  }

  const client = new Anthropic({
    apiKey: apiKey,
  })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    }

    throw new Error('Unexpected response format from Claude')
  } catch (error: any) {
    // Handle specific error types
    if (error?.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.')
    }
    if (error?.status === 401) {
      throw new Error('Invalid API key. Please check your API key in Settings.')
    }
    if (error?.message) {
      throw new Error(`Failed to connect to Claude: ${error.message}`)
    }
    throw new Error('Failed to connect to Claude. Please check your API key and try again.')
  }
}
