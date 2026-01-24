import { useState, useRef, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useProject } from '@/contexts/ProjectContext'
import ResearchDatabaseContent from '@/components/ResearchDatabaseContent'
import ResearchPlanModal from '@/components/ResearchPlanModal'
import { sendMessageToClaude, hasApiKey, summarizeMessages, ChatMessage as APIChatMessage } from '@/lib/researchAssistant'
import { getPhaseName, parsePhase1JSON } from '@/lib/researchPhases'
import {
  loadTemplates,
  getSelectedTemplateId,
  setSelectedTemplateId as persistSelectedTemplateId,
  getPhasePromptFromTemplate,
  addCustomTemplate,
  type PromptTemplatesMap,
} from '@/lib/promptTemplates'
import { createResearchStructure, findResearchItemByName, saveResearch, updateResearchData, ResearchItem } from '@/lib/researchItems'
import { extractItemName, extractEditCommand, parseResearchOutput } from '@/lib/researchParser'
import {
  loadChatMessages,
  saveChatMessage,
  deleteAllChatMessages,
  deleteChatMessagesByIds,
  ChatMessage as DBChatMessage,
} from '@/lib/chatMessages'
import ResearchPreviewModal from '@/components/ResearchPreviewModal'
import ResearchEditPreviewModal from '@/components/ResearchEditPreviewModal'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isSummary?: boolean
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
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isGeneratingResearchStructure, setIsGeneratingResearchStructure] = useState(false)
  const [structureError, setStructureError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<PromptTemplatesMap>(() => loadTemplates())
  const [selectedTemplateId, setSelectedTemplateIdState] = useState<string>(() => getSelectedTemplateId())
  const [showTemplatePopup, setShowTemplatePopup] = useState(false)
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
  const [createTemplateName, setCreateTemplateName] = useState('')
  const [createTemplatePhase1, setCreateTemplatePhase1] = useState('')
  const [createTemplatePhase2, setCreateTemplatePhase2] = useState('')
  const [createTemplatePhase3, setCreateTemplatePhase3] = useState('')
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set())
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const setSelectedTemplateId = (id: string) => {
    setSelectedTemplateIdState(id)
    persistSelectedTemplateId(id)
  }

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  // Load session data on mount
  useEffect(() => {
    if (projectId) {
      loadSessionData()
    }
  }, [projectId])

  // Load chat messages from database after session data is loaded
  useEffect(() => {
    if (projectId && sessionData) {
      loadMessagesFromDatabase()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, sessionData])

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

  const loadMessagesFromDatabase = async () => {
    if (!projectId) return
    
    const { data, error } = await loadChatMessages(projectId)
    
    if (error) {
      console.error('Error loading chat messages:', error)
      // If there's an error, initialize with default message
      initializeDefaultMessage()
      return
    }

    if (data && data.length > 0) {
      const loadedMessages: ChatMessage[] = data.map((msg: DBChatMessage) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isSummary: !!msg.is_summary,
      }))
      setMessages(loadedMessages)
    } else {
      // No messages in database, initialize with default message
      initializeDefaultMessage()
    }
  }

  const initializeDefaultMessage = () => {
    if (messages.length > 0) return // Don't overwrite if messages already exist
    
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
      const phaseName = getPhaseName(sessionData?.currentPhase || 1)
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Hi! I'm here to help you research your book. We're currently in ${phaseName}. ${sessionData?.currentPhase === 1 ? "Let's start by understanding what you want to write about. What's your book topic?" : "How can I help you with this phase?"}`,
          timestamp: new Date(),
        },
      ])
    }
  }

  // Helper function to add a message and save it to the database
  const addMessage = async (message: ChatMessage, saveToDb: boolean = true) => {
    setMessages((prev) => [...prev, message])
    if (saveToDb && projectId) {
      await saveChatMessage(projectId, currentPhase, message.role, message.content)
    }
  }

  const initializeSessionData = () => {
    if (!projectId) return
    const defaultData = {
      currentPhase: 1,
      phases: {
        phase1: { status: 'not_started' as const },
        phase2: {
          status: 'not_started' as const,
          summary: 'Conduct thorough research on the book topic',
        },
        phase3: {
          status: 'not_started' as const,
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
      setIsGeneratingResearchStructure(true)
      setStructureError(null)

      const { error, itemCount: count } = await createResearchStructure(parsed.researchPlan, projectId)

      if (error) {
        console.error('Error creating research structure:', error)
        setIsGeneratingResearchStructure(false)
        setStructureError('Failed to create research structure. Please try again.')
        // Add error message to chat
        const errorMessage: ChatMessage = {
          id: (Date.now() + 3).toString(),
          role: 'assistant',
          content: 'Failed to create research structure. Please try again.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
        if (projectId) {
          await saveChatMessage(projectId, currentPhase, 'assistant', errorMessage.content)
        }
        return
      }

      setIsGeneratingResearchStructure(false)
      setStructureError(null)
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
        if (projectId) {
          await saveChatMessage(projectId, currentPhase, 'assistant', successMessage.content)
        }
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
      if (projectId) {
        await saveChatMessage(projectId, currentPhase, 'assistant', errorMessage.content)
      }
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

SOURCES:
[1] First source citation with complete bibliographic details...
[2] Second source citation with complete bibliographic details...

Make sure to include all relevant information, sources with complete citations, and context.`

    setIsTyping(true)

    try {
      // Send research request to Claude
      const apiMessages: APIChatMessage[] = [
        {
          role: 'user',
          content: researchPrompt,
        },
      ]

      const systemPrompt = getPhasePromptFromTemplate(
        currentPhase as 1 | 2 | 3,
        templates,
        selectedTemplateId
      )

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
        await addMessage(errorMessage)
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
      await addMessage(errorMessage)
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
      await addMessage(errorMessage)
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
    await addMessage(successMessage)

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

SOURCES:
[1] First source citation with complete bibliographic details...
[2] Second source citation with complete bibliographic details...

Make sure to include all relevant information, sources with complete citations, and context.`

      const apiMessages: APIChatMessage[] = [
        {
          role: 'user',
          content: researchPrompt,
        },
      ]

      const systemPrompt = getPhasePromptFromTemplate(
        currentPhase as 1 | 2 | 3,
        templates,
        selectedTemplateId
      )

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
        await addMessage(errorMessage)
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
      await addMessage(errorMessage)
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
      await addMessage(errorMessage)
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

      const systemPrompt = getPhasePromptFromTemplate(
        currentPhase as 1 | 2 | 3,
        templates,
        selectedTemplateId
      )

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
        await addMessage(errorMessage)
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
      await addMessage(errorMessage)
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
      await addMessage(errorMessage)
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
    await addMessage(successMessage)

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

      const systemPrompt = getPhasePromptFromTemplate(
        currentPhase as 1 | 2 | 3,
        templates,
        selectedTemplateId
      )

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
        await addMessage(errorMessage)
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
      await addMessage(errorMessage)
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
      await addMessage(errorMessage)
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

    // Disable send immediately to prevent duplicate submissions
    setIsTyping(true)

    // Rolling summarization: if > 5 messages, summarize oldest 5 and replace
    let currentMessages = messages
    if (projectId && currentMessages.length > 5) {
      try {
        const toSummarize = currentMessages.slice(0, 5)
        const summary = await summarizeMessages(toSummarize)
        const { error: saveErr } = await saveChatMessage(
          projectId,
          currentPhase,
          'assistant',
          summary.content,
          true
        )
        if (saveErr) throw saveErr
        const { error: delErr } = await deleteChatMessagesByIds(
          projectId,
          toSummarize.map((m) => m.id)
        )
        if (delErr) throw delErr
        const { data: reloaded, error: loadErr } = await loadChatMessages(projectId)
        if (loadErr || !reloaded) throw loadErr || new Error('Failed to reload messages')
        currentMessages = reloaded.map((msg: DBChatMessage) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          isSummary: !!msg.is_summary,
        }))
        setMessages(currentMessages)
      } catch (err) {
        console.error('Rolling summarization failed, continuing with full history:', err)
        // Keep currentMessages as-is; no summarization
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    if (projectId) {
      await saveChatMessage(projectId, currentPhase, 'user', userInput)
    }

    setInputValue('')

    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const apiMessages: APIChatMessage[] = currentMessages
        .filter((msg) => msg.role !== 'assistant' || !msg.content.includes('Please add your Anthropic API key'))
        .map((msg) => ({ role: msg.role, content: msg.content }))
      apiMessages.push({ role: 'user', content: userMessage.content })

      let accumulatedContent = ''

      // Get phase-specific system prompt
      const systemPrompt = getPhasePromptFromTemplate(
        currentPhase as 1 | 2 | 3,
        templates,
        selectedTemplateId
      )

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

      // Save assistant message to database
      if (projectId && accumulatedContent) {
        await saveChatMessage(projectId, currentPhase, 'assistant', accumulatedContent)
      }

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
      await addMessage(errorMessage)
    } finally {
      setIsTyping(false)
    }
  }

  const handleSaveCustomTemplate = () => {
    const name = createTemplateName.trim()
    if (!name) return
    const { templates: next, id } = addCustomTemplate(
      templates,
      name,
      createTemplatePhase1,
      createTemplatePhase2,
      createTemplatePhase3
    )
    setTemplates(next)
    setSelectedTemplateId(id)
    setShowCreateTemplateModal(false)
  }

  const handleClearChat = async () => {
    if (!projectId) return
    
    const { error } = await deleteAllChatMessages(projectId)
    
    if (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Failed to clear chat history. Please try again.',
        timestamp: new Date(),
      }
      await addMessage(errorMessage, false) // Don't save this error message
      return
    }

    // Clear messages and reinitialize
    setMessages([])
    initializeDefaultMessage()
    setShowClearConfirm(false)
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
            <ResearchDatabaseContent
              embedded={true}
              generatingStructure={isGeneratingResearchStructure}
              structureError={structureError}
            />
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  title="Clear chat history"
                >
                  Clear Chat
                </button>
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Research Plan
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTemplatePopup((p) => !p)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Templates
                </button>
                {showTemplatePopup && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      aria-hidden="true"
                      onClick={() => setShowTemplatePopup(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                      <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Prompt template
                      </div>
                      {Object.entries(templates).map(([id, t]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplateId(id)
                            setShowTemplatePopup(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                            selectedTemplateId === id ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const d = templates.default
                            setCreateTemplateName('My Template')
                            setCreateTemplatePhase1(d.phase1)
                            setCreateTemplatePhase2(d.phase2)
                            setCreateTemplatePhase3(d.phase3)
                            setShowTemplatePopup(false)
                            setShowCreateTemplateModal(true)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 font-medium"
                        >
                          + Create Custom Template
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Chat Messages - Scrollable */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message) => {
              const isSummary = !!message.isSummary
              const isExpanded = expandedSummaries.has(message.id)
              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : isSummary
                          ? 'bg-gray-50 text-gray-600 border border-gray-200'
                          : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {isSummary ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedSummaries((prev) => {
                              const next = new Set(prev)
                              if (next.has(message.id)) next.delete(message.id)
                              else next.add(message.id)
                              return next
                            })
                          }}
                          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 mb-1"
                        >
                          <span>[Summary]</span>
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <p className="text-sm whitespace-pre-wrap italic">{message.content}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              )
            })}

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isTyping) {
                    e.preventDefault()
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[5rem]"
              >
                {isTyping ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  'Send'
                )}
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
          templates={templates}
          selectedTemplateId={selectedTemplateId}
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

      {/* Create Custom Template Modal */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Custom Template</h3>
              <button
                onClick={() => setShowCreateTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label htmlFor="create-template-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  id="create-template-name"
                  type="text"
                  value={createTemplateName}
                  onChange={(e) => setCreateTemplateName(e.target.value)}
                  placeholder="e.g. Academic Research"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="create-template-phase1" className="block text-sm font-medium text-gray-700 mb-1">
                  Phase 1 Prompt
                </label>
                <textarea
                  id="create-template-phase1"
                  rows={6}
                  value={createTemplatePhase1}
                  onChange={(e) => setCreateTemplatePhase1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
              </div>
              <div>
                <label htmlFor="create-template-phase2" className="block text-sm font-medium text-gray-700 mb-1">
                  Phase 2 Prompt
                </label>
                <textarea
                  id="create-template-phase2"
                  rows={6}
                  value={createTemplatePhase2}
                  onChange={(e) => setCreateTemplatePhase2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
              </div>
              <div>
                <label htmlFor="create-template-phase3" className="block text-sm font-medium text-gray-700 mb-1">
                  Phase 3 Prompt
                </label>
                <textarea
                  id="create-template-phase3"
                  rows={6}
                  value={createTemplatePhase3}
                  onChange={(e) => setCreateTemplatePhase3(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowCreateTemplateModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomTemplate}
                disabled={!createTemplateName.trim()}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Clear Chat History</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to clear all chat messages? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
