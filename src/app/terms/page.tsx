import Link from 'next/link'

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <nav className="glass px-6 py-4 sticky top-0 z-40" style={{ background: 'var(--nav-bg)' }}>
        <Link href="/" className="text-xl font-bold gradient-text">Global AI</Link>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Terminos y Condiciones</h1>
        <div className="space-y-6" style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '15px' }}>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>1. Programa de Referidos</h2>
            <p>El programa de referidos de Global AI permite a los usuarios ganar comisiones por referir nuevos clientes. Las comisiones se calculan como un porcentaje del pago mensual de los usuarios referidos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>2. Comisiones</h2>
            <p>Las comisiones son recurrentes y se pagan mensualmente mientras el usuario referido mantenga una suscripcion activa. El porcentaje de comision varia segun el nivel del afiliado (20% o 25%). Las comisiones se acreditan el primer dia de cada mes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>3. Retiros</h2>
            <p>El monto minimo para solicitar un retiro es de $20.00 USD. Los retiros se procesan en un plazo de 2 a 5 dias habiles y estan sujetos a verificacion. Metodos disponibles: PayPal, Stripe y transferencia bancaria.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>4. Conducta del Afiliado</h2>
            <p>Los afiliados no pueden utilizar metodos fraudulentos para generar referidos, incluyendo pero no limitado a: creacion de cuentas falsas, spam, incentivos enganosos, o cualquier practica que viole los terminos de servicio. El incumplimiento resultara en la desactivacion de la cuenta y perdida de comisiones.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>5. Programa Fundador</h2>
            <p>Limitado a los primeros 1,000 afiliados. Los fundadores reciben 25% de comision de por vida y membresia Pro gratuita. El estado de fundador es intransferible.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>6. Impuestos</h2>
            <p>Los afiliados son responsables de declarar y pagar los impuestos correspondientes a sus ganancias. Global AI puede retener impuestos cuando sea requerido por ley.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>7. Modificaciones</h2>
            <p>Global AI se reserva el derecho de modificar los terminos del programa de referidos en cualquier momento. Los cambios seran notificados por email con al menos 15 dias de anticipacion.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>8. Contacto</h2>
            <p>Para cualquier duda sobre el programa de referidos, contacta a support@globalai.com.</p>
          </section>
        </div>
        <p className="mt-8" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Ultima actualizacion: {new Date().toLocaleDateString()}
        </p>
      </main>
    </div>
  )
}
