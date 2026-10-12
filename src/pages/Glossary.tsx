import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GLOSSARY, CHEATSHEET } from '../data/glossary'
import { SectionHead } from '../components/Reveal'
import CodeBlock from '../components/CodeBlock'

const CATS = ['All', 'Core', 'Control', 'Persistence', 'HITL', 'Runtime', 'Ecosystem', 'LangChain'] as const
const CAT_COLOR: Record<string, string> = { Core: 'cyan', Control: 'violet', Persistence: 'green', HITL: 'pink', Runtime: 'amber', Ecosystem: 'violet', LangChain: 'green' }

export default function Glossary() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cat, setCat] = useState<(typeof CATS)[number]>('All')
  const terms = GLOSSARY.filter((t) => (cat === 'All' || t.cat === cat) && (t.term + ' ' + t.def).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="page container">
      <SectionHead eyebrow="Reference" title={<>Cheatsheet & <span className="grad-text">glossary</span></>} sub="Everything at a glance. Search the glossary, then grab copy-ready snippets for the most common LangGraph tasks." />

      <h2 style={{ fontSize: '2rem' }}>API cheatsheet</h2>
      <div className="grid grid-3" style={{ marginBottom: 56 }}>
        {CHEATSHEET.map((c) => (
          <div key={c.title}>
            <div className="mono dim" style={{ fontSize: '0.8rem', marginBottom: -6 }}>{c.title}</div>
            <CodeBlock code={c.code} title={c.title} />
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '2rem' }}>Glossary</h2>
      <input className="input" placeholder={`Search ${GLOSSARY.length} terms… (e.g. reducer, thread, Send)`} value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 14, fontSize: '1rem', padding: '14px 18px' }} />
      <div className="pills" style={{ marginBottom: 20 }}>
        {CATS.map((c) => (
          <button key={c} className={`pill ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-2">
        {terms.map((t, i) => (
          <motion.div key={t.term} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="card" style={{ padding: 18 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              <b className="mono" style={{ fontSize: '1rem' }}>{t.term}</b>
              <span className={`tag ${CAT_COLOR[t.cat]}`}>{t.cat}</span>
            </div>
            <div className="muted" style={{ fontSize: '0.93rem' }}>{t.def}</div>
            {t.code && <code style={{ display: 'inline-block', marginTop: 10 }}>{t.code}</code>}
          </motion.div>
        ))}
        {terms.length === 0 && <p className="muted">No terms match “{q}”.</p>}
      </div>
    </div>
  )
}
