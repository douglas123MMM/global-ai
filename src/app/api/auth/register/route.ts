import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { processReferral } from '@/lib/referral'
import { sendNewReferral } from '@/lib/email'
import { rateLimiter, getClientIp, detectFraud } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = rateLimiter(req)
    if (rateLimitResponse) return rateLimitResponse

    const { email, password, full_name, referral_code } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contrasena debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const { data: user, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        return NextResponse.json({ error: 'Este email ya esta registrado' }, { status: 409 })
      }
      return NextResponse.json({ error: signUpError.message }, { status: 500 })
    }

    if (!user?.user) {
      return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 })
    }

    const userId = user.user.id
    const clientIp = getClientIp(req)

    await supabaseAdmin
      .from('profiles')
      .update({ full_name, signup_ip: clientIp })
      .eq('id', userId)

    if (referral_code) {
      try {
        const referral = await processReferral(userId, referral_code)

        if (referral) {
          const fraudCheck = await detectFraud(referral.referrer_id, clientIp)
          if (fraudCheck) {
            console.log('Fraude detectado:', fraudCheck)
          }

          const { data: referrer } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .eq('id', referral.referrer_id)
            .single()

          if (referrer?.email) {
            sendNewReferral(
              referrer.email,
              referrer.full_name || 'Usuario',
              email
            ).catch(() => {})
          }
        }
      } catch (refErr: any) {
        console.log('Error procesando referido:', refErr.message)
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, email },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
