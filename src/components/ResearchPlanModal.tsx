import { useState, useEffect } from 'react'

interface ResearchSessionData {
  currentPhase: number
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
  phases: {
    phase1: {
      status: 'complete' | 'in_progress' | 'not_started'
      stockPrompt: string
      completedAt?: string
    }
    phase2: {
      status: 'complete' | 'in_progress' | 'not_started'
      generatedPrompt?: string
      summary: string
    }
    phase3: {
      status: 'complete' | 'in_progress' | 'not_started'
      generatedPrompt?: string
      summary: string
    }
  }
  researchPlan?: {
    sections?: Array<{
      title?: string
      description?: string
      itemsToResearch?: string[]
    }>
    researchFields?: string[]
  }
  // Legacy support for old data structure
  decisions?: {
    bookTopic?: string
    angle?: string
    audience?: string
    depth?: string
  }
}

interface ResearchPlanModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  refreshTrigger?: number // Increment this to force refresh
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

export default function ResearchPlanModal({ isOpen, onClose, projectId, refreshTrigger }: ResearchPlanModalProps) {
  const [sessionData, setSessionData] = useState<ResearchSessionData | null>(null)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]))

  useEffect(() => {
    if (isOpen && projectId) {
      loadSessionData()
    }
  }, [isOpen, projectId, refreshTrigger])

  const loadSessionData = () => {
    const stored = localStorage.getItem(`research-session-${projectId}`)
    if (stored) {
      try {
        setSessionData(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading session data:', error)
      }
    } else {
      // Initialize default structure
      const defaultData: ResearchSessionData = {
        currentPhase: 1,
        phases: {
          phase1: {
            status: 'not_started',
            stockPrompt: PHASE_1_STOCK_PROMPT,
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
  }

  const saveSessionData = (data: ResearchSessionData) => {
    localStorage.setItem(`research-session-${projectId}`, JSON.stringify(data))
  }

  const togglePhase = (phaseNumber: number) => {
    setExpandedPhases((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(phaseNumber)) {
        newSet.delete(phaseNumber)
      } else {
        newSet.add(phaseNumber)
      }
      return newSet
    })
  }

  const getStatusIcon = (status: 'complete' | 'in_progress' | 'not_started') => {
    if (status === 'complete') {
      return (
        <span className="text-green-600" title="Complete">
          ✓
        </span>
      )
    }
    if (status === 'in_progress') {
      return (
        <span className="text-blue-600 animate-spin" title="In Progress">
          ⟳
        </span>
      )
    }
    return (
      <span className="text-gray-400" title="Not Started">
        ○
      </span>
    )
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const bookPlan = sessionData?.bookPlan
  const decisions = sessionData?.decisions // Legacy support
  const phases = sessionData?.phases
  const similarWorks = sessionData?.similarWorks
  const researchPlan = sessionData?.researchPlan

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Research Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* TOP SECTION - Research Overview */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Overview</h3>
            {(bookPlan?.topic || decisions?.bookTopic) ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Book Topic:</span>
                  <p className="text-gray-900 mt-1">{bookPlan?.topic || decisions?.bookTopic}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Angle:</span>
                  <p className="text-gray-900 mt-1">{bookPlan?.angle || decisions?.angle}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Audience:</span>
                  <p className="text-gray-900 mt-1">{bookPlan?.audience || decisions?.audience}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Research Depth:</span>
                  <p className="text-gray-900 mt-1">{bookPlan?.depth || decisions?.depth}</p>
                </div>
                {bookPlan?.scope && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Scope:</span>
                    <p className="text-gray-900 mt-1">{bookPlan.scope}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">No research plan yet. Complete Phase 1 to create your plan.</p>
            )}
          </div>

          {/* MIDDLE SECTION - Phase Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Instructions</h3>
            
            {/* Phase 1 */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => togglePhase(1)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedPhases.has(1) ? (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <span className="font-medium text-gray-900">Phase 1: Planning</span>
                  {phases?.phase1 && getStatusIcon(phases.phase1.status)}
                </div>
              </button>
              {expandedPhases.has(1) && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Stock Prompt:</h4>
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {PHASE_1_STOCK_PROMPT}
                    </div>
                  </div>
                  {(bookPlan?.topic || decisions?.bookTopic) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Decisions Made:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Topic: {bookPlan?.topic || decisions?.bookTopic}</li>
                        <li>Angle: {bookPlan?.angle || decisions?.angle}</li>
                        <li>Audience: {bookPlan?.audience || decisions?.audience}</li>
                        <li>Depth: {bookPlan?.depth || decisions?.depth}</li>
                        {bookPlan?.scope && <li>Scope: {bookPlan.scope}</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Phase 2 */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => togglePhase(2)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedPhases.has(2) ? (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Phase 2: Research</span>
                    <span className="text-sm text-gray-500">- {phases?.phase2.summary}</span>
                  </div>
                  {phases?.phase2 && getStatusIcon(phases.phase2.status)}
                </div>
              </button>
              {expandedPhases.has(2) && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Prompt:</h4>
                  {phases?.phase2.generatedPrompt ? (
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {phases.phase2.generatedPrompt}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Waiting for Phase 1 to complete...</p>
                  )}
                </div>
              )}
            </div>

            {/* Phase 3 */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => togglePhase(3)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedPhases.has(3) ? (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Phase 3: Fact Checking</span>
                    <span className="text-sm text-gray-500">- {phases?.phase3.summary}</span>
                  </div>
                  {phases?.phase3 && getStatusIcon(phases.phase3.status)}
                </div>
              </button>
              {expandedPhases.has(3) && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Full Prompt:</h4>
                  {phases?.phase3.generatedPrompt ? (
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {phases.phase3.generatedPrompt}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Waiting for Phase 1 to complete...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Similar Works Section */}
          {similarWorks && similarWorks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Works</h3>
              <div className="space-y-3">
                {similarWorks.map((work, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900">{work.title}</h4>
                    {work.author && <p className="text-sm text-gray-600">by {work.author}</p>}
                    {work.howItsDifferent && (
                      <p className="text-sm text-gray-700 mt-2">{work.howItsDifferent}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTTOM SECTION - Research Structure */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Structure</h3>
            {researchPlan?.sections && researchPlan.sections.length > 0 ? (
              <div className="space-y-3">
                {researchPlan.sections.map((section, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">{section.title}</h4>
                    {section.description && (
                      <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                    )}
                    {section.itemsToResearch && section.itemsToResearch.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Items to Research:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {section.itemsToResearch.map((item, itemIndex) => (
                            <li key={itemIndex}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                {researchPlan.researchFields && researchPlan.researchFields.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">Research Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {researchPlan.researchFields.map((field, fieldIndex) => (
                        <span key={fieldIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-600">No research structure yet. Complete Phase 1 to create your structure.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
