import { supabase } from './supabase'

export interface Subscription {
  id: string
  user_id: string
  active: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  tokens_used: number
  tokens_limit: number
  created_at: string
  updated_at: string
}

/**
 * Get the current user's subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No subscription found
      return null
    }
    console.error('Error fetching subscription:', error)
    return null
  }

  return data as Subscription
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  return subscription?.active === true
}

/**
 * Track token usage for a user
 * Throws an error if token limit is exceeded
 */
export async function trackTokenUsage(userId: string, tokensUsed: number): Promise<void> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    throw new Error('No subscription found. Please subscribe to use AI features.')
  }

  if (!subscription.active) {
    throw new Error('Your subscription is not active. Please check your payment status.')
  }

  const newTotal = subscription.tokens_used + tokensUsed

  if (newTotal >= subscription.tokens_limit) {
    throw new Error(
      `Token limit exceeded. You have used ${subscription.tokens_used} of ${subscription.tokens_limit} tokens. Your limit will reset on your next billing cycle.`
    )
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({ tokens_used: newTotal })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating token usage:', error)
    throw new Error('Failed to track token usage')
  }
}

/**
 * Get token usage information for display
 */
export async function getTokenUsage(userId: string): Promise<{
  used: number
  limit: number
  remaining: number
  percentage: number
} | null> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    return null
  }

  return {
    used: subscription.tokens_used,
    limit: subscription.tokens_limit,
    remaining: Math.max(0, subscription.tokens_limit - subscription.tokens_used),
    percentage: Math.min(100, (subscription.tokens_used / subscription.tokens_limit) * 100),
  }
}
