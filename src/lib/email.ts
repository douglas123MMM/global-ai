import { Resend } from 'resend'

const FROM = 'Global AI <noreply@globalai.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  if (!resendInstance) throw new Error('RESEND_API_KEY no configurado')
  return resendInstance
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const resend = getResend()
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('Email error:', err)
  }
}

const wrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:'Inter',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a1a;padding:40px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#12122a;border-radius:16px;border:1px solid #2a2a45;overflow:hidden">
<tr><td style="padding:32px 40px;text-align:center;background:linear-gradient(135deg,#6c5ce7,#a29bfe)">
<h1 style="color:#fff;margin:0;font-size:24px">Global AI</h1>
</td></tr>
<tr><td style="padding:40px">
${content}
</td></tr>
<tr><td style="padding:24px 40px;background:#0f0f24;text-align:center">
<p style="color:#6a6a8a;font-size:12px;margin:0">
  Global AI &copy; ${new Date().getFullYear()} | 
  <a href="${APP_URL}/terms" style="color:#6c5ce7">Terminos</a> | 
  <a href="${APP_URL}/privacy" style="color:#6c5ce7">Privacidad</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

const button = (text: string, href: string) => `
<a href="${href}" style="display:inline-block;background:#6c5ce7;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:16px 0">${text}</a>`

// ============================================
// TEMPLATES
// ============================================

// 1. Nuevo referido registrado (para referidor)
export async function sendNewReferral(referrerEmail: string, referrerName: string, referredEmail: string) {
  await sendEmail(referrerEmail, 'Alguien se registro con tu enlace!', wrapper(`
    <h2 style="color:#e8e8f0;margin:0 0 12px">Nuevo referido registrado!</h2>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Hola ${referrerName},</p>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6"><strong style="color:#e8e8f0">${referredEmail}</strong> se acaba de registrar usando tu enlace de referido.</p>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Ganaras comisiones recurrentes cada mes mientras mantenga su suscripcion activa.</p>
    ${button('Ver mi Dashboard', `${APP_URL}/referrals`)}
    <p style="color:#6a6a8a;font-size:13px;margin-top:20px">Recibiras una comision cuando complete su primera suscripcion.</p>
  `))
}

// 2. Bienvenida con bono (para referido)
export async function sendWelcomeBonus(referredEmail: string, referredName: string, bonusAmount: number) {
  await sendEmail(referredEmail, 'Bienvenido a Global AI - Tienes un bono!', wrapper(`
    <h2 style="color:#e8e8f0;margin:0 0 12px">Bienvenido a Global AI!</h2>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Hola ${referredName || 'Usuario'},</p>
    <div style="background:rgba(16,185,129,0.1);border:1px solid #10b981;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <p style="color:#10b981;font-size:28px;font-weight:700;margin:0">$${bonusAmount.toFixed(2)}</p>
      <p style="color:#a0a0c0;font-size:14px;margin:4px 0 0">Bono de bienvenida acreditado a tu cuenta</p>
    </div>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Ademas, tu tambien puedes ganar dinero refiriendo a otros. Obtienes tu propio enlace de referido y comisiones del 20-25%.</p>
    ${button('Empezar a Ganar', `${APP_URL}/referrals`)}
  `))
}

// 3. Suscripcion completada (para referidor)
export async function sendSubscriptionCommission(referrerEmail: string, referrerName: string, amount: number, referredEmail: string) {
  await sendEmail(referrerEmail, `Comision de $${amount.toFixed(2)} por nueva suscripcion!`, wrapper(`
    <h2 style="color:#e8e8f0;margin:0 0 12px">Comision generada!</h2>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Hola ${referrerName},</p>
    <div style="background:rgba(108,92,231,0.1);border:1px solid #6c5ce7;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <p style="color:#6c5ce7;font-size:28px;font-weight:700;margin:0">+$${amount.toFixed(2)}</p>
      <p style="color:#a0a0c0;font-size:14px;margin:4px 0 0">${referredEmail} se suscribio</p>
    </div>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Recibiras esta comision cada mes mientras el usuario este suscrito.</p>
    ${button('Ver mi Saldo', `${APP_URL}/referrals`)}
  `))
}

// 4. Nuevo nivel alcanzado
export async function sendNewTier(referrerEmail: string, referrerName: string, tier: string, percentage: number) {
  const tierNames: Record<string, string> = { level1: 'Basico', level2: 'Experto', founder: 'Fundador' }
  await sendEmail(referrerEmail, `Subiste a nivel ${tierNames[tier] || tier}!`, wrapper(`
    <h2 style="color:#fbbf24;margin:0 0 12px">Nuevo nivel alcanzado!</h2>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Felicitaciones ${referrerName},</p>
    <div style="background:rgba(251,191,36,0.1);border:1px solid #fbbf24;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <p style="color:#fbbf24;font-size:22px;font-weight:700;margin:0">${tierNames[tier] || tier}</p>
      <p style="color:#a0a0c0;font-size:14px;margin:4px 0 0">Nueva comision: ${percentage}%</p>
    </div>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Ahora ganas el ${percentage}% de cada suscripcion de tus referidos.</p>
    ${button('Ver Dashboard', `${APP_URL}/referrals`)}
  `))
}

