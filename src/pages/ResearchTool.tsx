import { useState, useRef, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useProject } from '@/contexts/ProjectContext'
import ResearchDatabaseContent from '@/components/ResearchDatabaseContent'
import { sendMessageToClaude, hasApiKey, ChatMessage as APIChatMessage } from '@/lib/researchAssistant'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ResearchTool() {
  const { user, signOut } = useAuth()
  const { projectId } = useParams<{ projectId: string }>()
  const { project, loading } = useProject()
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Check if API key exists on mount
    if (!hasApiKey()) {
      return [
        {
          id: '1',
          role: 'assistant',
          content: 'Please add your Anthropic API key in Settings to use the research assistant.',
          timestamp: new Date(),
        },
      ]
    }
    return [
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm here to help you research your book. Let's start by understanding what you want to write about. What's your book topic?",
        timestamp: new Date(),
      },
    ]
  })
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isTyping) return

    // Check for API key
    if (!hasApiKey()) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Please add your Anthropic API key in Settings to use the research assistant.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Create a placeholder assistant message that we'll update as we stream
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      // Convert messages to API format (exclude the current streaming message)
      const apiMessages: APIChatMessage[] = messages
        .filter((msg) => msg.role !== 'assistant' || !msg.content.includes('Please add your Anthropic API key'))
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))
      apiMessages.push({
        role: 'user',
        content: userMessage.content,
      })

      let accumulatedContent = ''

      // Stream the response
      await sendMessageToClaude(apiMessages, (chunk: string) => {
        accumulatedContent += chunk
        // Update the message in real-time using functional update to get latest state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        )
      })

      // Finalize the message (already done in the stream callback, but ensure it's set)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedContent }
            : msg
        )
      )
    } catch (error: any) {
      // Remove the empty assistant message
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId))
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: error.message || 'Failed to connect to Claude. Please check your API key and try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <nav className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                Word Pilot
              </Link>
              <Link
                to={`/project/${projectId}/research`}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Research
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/settings"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Settings
              </Link>
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - 60% */}
        <div className="w-[60%] flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          {/* Research Plan Panel - Top */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Research Plan</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600">
                No research plan yet. Chat with Claude on the right to create your research structure.
              </p>
            </div>
          </div>

          {/* Research Database - Bottom */}
          <div className="flex-1 overflow-y-auto p-4">
            <ResearchDatabaseContent embedded={true} />
          </div>
        </div>

        {/* Right Side - 40% - Chat Interface */}
        <div className="w-[40%] flex flex-col bg-white overflow-hidden">
          {/* Chat Header */}
          <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Research Assistant</h2>
            <p className="text-sm text-gray-600">{project.title}</p>
          </div>

          {/* Chat Messages - Scrollable */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">Claude is typing</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input - Bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
