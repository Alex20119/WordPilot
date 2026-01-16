import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Subscribe() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              Word Pilot
            </Link>
            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/projects"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Projects
                  </Link>
                  <button
                    onClick={async () => {
                      await signOut()
                      navigate('/')
                    }}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Subscribe to Word Pilot</h1>
          <p className="text-lg text-gray-600 mb-8">
            Subscription system coming soon
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pricing</h2>
              <p className="text-gray-600">Pricing information will be available soon.</p>
            </div>
            <div className="mt-8">
              <button
                disabled
                className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg text-lg font-medium cursor-not-allowed"
              >
                Referral Code
              </button>
              <p className="text-sm text-gray-500 mt-2">Referral code feature coming soon</p>
            </div>
          </div>
          <div>
            {!user && (
              <Link
                to="/signup"
                className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
