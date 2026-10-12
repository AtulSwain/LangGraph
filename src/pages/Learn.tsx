import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CONCEPTS, MODULES, conceptById } from '../data/concepts'
import { GRAPHS } from '../data/graphs'
import CodeBlock from '../components/CodeBlock'
import Callout from '../components/Callout'
import Graph3D, { Legend, edgeKey, type NodeKind } from '../components/Graph3D'
import Md from '../components/Md'

const STORAGE_KEY = 'lgu-progress-v1'

function loadProgress(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

/** Walks the diagram's edges from START, lighting one hop at a time. */
function useWalk(graphId?: string) {
  const g = graphId ? GRAPHS[graphId] : undefined
  const path = useMemo(() => {
    if (!g) return [] as string[]
    const out = ['__start__']
    const seen = new Set(out)
    let cur = '__start__'
    for (let i = 0; i < 12; i++) {
      const nexts = g.edges.filter((e) => e.from === cur)
      if (!nexts.length) break
      const fresh = nexts.find((e) => !seen.has(e.to)) ?? nexts[0]
      cur = fresh.to
      out.push(cur)
      if (cur === '__end__') break
      seen.add(cur)
    }
    return out
  }, [g])
  const [i, setI] = useState(0)
  useEffect(() => {
    setI(0)
    if (!path.length) return
    const t = setInterval(() => setI((x) => (x + 1) % path.length), 1300)
    return () => clearInterval(t)
  }, [path])
  const active = path[i]
  const prev = i > 0 ? path[i - 1] : undefined
  return { active: active ? [active] : [], edges: prev ? [edgeKey(prev, active)] : [] }
}

export default function Learn() {
  const { id } = useParams()
  const nav = useNavigate()
  const concept = conceptById(id ?? '') ?? CONCEPTS[0]
  const idx = CONCEPTS.findIndex((c) => c.id === concept.id)
  const [done, setDone] = useState<string[]>(loadProgress)
  const walk = useWalk(concept.diagram)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done))
    } catch {
      /* storage unavailable */
    }
  }, [done])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [concept.id])

  const isDone = done.includes(concept.id)
  const toggle = () => setDone((d) => (d.includes(concept.id) ? d.filter((x) => x !== concept.id) : [...d, concept.id]))
  const pct = Math.round((done.length / CONCEPTS.length) * 100)
  const prev = CONCEPTS[idx - 1]
  const next = CONCEPTS[idx + 1]
  const mod = MODULES.find((m) => m.id === concept.module)!
  const diagram = concept.diagram ? GRAPHS[concept.diagram] : undefined
  const kinds = diagram ? (Array.from(new Set(diagram.nodes.map((n) => n.kind ?? 'default'))) as NodeKind[]) : []

  const completeAndNext = () => {
    if (!isDone) setDone((d) => [...d, concept.id])
    if (next) nav(`/learn/${next.id}`)
  }

  return (
    <div className="page container">
      <div className="learn-layout">
        {/* ───── Sidebar ───── */}
        <aside className="sidebar">
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <b style={{ fontSize: '0.9rem' }}>Your progress</b>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--cyan)' }}>{pct}%</span>
            </div>
            <div className="progress"><div style={{ width: `${pct}%` }} /></div>
            <div className="dim" style={{ fontSize: '0.78rem', marginTop: 8 }}>
              {done.length}/{CONCEPTS.length} lessons · saved in this browser
            </div>
          </div>
          {MODULES.map((m, mi) => (
            <div key={m.id} className="side-group">
              <h5 style={{ color: m.color }}>
                {mi + 1}. {m.title}
              </h5>
              {CONCEPTS.filter((c) => c.module === m.id).map((c) => (
                <button key={c.id} className={`side-item ${c.id === concept.id ? 'active' : ''}`} onClick={() => nav(`/learn/${c.id}`)}>
                  <span className={`side-check ${done.includes(c.id) ? 'done' : ''}`}>{done.includes(c.id) ? '✓' : ''}</span>
                  <span>{c.title}</span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* ───── Lesson ───── */}
        <AnimatePresence mode="wait">
          <motion.article
            key={concept.id}
            className="lesson"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="row" style={{ marginBottom: 14 }}>
              <span className="tag" style={{ color: mod.color, borderColor: `${mod.color}66` }}>{mod.title}</span>
              <span className={`tag ${concept.level === 'Beginner' ? 'green' : concept.level === 'Intermediate' ? 'amber' : 'pink'}`}>{concept.level}</span>
              <span className="tag mono">Lesson {idx + 1} / {CONCEPTS.length}</span>
            </div>
            <h1>
              <span style={{ marginRight: 12 }}>{concept.icon}</span>
              {concept.title}
            </h1>
            <p className="tagline">{concept.tagline}</p>

            <Callout type="info" title="Why it matters">
              {concept.why}
            </Callout>

            <h2>Explanation</h2>
            {concept.body.map((p, i) => (
              <p key={i} className="muted" style={{ fontSize: '1.02rem' }}>
                <Md text={p} />
              </p>
            ))}

            {concept.analogy && (
              <Callout type="analogy">
                <Md text={concept.analogy} />
              </Callout>
            )}

            {diagram && (
              <>
                <h2>See it in 3D</h2>
                <Graph3D {...diagram} height={380} activeNodes={walk.active} activeEdges={walk.edges} camera={diagram.camera ?? [0, 0, 11.5]}>
                  <div className="stage-hud">
                    <Legend kinds={kinds} />
                  </div>
                </Graph3D>
              </>
            )}

            {concept.code && (
              <>
                <h2>Example</h2>
                <CodeBlock code={concept.code} title={concept.codeTitle} />
              </>
            )}

            {concept.more?.map((m) => (
              <div key={m.title}>
                <h3 style={{ marginTop: 28 }}>{m.title}</h3>
                {m.text && <p className="muted">{m.text}</p>}
                <CodeBlock code={m.code} />
              </div>
            ))}

            {concept.pitfalls && (
              <Callout type="warn" title="Common pitfalls">
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {concept.pitfalls.map((p) => (
                    <li key={p}>
                      <Md text={p} />
                    </li>
                  ))}
                </ul>
              </Callout>
            )}

            <h2>Key takeaways</h2>
            <ul className="takeaways">
              {concept.takeaways.map((t) => (
                <li key={t}>
                  <Md text={t} />
                </li>
              ))}
            </ul>

            <div className="row" style={{ marginTop: 28 }}>
              <button className={`btn ${isDone ? '' : 'btn-primary'}`} onClick={toggle}>
                {isDone ? '✓ Completed — undo' : 'Mark as complete'}
              </button>
              {next && (
                <button className="btn" onClick={completeAndNext}>
                  Complete & next →
                </button>
              )}
              {!next && (
                <Link to="/quiz" className="btn btn-primary">
                  🏆 Take the quiz
                </Link>
              )}
            </div>

            <div className="lesson-nav">
              {prev ? (
                <Link to={`/learn/${prev.id}`} className="btn btn-ghost">
                  ← {prev.title}
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link to={`/learn/${next.id}`} className="btn btn-ghost">
                  {next.title} →
                </Link>
              )}
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </div>
  )
}
