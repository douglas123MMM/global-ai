'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/supabase/provider'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      <nav className="glass px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text">Global AI</h1>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link href="/dashboard" className="text-primary hover:underline">Dashboard</Link>
              <Link href="/pricing" className="text-muted-foreground hover:text-white">Precios</Link>
            </>
          ) : (
            <>
              <Link href="/pricing" className="hover:text-primary">Precios</Link>
              <Link href="/login" className="hover:text-primary">Iniciar Sesion</Link>
              <Link href="/register" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="mb-8">
          <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
            Programa de Afiliados
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Gana <span className="gradient-text">Dinero Real</span> Compartiendo IA
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10">
          Comisiones recurrentes del <strong className="text-white">20-25%</strong> cada mes por cada usuario que traigas.
          Retira tu dinero via PayPal o Stripe cuando quieras.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href={user ? '/dashboard' : '/register'}
            className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl text-lg font-semibold transition shadow-lg shadow-primary/30"
          >
            {user ? 'Ir al Dashboard' : 'Empieza a Ganar'}
          </Link>
          <Link
            href="/pricing"
            className="glass px-8 py-4 rounded-xl text-lg font-semibold hover:bg-card-hover transition"
          >
            Ver Precios
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            { title: 'Codigo Unico', desc: 'Recibe tu enlace de referido al registrarte y compartelo en redes.' },
            { title: 'Comisiones Recurrentes', desc: 'Gana cada mes mientras tus referidos esten suscritos. Ingreso pasivo real.' },
            { title: 'Retiros Faciles', desc: 'Solicita tu dinero por PayPal o Stripe. Minimo $20. Pago en 2-5 dias.' },
          ].map((f, i) => (
            <div key={i} className="glass p-6 rounded-xl text-left">
              <div className="text-3xl mb-3">{['🔗', '💰', '💳'][i]}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-text-muted text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 glass p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Programa Fundador</h2>
          <p className="text-text-muted mb-4 max-w-lg mx-auto">
            Los primeros <span className="text-accent font-bold">1,000</span> afiliados reciben:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-6">
            {[
              '25% de comision desde el inicio',
              'Badge "Fundador" exclusivo',
              'Membresia Pro GRATIS de por vida',
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-accent">⭐</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-text-muted text-sm py-8 border-t border-border">
        Global AI &copy; {new Date().getFullYear()} - Todos los derechos reservados
      </footer>
    </div>
  )
}
