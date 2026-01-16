import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  hasSubscription: boolean
  subscriptionLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  const checkSubscription = async (userId: string) => {
    setSubscriptionLoading(true)
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('active')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error checking subscription:', error)
        setHasSubscription(false)
      } else {
        setHasSubscription(data?.active || false)
      }
    } catch (err) {
      console.error('Subscription check exception:', err)
      setHasSubscription(false)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Redirect to landing page on sign out
      if (event === 'SIGNED_OUT') {
        window.location.href = '/'
      }
      
      // Check subscription when user changes
      if (session?.user) {
        checkSubscription(session.user.id)
      } else {
        setHasSubscription(false)
        setSubscriptionLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Check subscription when user is set
  useEffect(() => {
    if (user) {
      checkSubscription(user.id)
    } else {
      setHasSubscription(false)
      setSubscriptionLoading(false)
    }
  }, [user])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/projects`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    hasSubscription,
    subscriptionLoading,
    signIn,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}