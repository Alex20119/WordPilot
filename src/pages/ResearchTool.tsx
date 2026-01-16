import { useState, useRef, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useProject } from '@/contexts/ProjectContext'
import ResearchDatabaseContent from '@/components/ResearchDatabaseContent'
import ResearchPlanModal from '@/components/ResearchPlanModal'
import { sendMessageToClaude, hasApiKey, ChatMessage as APIChatMessage } from '@/lib/researchAssistant'
import { getPhaseSystemPrompt, getPhaseName, parsePhase1JSON } from '@/lib/researchPhases'
import { createResearchStructure, findResearchItemByName, saveResearch, updateResearchData, ResearchItem } from '@/lib/researchItems'
import { extractItemName, extractEditCommand, parseResearchOutput } from '@/lib/researchParser'
import ResearchPreviewModal from '@/components/ResearchPreviewModal'
import ResearchEditPreviewModal from '@/components/ResearchEditPreviewModal'

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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [currentPhase, setCurrentPhase] = useState(1)
  const [sessionData, setSessionData] = useState<any>(null)
  const [modalRefreshTrigger, setModalRefreshTrigger] = useState(0)
  const [showResearchPreview, setShowResearchPreview] = useState(false)
  const [previewData, setPreviewData] = useState<{
    item: ResearchItem
    researchData: Record<string, string>
  } | null>(null)
  const [showEditPreview, setShowEditPreview] = useState(false)
  const [editPreviewData, setEditPreviewData] = useState<{
    item: ResearchItem
    originalData: Record<string, string>
    editedData: Record<string, string>
  } | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  // Load session data on mount and initialize messages
  useEffect(() => {
    if (projectId) {
      loadSessionData()
    }
  }, [projectId])

  // Initialize messages after session data is loaded
  useEffect(() => {
    if (sessionData && messages.length === 0) {
      if (!hasApiKey()) {
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: 'Please add your Anthropic API key in Settings to use the research assistant.',
            timestamp: new Date(),
          },
        ])
      } else {
        const phaseName = getPhaseName(sessionData.currentPhase || 1)
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: `Hi! I'm here to help you research your book. We're currently in ${phaseName}. ${sessionData.currentPhase === 1 ? "Let's start by understanding what you want to write about. What's your book topic?" : "How can I help you with this phase?"}`,
            timestamp: new Date(),
          },
        ])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData])

  const loadSessionData = () => {
    if (!projectId) return
    const stored = localStorage.getItem(`research-session-${projectId}`)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        setSessionData(data)
        setCurrentPhase(data.currentPhase || 1)
      } catch (error) {
        console.error('Error loading session data:', error)
        initializeSessionData()
      }
    } else {
      initializeSessionData()
    }
  }

  const initializeSessionData = () => {
    if (!projectId) return
    const defaultData = {
      currentPhase: 1,
      phases: {
        phase1: {
          status: 'not_started',
          stockPrompt: `You are helping an author plan a research-intensive non-fiction book. Phase 1 covers all planning activities before research begins.

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

Start by understanding what stage they're at: Do they have a clear topic or are they still developing their idea?`,
        },
        phase2: {
          status: 'not_started',
          summary: 'Conduct thorough research on the book topic',
        },
        phase3: {
          status: 'not_started',
          summary: 'Verify sources, check for gaps, resolve contradictions',
        },
      },
    }
    setSessionData(defaultData)
    saveSessionData(defaultData)
  }

  const saveSessionData = (data: any) => {
    if (!projectId) return
    localStorage.setItem(`research-session-${projectId}`, JSON.stringify(data))
  }

  const handlePhaseChange = (newPhase: number) => {
    setCurrentPhase(newPhase)
    if (sessionData) {
      const updated = { ...sessionData, currentPhase: newPhase }
      setSessionData(updated)
      saveSessionData(updated)
    }
  }

  const parseAndSavePhase1Data = async (content: string) => {
    const parsed = parsePhase1JSON(content)
    if (!parsed || !sessionData || !projectId) return

    // Validate required fields
    if (!parsed.bookPlan || !parsed.researchPlan) {
      console.warn('Phase 1 JSON missing required fields (bookPlan or researchPlan)')
      return
    }

    // Create research structure in database if research plan exists
    let itemCount = 0
    if (parsed.researchPlan && parsed.researchPlan.sections) {
      const { error, itemCount: count } = await createResearchStructure(parsed.researchPlan, projectId)
      
      if (error) {
        console.error('Error creating research structure:', error)
        // Add error message to chat
        const errorMessage: ChatMessage = {
          id: (Date.now() + 3).toString(),
          role: 'assistant',
          content: 'Failed to create research structure. Please try again.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        return
      }
      
      itemCount = count
      
      // Add success message to chat if items were created
      if (itemCount > 0) {
        const successMessage: ChatMessage = {
          id: (Date.now() + 4).toString(),
          role: 'assistant',
          content: `Research structure created! ${itemCount} item${itemCount === 1 ? '' : 's'} added to your research plan. You can now see them in the Research Database on the left.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, successMessage])
      }
    }

    const updated = {
      ...sessionData,
      bookPlan: parsed.bookPlan,
      similarWorks: parsed.similarWorks,
      researchPlan: parsed.researchPlan,
      phases: {
        ...sessionData.phases,
        phase1: {
          ...sessionData.phases.phase1,
          status: 'complete' as const,
          completedAt: new Date().toISOString(),
        },
        phase2: {
          ...sessionData.phases.phase2,
          generatedPrompt: parsed.phase2Prompt,
        },
      },
    }
    setSessionData(updated)
    saveSessionData(updated)
    setModalRefreshTrigger((prev) => prev + 1)
  }

  const performResearch = async (itemName: string) => {
    if (!projectId) return

    // Find the research item
    const { data: item, error: findError } = await findResearchItemByName(itemName, projectId)

    if (findError || !item) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I couldn't find "${itemName}" in your research plan. Would you like me to add it to your research plan?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      return
    }

    // Get research fields from Phase 1
    const researchFields = sessionData?.researchPlan?.researchFields || []

    // Build research prompt
    const researchPrompt = `Research '${item.name}' from section '${item.section}'. ${
      researchFields.length > 0
        ? `Cover these fields: ${researchFields.join(', ')}. `
        : ''
    }Output your findings in structured format with each field clearly labeled. Use this format:

FIELD_NAME:
Content for this field...

Make sure to include all relevant information, sources, and context.`

    setIsTyping(true)

    try {
      // Send research request to Claude
      const apiMessages: APIChatMessage[] = [
        {
          role: 'user',
          content: researchPrompt,
        },
      ]

      const systemPrompt = getPhaseSystemPrompt(currentPhase, sessionData)

      let accumulatedContent = ''

      await sendMessageToClaude(apiMessages, (chunk: string) => {
        accumulatedContent += chunk
      }, systemPrompt)

      // Parse research output
      const researchData = parseResearchOutput(accumulatedContent)

      if (!researchData || Object.keys(researchData).length === 0) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I had trouble parsing the research output. Please try again or ask me to research in a different format.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setIsTyping(false)
        return
      }

      // Show preview modal
      setPreviewData({
        item,
        researchData,
      })
      setShowResearchPreview(true)
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: error.message || 'Failed to research the item. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleApproveResearch = async () => {
    if (!previewData || !projectId) return

    const { error } = await saveResearch(
      previewData.item.name,
      previewData.researchData,
      projectId
    )

    if (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Failed to save research. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setShowResearchPreview(false)
      setPreviewData(null)
      return
    }

    // Success message
    const successMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Research for "${previewData.item.name}" has been saved successfully! You can view it in the Research Database on the left.`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, successMessage])

    setShowResearchPreview(false)
    setPreviewData(null)
  }

  const handleRegenerateResearch = async () => {
    if (!previewData) return

    setIsRegenerating(true)

    try {
      const item = previewData.item
      const researchFields = sessionData?.researchPlan?.researchFields || []

      const researchPrompt = `Research '${item.name}' from section '${item.section}'. ${
        researchFields.length > 0
          ? `Cover these fields: ${researchFields.join(', ')}. `
          : ''
      }Output your findings in structured format with each field clearly labeled. Use this format:

FIELD_NAME:
Content for this field...

Make sure to include all relevant information, sources, and context.`

      const apiMessages: APIChatMessage[] = [
        {
          role: 'user',
          content: researchPrompt,
        },
      ]

      const systemPrompt = getPhaseSystemPrompt(currentPhase, sessionData)

      let accumulatedContent = ''

      await sendMessageToClaude(apiMessages, (chunk: string) => {
        accumulatedContent += chunk
      }, systemPrompt)

      const researchData = parseResearchOutput(accumulatedContent)

      if (!researchData || Object.keys(researchData).length === 0) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I had trouble parsing the research output. Please try again.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setShowResearchPreview(false)
        setPreviewData(null)
        return
      }

      setPreviewData({
        item,
        researchData,
      })
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: error.message || 'Failed to regenerate research. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsRegenerating(false)
    }
  }

  const performEdit = async (itemName: string, fieldName?: string) => {
    if (!projectId) return

    // Find the research item
    const { data: item, error: findError } = await findResearchItemByName(itemName, projectId)

    if (findError || !item) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I couldn't find "${itemName}" in your research plan.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      return
    }

    // Get current research data
    const currentData = item.data || {}

    // Build edit prompt
    let editPrompt = `Edit the research for '${item.name}' from section '${item.section}'. `
    
    if (fieldName && currentData[fieldName]) {
      editPrompt += `Focus on the field: ${fieldName.replace(/_/g, ' ')}. `
    }
    
    editPrompt += `\n\nCurrent research data:\n${JSON.stringify(currentData, null, 2)}\n\n`
    editPrompt += `Please suggest edits based on the user's request. Output the complete updated research in structured format with each field clearly labeled. Use this format:\n\n`
    editPrompt += `FIELD_NAME:\nUpdated content for this field...\n\n`
    editPrompt += `Include all fields, updating only the ones that need changes. Make sure the output is complete and accurate.`

    setIsTyping(true)

    try {
      // Send edit request to Claude
      const apiMessages: APIChatMessage[] = [
        {
          role: 'user',
          content: editPrompt,
        },
      ]

      const systemPrompt = getPhaseSystemPrompt(currentPhase, sessionData)

      let accumulatedContent = ''

      await sendMessageToClaude(apiMessages, (chunk: string) => {
        accumulatedContent += chunk
      }, systemPrompt)

      // Parse edited output
      const editedData = parseResearchOutput(accumulatedContent)

      if (!editedData || Object.keys(editedData).length === 0) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I had trouble parsing the edited research output. Please try again or ask me to edit in a different format.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setIsTyping(false)
        return
      }

      // Show edit preview modal
      setEditPreviewData({
        item,
        originalData: currentData as Record<string, string>,
        editedData,
      })
      setShowEditPreview(true)
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: error.message || 'Failed to edit the item. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleApproveEdit = async () => {
    if (!editPreviewData) return

    const { error } = await updateResearchData(
      editPreviewData.item.id,
      editPreviewData.editedData
    )

    if (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Failed to save edits. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setShowEditPreview(false)
      setEditPreviewData(null)
      return
    }

    // Success message
    const successMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Research for "${editPreviewData.item.name}" has been updated successfully! You can view the changes in the Research Database on the left.`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, successMessage])

    setShowEditPreview(false)
    setEditPreviewData(null)
  }

  const handleRegenerateEdit = async () => {
    if (!editPreviewData) return

    setIsRegenerating(true)

    try {
      const item = editPreviewData.item
      const originalData = editPreviewData.originalData

      // Build edit prompt
      let editPrompt = `Edit the research for '${item.name}' from section '${item.section}'. `
      editPrompt += `\n\nCurrent research data:\n${JSON.stringify(originalData, null, 2)}\n\n`
      editPrompt += `Please suggest edits based on the user's request. Output the complete updated research in structured format with each field clearly labeled. Use this format:\n\n`
      editPrompt += `FIELD_NAME:\nUpdated content for this field...\n\n`
      editPrompt += `Include all fields, updating only the ones that need changes. Make sure the output is complete and accurate.`

      const apiMessages: APIChatMessage[] = [
        {
          role: 'user',
          content: editPrompt,
        },
      ]

      const systemPrompt = getPhaseSystemPrompt(currentPhase, sessionData)

      let accumulatedContent = ''

      await sendMessageToClaude(apiMessages, (chunk: string) => {
        accumulatedContent += chunk
      }, systemPrompt)

      const editedData = parseResearchOutput(accumulatedContent)

      if (!editedData || Object.keys(editedData).length === 0) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I had trouble parsing the edited research output. Please try again.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setShowEditPreview(false)
        setEditPreviewData(null)
        return
      }

      setEditPreviewData({
        item,
        originalData,
        editedData,
      })
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: error.message || 'Failed to regenerate edits. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsRegenerating(false)
    }
  }

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

    const userInput = inputValue.trim()

    // Check if this is a research command (Phase 2 only)
    if (currentPhase === 2) {
      const itemName = extractItemName(userInput)
      if (itemName) {
        setInputValue('')
        await performResearch(itemName)
        return
      }
    }

    // Check if this is an edit command (Phase 3 only)
    if (currentPhase === 3) {
      const editCommand = extractEditCommand(userInput)
      if (editCommand) {
        setInputValue('')
        await performEdit(editCommand.itemName, editCommand.fieldName)
        return
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
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

      // Get phase-specific system prompt
      const systemPrompt = getPhaseSystemPrompt(currentPhase, sessionData)

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
      }, systemPrompt)

      // Finalize the message (already done in the stream callback, but ensure it's set)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedContent }
            : msg
        )
      )

      // Parse Phase 1 JSON if we're in Phase 1
      if (currentPhase === 1) {
        await parseAndSavePhase1Data(accumulatedContent)
      }
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
        {/* Left Side - Research Database Only */}
        <div className="w-[60%] flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <ResearchDatabaseContent embedded={true} />
          </div>
        </div>

        {/* Right Side - 40% - Chat Interface */}
        <div className="w-[40%] flex flex-col bg-white overflow-hidden">
          {/* Chat Header */}
          <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Research Assistant</h2>
                <p className="text-sm text-gray-600">{project.title}</p>
              </div>
              <button
                onClick={() => setShowPlanModal(true)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Research Plan
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="phase-selector" className="text-sm font-medium text-gray-700">
                Current Phase:
              </label>
              <select
                id="phase-selector"
                value={currentPhase}
                onChange={(e) => handlePhaseChange(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={1}>Phase 1: Planning</option>
                <option value={2}>Phase 2: Research</option>
                <option value={3}>Phase 3: Fact Checking</option>
              </select>
            </div>
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

      {/* Research Plan Modal */}
      {projectId && (
        <ResearchPlanModal
          isOpen={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          projectId={projectId}
          refreshTrigger={modalRefreshTrigger}
        />
      )}

      {/* Research Preview Modal */}
      {previewData && showResearchPreview && (
        <ResearchPreviewModal
          itemName={previewData.item.name}
          section={previewData.item.section}
          researchData={previewData.researchData}
          onApprove={handleApproveResearch}
          onRegenerate={handleRegenerateResearch}
          onCancel={() => {
            setShowResearchPreview(false)
            setPreviewData(null)
          }}
          isRegenerating={isRegenerating}
        />
      )}

      {/* Edit Preview Modal */}
      {editPreviewData && showEditPreview && (
        <ResearchEditPreviewModal
          itemName={editPreviewData.item.name}
          section={editPreviewData.item.section}
          originalData={editPreviewData.originalData}
          editedData={editPreviewData.editedData}
          onApprove={handleApproveEdit}
          onRegenerate={handleRegenerateEdit}
          onCancel={() => {
            setShowEditPreview(false)
            setEditPreviewData(null)
          }}
          isRegenerating={isRegenerating}
        />
      )}
    </div>
  )
}
