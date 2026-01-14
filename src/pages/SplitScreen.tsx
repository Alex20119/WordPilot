import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ResearchDatabaseContent from '@/components/ResearchDatabaseContent'
import WritingContent from '@/components/WritingContent'

export default function SplitScreen() {
  const { user, signOut } = useAuth()
  const { projectId } = useParams<{ projectId: string }>()

  useEffect(() => {
    // Prevent body scrolling when on split screen
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <nav className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 h-16">
        <div className="px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                Word Pilot
              </Link>
              <Link
                to={`/project/${projectId}`}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Project
              </Link>
              <span className="text-sm text-gray-500">Split-Screen Mode</span>
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
        {/* Left Panel - Research Database */}
        <div className="w-1/2 border-r border-gray-200 bg-gray-50 overflow-y-auto scrollbar-hide px-4 py-4">
          <ResearchDatabaseContent embedded={true} />
        </div>

        {/* Right Panel - Writing */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto scrollbar-hide px-4 py-4">
          <WritingContent embedded={true} />
        </div>
      </div>
    </div>
  )
}
