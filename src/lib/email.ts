import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance && resendApiKey) {
    resendInstance = new Resend(resendApiKey)
  }
  if (!resendInstance) {
    throw new Error('RESEND_API_KEY no configurado')
  }
  return resendInstance
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const resend = getResend()
    await resend.emails.send({
      from: 'Global AI <noreply@globalai.com>',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('Error enviando email:', err)
  }
}

export async function sendReferralNotification(
  referrerEmail: string,
  referrerName: string,
  referredEmail: string
) {
  const html = `
    <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #6c5ce7;">Global AI</h1>
      <p>Hola ${referrerName},</p>
      <p>Alguien se acaba de registrar usando tu enlace de referido.</p>
      <p><strong>${referredEmail}</strong></p>
      <p>Ganaras comisiones recurrentes mientras mantenga su suscripcion activa.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #6c5ce7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver Dashboard</a>
    </div>
  `
  await sendEmail(referrerEmail, 'Nuevo referido registrado!', html)
}

export async function sendWithdrawalApproved(
  email: string,
  name: string,
  amount: number,
  method: string
) {
  const html = `
    <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #6c5ce7;">Global AI</h1>
      <p>Hola ${name},</p>
      <p>Tu solicitud de retiro ha sido <strong>aprobada</strong>.</p>
      <p><strong>Monto:</strong> $${amount.toFixed(2)}</p>
      <p><strong>Metodo:</strong> ${method}</p>
      <p>Recibiras tu pago en los proximos 2-5 dias habiles.</p>
    </div>
  `
  await sendEmail(email, 'Retiro aprobado!', html)
}

export async function sendNewTierNotification(
  email: string,
  name: string,
  tier: string,
  percentage: number
) {
  const html = `
    <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #6c5ce7;">Global AI</h1>
      <p>Felicitaciones ${name}!</p>
      <p>Has subido al nivel <strong>${tier}</strong>.</p>
      <p>Nueva comision: <strong>${percentage}%</strong> por cada referido.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #6c5ce7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver Dashboard</a>
    </div>
  `
  await sendEmail(email, 'Nuevo nivel alcanzado!', html)
}

export async function sendFounderWelcome(email: string, name: string, number: number) {
  const html = `
    <div style="font-family: Arial; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #fdcb6e;">Global AI - Fundador #${number}</h1>
      <p>Bienvenido ${name}!</p>
      <p>Eres el <strong>Fundador #${number}</strong> de Global AI.</p>
      <p>Tus beneficios:</p>
      <ul>
        <li>25% de comision desde el inicio</li>
        <li>Badge exclusivo "Fundador"</li>
        <li>Membresia Pro GRATIS de por vida</li>
      </ul>
    </div>
  `
  await sendEmail(email, 'Bienvenido Fundador Global AI!', html)
}
