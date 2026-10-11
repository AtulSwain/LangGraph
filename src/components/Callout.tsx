import type { ReactNode } from 'react'

const ICONS = { tip: '💡', warn: '⚠️', info: '🧭', analogy: '🎭' }
const TITLES = { tip: 'Pro tip', warn: 'Watch out', info: 'Good to know', analogy: 'Think of it like…' }

export default function Callout({ type = 'info', title, children }: { type?: keyof typeof ICONS; title?: string; children: ReactNode }) {
  return (
    <div className={`callout ${type}`}>
      <div className="ci">{ICONS[type]}</div>
      <div>
        <strong>{title ?? TITLES[type]}</strong>
        <div className="muted">{children}</div>
      </div>
    </div>
  )
}
