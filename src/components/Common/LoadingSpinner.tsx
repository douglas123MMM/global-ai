'use client'

type Props = {
  size?: 'sm' | 'md' | 'large'
  className?: string
  text?: string
}

export default function LoadingSpinner({ size = 'md', className = '', text }: Props) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', large: 'w-12 h-12' }
  const borderMap = { sm: 'border-2', md: 'border-3', large: 'border-4' }

  if (text) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <div
          className={`${sizeMap[size]} ${borderMap[size]} rounded-full animate-spin`}
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeMap[size]} ${borderMap[size]} rounded-full animate-spin`}
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
      />
    </div>
  )
}

// Skeleton for loading states
export function Skeleton({ className = '', height = 'h-4', width = 'w-full' }: { className?: string; height?: string; width?: string }) {
  return (
    <div
      className={`skeleton ${height} ${width} ${className}`}
      style={{ borderRadius: 'var(--radius)' }}
    />
  )
}

// Full page loading
export function PageLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <LoadingSpinner size="large" text={text} />
    </div>
  )
}
