import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function Success() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'checking' | 'active' | 'pending'>('checking')

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        navigate('/signin')
        return
      }

      try {
        // Give webhook a moment to process
        await new Promise(resolve => setTimeout(resolve, 2000))

        const { data, error } = await supabase
          .from('subscriptions')
          .select('active')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking subscription:', error)
        }

        if (data?.active) {
          setSubscriptionStatus('active')
        } else {
          setSubscriptionStatus('pending')
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        setSubscriptionStatus('pending')
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user, navigate])

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
            </div>
            <nav className="flex items-center gap-4 pr-4 sm:pr-6 lg:pl-8">
              {user && (
                <Link
                  to="/projects"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Projects
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full text-center">
          {loading ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your subscription...</p>
            </div>
          ) : subscriptionStatus === 'active' ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Subscription Activated!</h1>
                <p className="text-lg text-gray-600 mb-8">
                  Thank you for subscribing to Word Pilot. You now have access to all premium features.
                </p>
              </div>
              <Link
                to="/projects"
                className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Go to Projects Dashboard
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Received</h1>
                <p className="text-lg text-gray-600 mb-4">
                  Your payment was successful! We're processing your subscription activation.
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  This usually takes just a few seconds. If your subscription doesn't activate within a minute, please contact support.
                </p>
              </div>
              <div className="space-y-3">
                <Link
                  to="/projects"
                  className="inline-block w-full bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Go to Projects Dashboard
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-block w-full bg-gray-200 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
