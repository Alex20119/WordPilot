import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook verification failed:', err.message)
    return new Response(JSON.stringify({ error: `Webhook verification failed: ${err.message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id

        if (!userId) {
          console.error('Missing user_id in checkout session metadata')
          break
        }

        // Ensure subscription record exists
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (existingSub) {
          await supabase
            .from('subscriptions')
            .update({
              active: true,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('user_id', userId)
        } else {
          await supabase.from('subscriptions').insert({
            user_id: userId,
            active: true,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            tokens_used: 0,
            tokens_limit: 100000,
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Reset tokens on billing cycle renewal
          await supabase
            .from('subscriptions')
            .update({ tokens_used: 0 })
            .eq('stripe_subscription_id', subscriptionId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ active: false })
            .eq('stripe_subscription_id', subscriptionId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({ active: false })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message || 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
