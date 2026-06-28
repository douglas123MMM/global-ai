import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance && stripeSecret) {
    stripeInstance = new Stripe(stripeSecret, {
      apiVersion: '2025-06-30.acacia' as any,
    })
  }
  if (!stripeInstance) {
    throw new Error('STRIPE_SECRET_KEY no configurado')
  }
  return stripeInstance
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  tier: 'basic' | 'pro'
) {
  const stripe = getStripe()
  const prices: Record<string, string> = {
    basic: process.env.STRIPE_BASIC_PRICE_ID || '',
    pro: process.env.STRIPE_PRO_PRICE_ID || '',
  }

  if (!prices[tier]) {
    throw new Error(`Price ID no configurado para plan ${tier}`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: prices[tier], quantity: 1 }],
    metadata: { userId, tier },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
  })

  return session
}

export async function createCustomerPortalSession(customerId: string) {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })
  return session
}

export async function handleStripeWebhook(body: string, signature: string) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  return event
}
