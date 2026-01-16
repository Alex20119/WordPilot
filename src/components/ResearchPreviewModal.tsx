
interface ResearchPreviewModalProps {
  itemName: string
  section: string
  researchData: Record<string, string>
  onApprove: () => void
  onRegenerate: () => void
  onCancel: () => void
  isRegenerating?: boolean
}

export default function ResearchPreviewModal({
  itemName,
  section,
  researchData,
  onApprove,
  onRegenerate,
  onCancel,
  isRegenerating = false,
}: ResearchPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Research Preview</h2>
            <p className="text-sm text-gray-600 mt-1">
              {itemName} - {section}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {Object.entries(researchData).map(([field, content]) => (
              <div key={field} className="border-l-4 border-primary-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isRegenerating}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
          <button
            onClick={onApprove}
            disabled={isRegenerating}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}
