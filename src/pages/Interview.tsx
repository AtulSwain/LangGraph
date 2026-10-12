import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { INTERVIEW } from '../data/knowledge'
import { SectionHead } from '../components/Reveal'
import Icon from '../components/Icon'

export default function Interview() {
  const tags = useMemo(() => ['All', ...Array.from(new Set(INTERVIEW.map((q) => q.tag)))], [])
  const [tag, setTag] = useState('All')
  const [open, setOpen] = useState<number | null>(0)
  const [flash, setFlash] = useState(false)
  const [card, setCard] = useState(0)
  const [reveal, setReveal] = useState(false)
  const list = INTERVIEW.filter((q) => tag === 'All' || q.tag === tag)

  return (
    <div className="page container" style={{ maxWidth: 960 }}>
      <SectionHead
        eyebrow="Interview prep"
        title={
          <>
            Answer like a <span className="grad-text">senior engineer.</span>
          </>
        }
        sub={`${INTERVIEW.length} questions that come up in LangGraph and agent-engineering interviews, with concise model answers. Read them, or flip into flash-card mode and test yourself.`}
      />
      <div className="row" style={{ marginBottom: 22, justifyContent: 'space-between' }}>
        <div className="pills">
          {tags.map((t) => (
            <button key={t} className={`pill ${tag === t ? 'active' : ''}`} onClick={() => { setTag(t); setCard(0); setReveal(false); setOpen(null) }}>
              {t}
            </button>
          ))}
        </div>
        <button className="btn btn-sm" onClick={() => { setFlash((f) => !f); setReveal(false) }}>
          <Icon name={flash ? 'FileText' : 'Sparkles'} size={14} /> {flash ? 'List mode' : 'Flash-card mode'}
        </button>
      </div>

      {flash ? (
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tag}-${card}-${reveal}`}
              initial={{ opacity: 0, rotateX: -12 }}
              animate={{ opacity: 1, rotateX: 0 }}
              exit={{ opacity: 0, rotateX: 12 }}
              transition={{ duration: 0.3 }}
              className={`card flash ${reveal ? 'inverse' : ''}`}
              onClick={() => setReveal((r) => !r)}
            >
              <div className="mono" style={{ fontSize: '0.72rem', opacity: 0.6 }}>
                {list[card].tag.toUpperCase()} · {card + 1} / {list.length} · {reveal ? 'ANSWER' : 'QUESTION — click to reveal'}
              </div>
              <div className={reveal ? '' : 'serif'} style={{ fontSize: reveal ? '1.1rem' : '2rem', lineHeight: 1.35, marginTop: 18 }}>
                {reveal ? list[card].a : list[card].q}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
            <button className="btn btn-sm" disabled={card === 0} onClick={() => { setCard((c) => c - 1); setReveal(false) }}>
              <Icon name="ArrowLeft" size={14} /> Prev
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setReveal((r) => !r)}>{reveal ? 'Hide answer' : 'Reveal answer'}</button>
            <button className="btn btn-sm" disabled={card === list.length - 1} onClick={() => { setCard((c) => c + 1); setReveal(false) }}>
              Next <Icon name="ArrowRight" size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="qa-list">
          {list.map((q, i) => (
            <div key={q.q} className={`qa ${open === i ? 'open' : ''}`}>
              <button className="qa-q" onClick={() => setOpen(open === i ? null : i)}>
                <span className="mono dim">{String(i + 1).padStart(2, '0')}</span>
                <span className="qa-text">{q.q}</span>
                <span className="tag">{q.tag}</span>
                <Icon name="ChevronDown" size={16} style={{ transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <p className="muted qa-a">{q.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
