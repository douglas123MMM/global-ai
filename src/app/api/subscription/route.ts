import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createCheckoutSession, createCustomerPortalSession } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Sesion invalida' }, { status: 401 })
    }

    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json(sub || null)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Sesion invalida' }, { status: 401 })
    }

    const { action, tier } = await req.json()

    switch (action) {
      case 'create': {
        if (!tier) return NextResponse.json({ error: 'Tier requerido' }, { status: 400 })
        const session = await createCheckoutSession(user.id, user.email!, tier)
        return NextResponse.json({ url: session.url })
      }
      case 'portal': {
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('stripe_subscription_id')
          .eq('user_id', user.id)
          .single()

        if (sub?.stripe_subscription_id) {
          const { data: stripeSub } = await supabaseAdmin
            .from('subscriptions')
            .select('stripe_subscription_id')
            .eq('stripe_subscription_id', sub.stripe_subscription_id)
            .single()

          if (stripeSub) {
            const portalSession = await createCustomerPortalSession(
              stripeSub.stripe_subscription_id
            )
            return NextResponse.json({ url: portalSession.url })
          }
        }
        return NextResponse.json({ error: 'Suscripcion no encontrada' }, { status: 404 })
      }
      default:
        return NextResponse.json({ error: 'Accion invalida' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
