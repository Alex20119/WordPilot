import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useProject } from '@/contexts/ProjectContext'
import {
  getBookSections,
  createBookSection,
  updateBookSection,
  deleteBookSection,
  calculateWordCount,
} from '@/lib/bookSections'
import { BookSection } from '@/types/database.types'
import RichTextEditor from '@/components/RichTextEditor'
import ExportModal from '@/components/ExportModal'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

interface WritingContentProps {
  embedded?: boolean
}

export default function WritingContent({ embedded = false }: WritingContentProps) {
  const { user } = useAuth()
  const { projectId } = useProject()
  const [sections, setSections] = useState<BookSection[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)

  useEffect(() => {
    if (!projectId) return
    loadSections()
  }, [projectId])

  const loadSections = async () => {
    if (!projectId) return
    try {
      setLoading(true)
      const data = await getBookSections(projectId)
      setSections(data)
      // Start with all sections collapsed
      setExpandedSections(new Set())
    } catch (error) {
      console.error('Error loading sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSection = async () => {
    if (!user || !projectId) return
    try {
      const maxOrder = sections
        .filter((s) => !s.parent_id)
        .reduce((max, s) => Math.max(max, s.order_number), -1)
      const newSection = await createBookSection({
        user_id: user.id,
        project_id: projectId,
        title: 'New Section',
        content: '',
        parent_id: null,
        order_number: maxOrder + 1,
        word_count: 0,
      })
      setSections([...sections, newSection])
      setEditingTitle(newSection.id)
      setEditingTitleValue('New Section')
      setExpandedSections(new Set([...expandedSections, newSection.id]))
    } catch (error) {
      console.error('Error creating section:', error)
    }
  }

  const handleAddSubsection = async (parentId: string) => {
    if (!user || !projectId) return
    try {
      const parentSection = sections.find((s) => s.id === parentId)
      if (!parentSection) return

      const childSections = sections.filter((s) => s.parent_id === parentId)
      const maxOrder = childSections.reduce((max, s) => Math.max(max, s.order_number), -1)

      const newSection = await createBookSection({
        user_id: user.id,
        project_id: projectId,
        title: 'New Subsection',
        content: '',
        parent_id: parentId,
        order_number: maxOrder + 1,
        word_count: 0,
      })
      setSections([...sections, newSection])
      setEditingTitle(newSection.id)
      setEditingTitleValue('New Subsection')
      setExpandedSections(new Set([...expandedSections, newSection.id]))
    } catch (error) {
      console.error('Error creating subsection:', error)
    }
  }

  const handleToggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleContentChange = useCallback(
    (sectionId: string, html: string) => {
      const wordCount = calculateWordCount(html)
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, content: html, word_count: wordCount } : s))
      )

      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      const timeout = setTimeout(async () => {
        try {
          setSaving(true)
          await updateBookSection(sectionId, { content: html, word_count: wordCount })
        } catch (error) {
          console.error('Error auto-saving:', error)
        } finally {
          setSaving(false)
        }
      }, 2000)
      setSaveTimeout(timeout)
    },
    [saveTimeout]
  )

  const handleTitleSave = async (sectionId: string) => {
    try {
      await updateBookSection(sectionId, { title: editingTitleValue })
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, title: editingTitleValue } : s))
      )
      setEditingTitle(null)
      setEditingTitleValue('')
    } catch (error) {
      console.error('Error updating title:', error)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return

    const subsections = sections.filter((s) => s.parent_id === sectionId)
    const hasSubsections = subsections.length > 0

    const confirmMessage = hasSubsections
      ? `Are you sure you want to delete "${section.title}" and all its ${subsections.length} subsection(s)? This action cannot be undone.`
      : `Are you sure you want to delete "${section.title}"? This action cannot be undone.`

    if (!confirm(confirmMessage)) return

    try {
      // Delete all subsections first
      for (const subsection of subsections) {
        await deleteBookSection(subsection.id)
      }
      // Then delete the main section
      await deleteBookSection(sectionId)

      // Remove from state
      const idsToRemove = new Set([sectionId, ...subsections.map((s) => s.id)])
      setSections((prev) => prev.filter((s) => !idsToRemove.has(s.id)))
      setExpandedSections((prev) => {
        const newSet = new Set(prev)
        idsToRemove.forEach((id) => newSet.delete(id))
        return newSet
      })
      setMenuOpen(null)
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('Failed to delete section. Please try again.')
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    if (result.source.index === result.destination.index) return

    // Only reorder top-level sections (no parent_id)
    const topLevelSectionsList = sections
      .filter((s) => !s.parent_id)
      .sort((a, b) => a.order_number - b.order_number)

    const items = Array.from(topLevelSectionsList)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order numbers for top-level sections only
    const updatedTopLevel = items.map((item, index) => ({
      ...item,
      order_number: index,
    }))

    // Keep subsections unchanged, only update top-level sections
    const updatedSections = sections.map((section) => {
      const updated = updatedTopLevel.find((s) => s.id === section.id)
      return updated || section
    })

    setSections(updatedSections)

    try {
      // Only update order numbers for top-level sections that changed
      for (const item of updatedTopLevel) {
        await updateBookSection(item.id, { order_number: item.order_number })
      }
    } catch (error) {
      console.error('Error updating order:', error)
      loadSections()
    }
  }

  const renderSection = (section: BookSection, level: number = 0) => {
    const isExpanded = expandedSections.has(section.id)
    const isEditingTitle = editingTitle === section.id
    const isMenuOpen = menuOpen === section.id
    const subsections = sections.filter((s) => s.parent_id === section.id).sort((a, b) => a.order_number - b.order_number)

    return (
      <div key={section.id} className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => handleToggleSection(section.id)}
                className="mr-3 text-gray-500 hover:text-gray-700"
              >
                <svg
                  className={`w-5 h-5 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editingTitleValue}
                  onChange={(e) => setEditingTitleValue(e.target.value)}
                  onBlur={() => handleTitleSave(section.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTitleSave(section.id)
                    } else if (e.key === 'Escape') {
                      setEditingTitle(null)
                      setEditingTitleValue('')
                    }
                  }}
                  className="flex-1 text-lg font-semibold border-b-2 border-primary-600 focus:outline-none"
                  autoFocus
                />
              ) : (
                <h3
                  className="text-lg font-semibold text-gray-900 flex-1 cursor-pointer"
                  onClick={() => {
                    setEditingTitle(section.id)
                    setEditingTitleValue(section.title)
                  }}
                >
                  {section.title}
                </h3>
              )}
              <span className="text-sm text-gray-500 ml-4">{section.word_count} words</span>
            </div>
            <div className="relative ml-4 section-menu-container">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(isMenuOpen ? null : section.id)
                }}
                className="section-menu-button p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {isMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingTitle(section.id)
                      setEditingTitleValue(section.title)
                      setMenuOpen(null)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit title
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSection(section.id)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {isExpanded && (
            <div className="p-4">
              <RichTextEditor
                content={section.content}
                onChange={(html) => handleContentChange(section.id, html)}
                placeholder="Start writing..."
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleAddSubsection(section.id)}
                  className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md border border-primary-200"
                >
                  + Add Subsection
                </button>
              </div>
              {subsections.length > 0 && (
                <div className="mt-4 space-y-2">
                  {subsections.map((sub) => renderSection(sub, level + 1))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const topLevelSections = sections
    .filter((s) => !s.parent_id)
    .sort((a, b) => a.order_number - b.order_number)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Check if click is outside the menu
      if (!target.closest('.section-menu-container') && !target.closest('.section-menu-button')) {
        setMenuOpen(null)
      }
    }
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <div className={embedded ? 'h-full bg-gray-50' : 'min-h-screen bg-gray-50'}>
      <div className={embedded ? 'p-6' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {!embedded && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Writing</h1>
              <p className="text-gray-600">Draft your book sections</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Export
              </button>
              <button
                onClick={handleAddSection}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                + Add Section
              </button>
            </div>
          </div>
        )}

        {embedded && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Writing</h2>
            <div className="flex items-center gap-2">
              {saving && (
                <span className="text-sm text-gray-500 flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              )}
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Export
              </button>
              <button
                onClick={handleAddSection}
                className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
              >
                + Add Section
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : topLevelSections.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No sections yet. Start by adding your first section.</p>
            <button
              onClick={handleAddSection}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              + Add Section
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {topLevelSections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          {renderSection(section)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {showExportModal && (
        <ExportModal
          sections={sections}
          expandedSections={expandedSections}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  )
}
