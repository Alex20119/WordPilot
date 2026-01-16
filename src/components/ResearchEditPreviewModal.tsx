interface ResearchEditPreviewModalProps {
  itemName: string
  section: string
  originalData: Record<string, string>
  editedData: Record<string, string>
  onApprove: () => void
  onRegenerate: () => void
  onCancel: () => void
  isRegenerating?: boolean
}

export default function ResearchEditPreviewModal({
  itemName,
  section,
  originalData,
  editedData,
  onApprove,
  onRegenerate,
  onCancel,
  isRegenerating = false,
}: ResearchEditPreviewModalProps) {
  // Determine which fields are being modified
  const modifiedFields = new Set<string>()
  const allFields = new Set([...Object.keys(originalData), ...Object.keys(editedData)])
  
  allFields.forEach((field) => {
    const original = originalData[field] || ''
    const edited = editedData[field] || ''
    if (original !== edited) {
      modifiedFields.add(field)
    }
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Preview</h2>
            <p className="text-sm text-gray-600 mt-1">
              {itemName} - {section}
            </p>
            {modifiedFields.size > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {modifiedFields.size} field{modifiedFields.size === 1 ? '' : 's'} will be modified
              </p>
            )}
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
            {Array.from(allFields).map((field) => {
              const original = originalData[field] || ''
              const edited = editedData[field] || ''
              const isModified = modifiedFields.has(field)
              const fieldDisplay = field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

              return (
                <div
                  key={field}
                  className={`border-l-4 ${
                    isModified ? 'border-yellow-500' : 'border-gray-300'
                  } pl-4`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    {fieldDisplay}
                    {isModified && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Modified
                      </span>
                    )}
                  </h3>
                  
                  {isModified ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Current:</p>
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {original || <span className="italic text-gray-400">(empty)</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">New:</p>
                        <div className="bg-green-50 border border-green-200 rounded p-3 text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {edited}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {edited || <span className="italic text-gray-400">(empty)</span>}
                    </div>
                  )}
                </div>
              )
            })}
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
            Approve Changes
          </button>
        </div>
      </div>
    </div>
  )
}
