import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <nav className="glass px-6 py-4 sticky top-0 z-40" style={{ background: 'var(--nav-bg)' }}>
        <Link href="/" className="text-xl font-bold gradient-text">Global AI</Link>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Politica de Privacidad</h1>
        <div className="space-y-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '15px' }}>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>1. Datos Recopilados</h2>
            <p>Recopilamos: email, nombre, datos de pago (via Stripe/PayPal), IP, historial de referidos, historial de transacciones. No compartimos tus datos con terceros excepto para procesar pagos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>2. Uso de Datos</h2>
            <p>Tus datos se utilizan para: procesar pagos, calcular comisiones, enviar notificaciones del programa de referidos, prevenir fraude, y mejorar el servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>3. Cookies</h2>
            <p>Utilizamos cookies esenciales para la autenticacion y funcionamiento del servicio. No utilizamos cookies de seguimiento de terceros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>4. Almacenamiento</h2>
            <p>Tus datos se almacenan en Supabase (PostgreSQL) con cifrado en reposo y en transito. Los datos de pago son procesados por Stripe y PayPal, no almacenamos informacion completa de tarjetas.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>5. Derechos del Usuario</h2>
            <p>Puedes solicitar: acceso a tus datos, rectificacion, eliminacion, y portabilidad. Para ejercer estos derechos, escribe a privacy@globalai.com.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>6. Retencion</h2>
            <p>Los datos de transacciones se retienen por un minimo de 5 anos por requerimientos legales y fiscales. Los datos de cuentas inactivas por mas de 2 anos pueden ser eliminados.</p>
          </section>
        </div>
        <p className="mt-8" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Ultima actualizacion: {new Date().toLocaleDateString()}
        </p>
      </main>
    </div>
  )
}
