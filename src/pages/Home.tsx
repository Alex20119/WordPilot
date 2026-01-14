import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useProject } from '@/contexts/ProjectContext'

export default function Home() {
  const { user, signOut } = useAuth()
  const { projectId } = useParams<{ projectId: string }>()
  const { project, loading } = useProject()

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Word Pilot
              </Link>
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Projects
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {project.title}
          </h2>
          {project.description && (
            <p className="text-lg text-gray-600">
              {project.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to={`/project/${projectId}/research`}
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow cursor-pointer block"
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                View Research Database
              </h3>
              <p className="text-gray-600 mb-4">
                Browse your sandwich research data organized by chapters
              </p>
              <div className="text-primary-600 font-medium">
                Go to Research →
              </div>
            </div>
          </Link>

          <Link
            to={`/project/${projectId}/writing`}
            className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition-shadow cursor-pointer block"
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Write Draft
              </h3>
              <p className="text-gray-600 mb-4">
                Create and edit your book sections with a Notion-style editor
              </p>
              <div className="text-primary-600 font-medium">
                Go to Writing →
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Split-Screen Mode
                </h3>
                <p className="text-sm text-gray-600">
                  View research database and writing editor side by side
                </p>
              </div>
              <Link
                to={`/project/${projectId}/split`}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
              >
                Open Split-Screen
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