// 5. Comision mensual procesada
export async function sendMonthlyCommission(referrerEmail: string, referrerName: string, amount: number, month: string) {
  await sendEmail(referrerEmail, `Comision mensual de $${amount.toFixed(2)} procesada`, wrapper(`
    <h2 style="color:#e8e8f0;margin:0 0 12px">Comision mensual procesada</h2>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Hola ${referrerName},</p>
    <div style="background:rgba(52,211,153,0.1);border:1px solid #34d399;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <p style="color:#34d399;font-size:28px;font-weight:700;margin:0">+$${amount.toFixed(2)}</p>
      <p style="color:#a0a0c0;font-size:14px;margin:4px 0 0">Comisiones de ${month}</p>
    </div>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Las comisiones recurrentes de tus referidos activos ya estan en tu saldo.</p>
    ${button('Ver Saldo', `${APP_URL}/referrals`)}
  `))
}

// 6. Recordatorio de saldo disponible
export async function sendBalanceReminder(email: string, name: string, balance: number) {
  await sendEmail(email, `Tienes $${balance.toFixed(2)} disponible para retirar`, wrapper(`
    <h2 style="color:#e8e8f0;margin:0 0 12px">Saldo disponible para retirar</h2>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Hola ${name},</p>
    <div style="background:rgba(52,211,153,0.1);border:1px solid #34d399;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <p style="color:#34d399;font-size:28px;font-weight:700;margin:0">$${balance.toFixed(2)}</p>
      <p style="color:#a0a0c0;font-size:14px;margin:4px 0 0">Saldo disponible</p>
    </div>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Tienes fondos disponibles para retirar. El minimo es $20.00 via PayPal, Stripe o transferencia.</p>
    ${button('Retirar Ahora', `${APP_URL}/referrals`)}
  `))
}

// 7. Retiro aprobado
export async function sendWithdrawalApproved(email: string, name: string, amount: number, method: string) {
  await sendEmail(email, 'Tu retiro ha sido aprobado!', wrapper(`
    <h2 style="color:#e8e8f0;margin:0 0 12px">Retiro aprobado</h2>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Hola ${name},</p>
    <div style="background:rgba(108,92,231,0.1);border:1px solid #6c5ce7;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <p style="color:#6c5ce7;font-size:28px;font-weight:700;margin:0">$${amount.toFixed(2)}</p>
      <p style="color:#a0a0c0;font-size:14px;margin:4px 0 0">Via ${method.toUpperCase()}</p>
    </div>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Recibiras tu pago en los proximos 2-5 dias habiles.</p>
    ${button('Ver Historial', `${APP_URL}/referrals`)}
  `))
}

// 8. Retiro pagado
export async function sendWithdrawalPaid(email: string, name: string, amount: number) {
  await sendEmail(email, 'Tu pago ha sido enviado!', wrapper(`
    <h2 style="color:#e8e8f0;margin:0 0 12px">Pago enviado</h2>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Hola ${name},</p>
    <div style="background:rgba(16,185,129,0.1);border:1px solid #10b981;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <p style="color:#10b981;font-size:28px;font-weight:700;margin:0">$${amount.toFixed(2)}</p>
      <p style="color:#a0a0c0;font-size:14px;margin:4px 0 0">Pago completado</p>
    </div>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">El dinero ya fue enviado a tu cuenta. Gracias por ser parte de Global AI!</p>
  `))
}

// 9. Top referidor del mes
export async function sendTopReferrer(email: string, name: string, prize: number) {
  await sendEmail(email, 'Eres el Top Referidor del Mes!', wrapper(`
    <h2 style="color:#fbbf24;margin:0 0 12px">Top Referidor del Mes!</h2>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Felicitaciones ${name}!</p>
    <div style="background:rgba(251,191,36,0.1);border:1px solid #fbbf24;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
      <p style="font-size:40px;margin:0">🏆</p>
      <p style="color:#fbbf24;font-size:22px;font-weight:700;margin:8px 0 0">$${prize.toFixed(2)}</p>
      <p style="color:#a0a0c0;font-size:14px;margin:4px 0 0">Premio por ser el #1 del mes</p>
    </div>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Eres el referidor con mas comisiones este mes. El premio ya esta en tu saldo!</p>
    ${button('Ver Ranking', `${APP_URL}/referrals/leaderboard`)}
  `))
}

// 10. Invitacion a programa fundador
export async function sendFounderInvitation(email: string, name: string, number: number) {
  await sendEmail(email, 'Bienvenido al Programa Fundador!', wrapper(`
    <h2 style="color:#fbbf24;margin:0 0 12px">Eres Fundador #${number}!</h2>
    <p style="color:#a0a0c0;font-size:15px;line-height:1.6">Bienvenido ${name},</p>
    <div style="background:rgba(251,191,36,0.1);border:1px solid #fbbf24;border-radius:12px;padding:20px;margin:20px 0">
      <p style="color:#fbbf24;font-size:16px;font-weight:700;margin:0 0 12px">Tus beneficios como Fundador:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:#e8e8f0;font-size:14px">&#11088; 25% de comision desde el inicio</td></tr>
        <tr><td style="padding:6px 0;color:#e8e8f0;font-size:14px">&#127775; Badge exclusivo "Fundador"</td></tr>
        <tr><td style="padding:6px 0;color:#e8e8f0;font-size:14px">&#127941; Membresia Pro GRATIS de por vida</td></tr>
        <tr><td style="padding:6px 0;color:#e8e8f0;font-size:14px">&#128227; Mencion en pagina de Embajadores</td></tr>
      </table>
    </div>
    ${button('Ir al Dashboard', `${APP_URL}/referrals`)}
  `))
}
