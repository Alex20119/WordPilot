import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function Landing() {
  const { user, hasSubscription } = useAuth()
  const navigate = useNavigate()

  // Redirect logged-in users with subscription to projects
  useEffect(() => {
    if (user && hasSubscription) {
      navigate('/projects', { replace: true })
    }
  }, [user, hasSubscription, navigate])
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Word Pilot</h1>
            <nav className="flex items-center gap-4">
              <Link
                to="/signin"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/subscribe"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Subscribe
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Word Pilot</h1>
          <p className="text-xl text-gray-600 mb-8">
            AI research and writing assistant for non-fiction authors
          </p>
          <p className="text-lg text-gray-500 mb-12">
            Plan your research, conduct thorough investigations, and write your book with AI-powered assistance.
          </p>
        </div>
      </main>
    </div>
  )
}
