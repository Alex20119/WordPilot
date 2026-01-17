import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import WritingContent from '@/components/WritingContent'

export default function Writing() {
  const { user, signOut } = useAuth()
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4 pl-4 sm:pl-6 lg:pl-8">
              <Link to="/" className="text-xl font-bold text-gray-900">
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
            </div>
            <div className="flex items-center space-x-4 pr-4 sm:pr-6 lg:pr-8">
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

      <WritingContent embedded={false} />
    </div>
  )
}
