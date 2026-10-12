import type { ReactNode } from 'react'
import Icon from './Icon'

const ICONS = { tip: 'Lightbulb', warn: 'TriangleAlert', info: 'Compass', analogy: 'Sparkles' }
const TITLES = { tip: 'Pro tip', warn: 'Watch out', info: 'Why it matters', analogy: 'Think of it like…' }

export default function Callout({ type = 'info', title, children }: { type?: keyof typeof ICONS; title?: string; children: ReactNode }) {
  return (
    <div className={`callout ${type}`}>
      <div className="ci"><Icon name={ICONS[type]} size={18} /></div>
      <div>
        <strong>{title ?? TITLES[type]}</strong>
        <div className="muted">{children}</div>
      </div>
    </div>
  )
}
