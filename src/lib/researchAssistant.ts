import Anthropic from '@anthropic-ai/sdk'
import { hasActiveSubscription, trackTokenUsage } from './subscriptions'
import { supabase } from './supabase'

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
  onChunk: (text: string) => void,
  customSystemPrompt?: string
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('Anthropic API key not found. Please add your Anthropic API key in Settings to use the research assistant.')
  }

  // Check subscription status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to use AI features.')
  }

  const hasSubscription = await hasActiveSubscription(user.id)
  if (!hasSubscription) {
    throw new Error('You need an active subscription to use AI features. Please subscribe to continue.')
  }

  const client = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  })

  const systemPrompt = customSystemPrompt || SYSTEM_PROMPT

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
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

    // Get final message with usage information
    const finalMessage = await stream.finalMessage()
    
    // Track token usage
    if (finalMessage.usage) {
      const totalTokens = finalMessage.usage.input_tokens + finalMessage.usage.output_tokens
      try {
        await trackTokenUsage(user.id, totalTokens)
      } catch (tokenError: any) {
        // If token tracking fails, still return the content but log the error
        console.error('Failed to track token usage:', tokenError)
        // Re-throw if it's a limit exceeded error
        if (tokenError.message?.includes('Token limit exceeded')) {
          throw tokenError
        }
      }
    }

    return fullResponse
  } catch (error: any) {
    // Handle specific error types
    if (error?.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.')
    }
    if (error?.status === 401 || error?.message?.includes('invalid x-api-key') || error?.message?.includes('authentication_error')) {
      throw new Error('Invalid API key. Please check that your API key is correct and starts with "sk-ant-". Update it in Settings.')
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

  // Check subscription status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to use AI features.')
  }

  const hasSubscription = await hasActiveSubscription(user.id)
  if (!hasSubscription) {
    throw new Error('You need an active subscription to use AI features. Please subscribe to continue.')
  }

  const client = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
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

    // Track token usage
    if (response.usage) {
      const totalTokens = response.usage.input_tokens + response.usage.output_tokens
      try {
        await trackTokenUsage(user.id, totalTokens)
      } catch (tokenError: any) {
        // If token tracking fails, still return the content but log the error
        console.error('Failed to track token usage:', tokenError)
        // Re-throw if it's a limit exceeded error
        if (tokenError.message?.includes('Token limit exceeded')) {
          throw tokenError
        }
      }
    }

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
    if (error?.status === 401 || error?.message?.includes('invalid x-api-key') || error?.message?.includes('authentication_error')) {
      throw new Error('Invalid API key. Please check that your API key is correct and starts with "sk-ant-". Update it in Settings.')
    }
    if (error?.message) {
      throw new Error(`Failed to connect to Claude: ${error.message}`)
    }
    throw new Error('Failed to connect to Claude. Please check your API key and try again.')
  }
}

export interface MessageToSummarize {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/**
 * Summarize a slice of conversation for rolling summarization.
 * Returns a single assistant message with [Previous conversation summary: ...].
 */
export async function summarizeMessages(
  messagesToSummarize: MessageToSummarize[]
): Promise<{ role: 'assistant'; content: string }> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('Anthropic API key not found. Please add your Anthropic API key in Settings.')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to use AI features.')
  }

  const hasSubscription = await hasActiveSubscription(user.id)
  if (!hasSubscription) {
    throw new Error('You need an active subscription to use AI features.')
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  const conversationText = messagesToSummarize
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n\n')

  const userPrompt = `Summarize this conversation concisely in 2-3 sentences:

${conversationText}

Focus on: what was discussed, what actions were taken, and what research was completed.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: userPrompt }],
    })

    if (response.usage) {
      const totalTokens = response.usage.input_tokens + response.usage.output_tokens
      try {
        await trackTokenUsage(user.id, totalTokens)
      } catch (tokenError: any) {
        console.error('Failed to track token usage:', tokenError)
        if (tokenError.message?.includes('Token limit exceeded')) throw tokenError
      }
    }

    const block = response.content[0]
    const summary = block?.type === 'text' ? block.text : ''
    return {
      role: 'assistant',
      content: `[Previous conversation summary: ${summary}]`,
    }
  } catch (error: any) {
    if (error?.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.')
    }
    if (error?.status === 401 || error?.message?.includes('invalid x-api-key') || error?.message?.includes('authentication_error')) {
      throw new Error('Invalid API key. Please check your API key in Settings.')
    }
    throw new Error(`Failed to summarize conversation: ${error?.message || 'Unknown error'}`)
  }
}
