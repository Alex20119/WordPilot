import { useState } from 'react'

interface AIPreviewModalProps {
  originalContent: string
  previewContent: string
  onAccept: () => void
  onEdit: (editedContent: string) => void
  onReject: () => void
  onClose: () => void
}

export default function AIPreviewModal({
  originalContent,
  previewContent,
  onAccept,
  onEdit,
  onReject,
  onClose,
}: AIPreviewModalProps) {
  const [editedContent, setEditedContent] = useState(previewContent)
  const [isEditing, setIsEditing] = useState(false)

  const handleAccept = () => {
    onAccept()
    onClose()
  }

  const handleEdit = () => {
    onEdit(editedContent)
    onClose()
  }

  const handleReject = () => {
    onReject()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">AI-Generated Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Original Content:</h3>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: originalContent || '<p class="text-gray-400 italic">Empty section</p>' }}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview with AI Addition:</h3>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Reject
          </button>
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel Edit
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Save & Accept
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Accept
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
