import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Subscribe() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/signin')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser || !authUser.email) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.id,
          userEmail: authUser.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { sessionUrl } = await response.json()
      
      if (sessionUrl) {
        window.location.href = sessionUrl
      } else {
        throw new Error('No session URL returned')
      }
    } catch (err: any) {
      console.error('Error creating checkout session:', err)
      setError(err.message || 'Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="w-full">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4 pl-4 sm:pl-6 lg:pl-8">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                Word Pilot
              </Link>
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to landing</span>
              </Link>
            </div>
            <nav className="flex items-center gap-4 pr-4 sm:pr-6 lg:pr-8">
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
            Get unlimited access to all features and AI-powered research tools
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Premium Subscription</h2>
              <p className="text-gray-600 mb-4">
                Access to all AI features, research tools, and unlimited projects
              </p>
              <div className="text-3xl font-bold text-primary-600 mb-2">$29/month</div>
              <p className="text-sm text-gray-500">Billed monthly</p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="mt-8">
              {user ? (
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">Please sign in to subscribe</p>
                  <Link
                    to="/signin"
                    className="inline-block w-full px-6 py-3 bg-primary-600 text-white rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Sign In to Subscribe
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
