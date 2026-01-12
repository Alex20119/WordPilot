import { useState, useEffect } from 'react'
import { BookSection } from '@/types/database.types'

interface TextSelectionToolbarProps {
  selectedText: string
  onAddWithAI: (sectionId: string) => void
  sections: BookSection[]
  onClose: () => void
  position: { x: number; y: number }
}

export default function TextSelectionToolbar({
  selectedText,
  onAddWithAI,
  sections,
  onClose,
  position,
}: TextSelectionToolbarProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

  // Build hierarchical section names
  const buildSectionName = (section: BookSection, allSections: BookSection[]): string => {
    if (!section.parent_id) {
      return section.title
    }
    const parent = allSections.find((s) => s.id === section.parent_id)
    if (parent) {
      return `${buildSectionName(parent, allSections)} > ${section.title}`
    }
    return section.title
  }

  const sectionOptions = sections
    .sort((a, b) => a.order_number - b.order_number)
    .map((section) => ({
      id: section.id,
      name: buildSectionName(section, sections),
    }))

  useEffect(() => {
    if (sectionOptions.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sectionOptions[0].id)
    }
  }, [sectionOptions, selectedSectionId])

  const handleAdd = () => {
    if (selectedSectionId) {
      onAddWithAI(selectedSectionId)
      onClose()
    }
  }

  if (!selectedText.trim()) {
    return null
  }

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 60}px`,
      }}
    >
      <div className="px-3 py-2 border-b border-gray-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-sm font-semibold text-gray-900">Research Assistant</span>
      </div>
      <div className="p-3 flex items-center gap-3">
        <select
          value={selectedSectionId}
          onChange={(e) => setSelectedSectionId(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {sectionOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!selectedSectionId}
          className="px-4 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add with AI
        </button>
        <button
          onClick={onClose}
          className="px-2 py-1.5 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
    </div>
  )
}
