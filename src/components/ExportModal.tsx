import { useState, useEffect } from 'react'
import { BookSection } from '@/types/database.types'
import { exportToDocx, ExportScope, ExportOptions } from '@/lib/export'

interface ExportModalProps {
  sections: BookSection[]
  expandedSections: Set<string>
  onClose: () => void
}

export default function ExportModal({ sections, expandedSections, onClose }: ExportModalProps) {
  const [scope, setScope] = useState<ExportScope>('all')
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set())
  const [options, setOptions] = useState<ExportOptions>({
    includeTitles: true,
    includeTOC: true,
    includeWordCount: true,
  })
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get sections in hierarchical order for display
  const getSectionsInOrder = (): BookSection[] => {
    const sorted: BookSection[] = []
    const topLevel = sections.filter((s) => !s.parent_id).sort((a, b) => a.order_number - b.order_number)

    const addSectionAndChildren = (section: BookSection) => {
      sorted.push(section)
      const children = sections
        .filter((s) => s.parent_id === section.id)
        .sort((a, b) => a.order_number - b.order_number)
      children.forEach(addSectionAndChildren)
    }

    topLevel.forEach(addSectionAndChildren)
    return sorted
  }

  const orderedSections = getSectionsInOrder()

  // Build hierarchical section names for display
  const buildSectionName = (section: BookSection): string => {
    if (!section.parent_id) {
      return section.title
    }
    const parent = sections.find((s) => s.id === section.parent_id)
    if (parent) {
      return `${buildSectionName(parent)} > ${section.title}`
    }
    return section.title
  }

  // Initialize selected sections based on scope
  useEffect(() => {
    if (scope === 'current') {
      // Get first expanded section (or first section if none expanded)
      const firstExpanded = Array.from(expandedSections)[0]
      const currentSection = firstExpanded
        ? sections.find((s) => s.id === firstExpanded)
        : orderedSections[0]
      if (currentSection) {
        setSelectedSectionIds(new Set([currentSection.id]))
      }
    } else if (scope === 'all') {
      setSelectedSectionIds(new Set(sections.map((s) => s.id)))
    }
    // For 'specific', user will manually select
  }, [scope, expandedSections, sections, orderedSections])

  const handleSectionToggle = (sectionId: string) => {
    const newSelected = new Set(selectedSectionIds)
    if (newSelected.has(sectionId)) {
      newSelected.delete(sectionId)
    } else {
      newSelected.add(sectionId)
    }
    setSelectedSectionIds(newSelected)
  }

  const handleExport = async () => {
    if (scope === 'specific' && selectedSectionIds.size === 0) {
      setError('Please select at least one section to export')
      return
    }

    setExporting(true)
    setError(null)

    try {
      await exportToDocx(sections, Array.from(selectedSectionIds), scope, options)
      onClose()
    } catch (err: any) {
      console.error('Export error:', err)
      setError(err?.message || 'Failed to export document')
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Export Your Writing</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={exporting}
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Select what to export */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Select what to export:</h3>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="current"
                  checked={scope === 'current'}
                  onChange={(e) => setScope(e.target.value as ExportScope)}
                  className="mr-2"
                  disabled={exporting}
                />
                <span className="text-sm text-gray-700">Current section only</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="specific"
                  checked={scope === 'specific'}
                  onChange={(e) => setScope(e.target.value as ExportScope)}
                  className="mr-2"
                  disabled={exporting}
                />
                <span className="text-sm text-gray-700">Specific sections</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={(e) => setScope(e.target.value as ExportScope)}
                  className="mr-2"
                  disabled={exporting}
                />
                <span className="text-sm text-gray-700">Entire book</span>
              </label>
            </div>

            {/* Section checklist for specific scope */}
            {scope === 'specific' && (
              <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2">
                {orderedSections.map((section) => {
                  const isSelected = selectedSectionIds.has(section.id)
                  const indent = section.parent_id ? 'ml-4' : ''
                  return (
                    <label
                      key={section.id}
                      className={`flex items-center cursor-pointer ${indent}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSectionToggle(section.id)}
                        className="mr-2"
                        disabled={exporting}
                      />
                      <span className="text-sm text-gray-700">{buildSectionName(section)}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Export format */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Export format:</h3>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="docx"
                  checked={true}
                  className="mr-2"
                  disabled={exporting}
                />
                <span className="text-sm text-gray-700">Microsoft Word (.docx)</span>
              </label>
            </div>
          </div>

          {/* Include options */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Include:</h3>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeTitles}
                  onChange={(e) => setOptions({ ...options, includeTitles: e.target.checked })}
                  className="mr-2"
                  disabled={exporting}
                />
                <span className="text-sm text-gray-700">Section titles</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeTOC}
                  onChange={(e) => setOptions({ ...options, includeTOC: e.target.checked })}
                  className="mr-2"
                  disabled={exporting || scope === 'current'}
                />
                <span className="text-sm text-gray-700">Table of contents</span>
                {scope === 'current' && (
                  <span className="text-xs text-gray-500 ml-2">(only for multiple sections)</span>
                )}
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeWordCount}
                  onChange={(e) => setOptions({ ...options, includeWordCount: e.target.checked })}
                  className="mr-2"
                  disabled={exporting}
                />
                <span className="text-sm text-gray-700">Word count</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || (scope === 'specific' && selectedSectionIds.size === 0)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Exporting...
              </>
            ) : (
              'Export'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
