import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { handleStripeWebhook } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  try {
    const event = await handleStripeWebhook(body, signature)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId
        const tier = session.metadata?.tier
        const stripeSubscriptionId = session.subscription as string

        if (userId && tier) {
          const { data: existing } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .single()

          if (existing) {
            await supabaseAdmin
              .from('subscriptions')
              .update({
                tier,
                stripe_subscription_id: stripeSubscriptionId,
                status: 'active',
                price: tier === 'pro' ? 20 : 10,
              })
              .eq('id', existing.id)
          } else {
            await supabaseAdmin.from('subscriptions').insert({
              user_id: userId,
              stripe_subscription_id: stripeSubscriptionId,
              tier,
              price: tier === 'pro' ? 20 : 10,
              status: 'active',
            })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const stripeSubscriptionId = subscription.id

        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', stripeSubscriptionId)
          .single()

        if (sub) {
          const status = subscription.status === 'active' ? 'active' : 'canceled'
          await supabaseAdmin
            .from('subscriptions')
            .update({ status })
            .eq('id', sub.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const stripeSubscriptionId = subscription.id

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', stripeSubscriptionId)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
