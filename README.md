# Global AI - Sistema de Referidos con Comisiones Recurrentes

Plataforma de marketing de afiliacion con pagos en dinero real. Gana comisiones del 20-25% por cada usuario que refieras.

## Stack

- **Frontend:** Next.js 14 + TypeScript + TailwindCSS
- **Backend:** Next.js API Routes (Serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Stripe + PayPal
- **Emails:** Resend
- **Deploy:** Vercel

## Instalacion

```bash
git clone https://github.com/douglas123MMM/global-ai.git
cd global-ai
npm install
cp .env.example .env.local
# Configurar variables en .env.local
npm run dev
```

## Base de Datos

Ejecuta `sql/schema.sql` en el SQL Editor de Supabase. Esto crea todas las tablas, funciones, triggers y politicas RLS.

## Variables de Entorno

| Variable | Descripcion |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anonima de Supabase |
| `SUPABASE_SERVICE_KEY` | Clave de servicio (para operaciones admin) |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe |
| `RESEND_API_KEY` | API key de Resend para emails |
| `CRON_SECRET` | Secreto para el cron job mensual |
| `MIN_WITHDRAWAL_AMOUNT` | Minimo para retirar (default: 20) |
| `FOUNDER_LIMIT` | Cupo maximo de fundadores (default: 1000) |

## Estructura

```
src/
├── app/
│   ├── api/          # API Routes (14 endpoints)
│   ├── admin/        # Panel de administracion
│   ├── dashboard/    # Dashboard del usuario
│   ├── referrals/    # Programa de referidos
│   └── (auth)/       # Login, registro, pricing
├── components/
│   └── Referrals/    # 12 componentes React
├── lib/              # Helpers (email, stripe, referral, security)
├── types/            # TypeScript types
└── middleware.ts     # Auth + proteccion de rutas
sql/
└── schema.sql        # Schema completo con funciones
```

## Comisiones

| Nivel | Comision | Requisito |
|---|---|---|
| Basico (Level 1) | 20% | Default |
| Experto (Level 2) | 25% | $25+ en 90 dias |
| Fundador | 25% | Primeros 1000 |

## Bonos

| Hito | Bono |
|---|---|
| 1er referido | $5 |
| 10 referidos | $20 |
| 50 referidos | $100 |
| 100 referidos | $500 |
| Top referidor del mes | $200 |

## API Endpoints

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | `/api/auth/register` | Registro con codigo de referido |
| GET | `/api/referral?action=code` | Obtener codigo de referido |
| GET | `/api/referral?action=stats` | Estadisticas del afiliado |
| GET | `/api/referral?action=referrals` | Lista de referidos |
| GET | `/api/referral?action=commissions` | Historial de comisiones |
| GET | `/api/referral?action=transactions` | Historial de transacciones |
| GET/POST | `/api/withdrawal` | Solicitar/ver retiros |
| GET | `/api/referrals/leaderboard` | Ranking de referidores |
| POST | `/api/referrals/claim-bonus` | Reclamar bono |
| GET/PUT | `/api/admin` | Panel admin |
| PUT | `/api/admin/tiers` | Configurar niveles |
| POST | `/api/cron` | Procesar comisiones mensuales |
| POST | `/api/subscription` | Gestionar suscripcion Stripe |
| POST | `/api/stripe` | Webhook de Stripe |

## Cron Job

Las comisiones mensuales se procesan automaticamente el dia 1 de cada mes via Vercel Cron Jobs. El endpoint `/api/cron` requiere el header `Authorization: Bearer CRON_SECRET`.

Tambien puedes ejecutarlo manualmente desde el panel admin o via SQL:

```sql
SELECT * FROM process_monthly_commissions();
```

## Seguridad

- Rate limiting en API routes
- Deteccion de fraude (multiples cuentas por IP, referidos masivos)
- Politicas RLS en Supabase
- JWT para autenticacion
- Headers de seguridad HTTP

## Licencia

Propietario - Todos los derechos reservados.
