import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasSubscription, subscriptionLoading } = useAuth()

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Subscription Required</h1>
          <p className="text-gray-600 mb-6">
            Purchase a subscription to view content.
          </p>
          <Link
            to="/subscribe"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Subscribe Now
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}