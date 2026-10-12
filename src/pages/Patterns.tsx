import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PATTERNS } from '../data/patterns'
import { GRAPHS } from '../data/graphs'
import Graph3D, { Legend, edgeKey, type NodeKind } from '../components/Graph3D'
import CodeBlock from '../components/CodeBlock'
import Icon from '../components/Icon'
import { SectionHead, GlowCard } from '../components/Reveal'
import Callout from '../components/Callout'

const CATS = ['All', 'Workflow', 'Agent', 'Multi-Agent', 'Retrieval', 'Oversight'] as const

export default function Patterns() {
  const { id } = useParams()
  const nav = useNavigate()
  const [cat, setCat] = useState<(typeof CATS)[number]>('All')
  const pattern = PATTERNS.find((p) => p.id === id) ?? PATTERNS[3]
  const g = GRAPHS[pattern.graph]
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    setI(0)
    setPlaying(true)
  }, [pattern.id])
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setI((x) => (x + 1) % pattern.path.length), 1400)
    return () => clearInterval(t)
  }, [playing, pattern.path.length])

  const active = pattern.path[i]
  const prev = i > 0 ? pattern.path[i - 1] : undefined
  // the parallel pattern lights up siblings together
  const activeNodes = pattern.id === 'parallel' && (active === 'b' || active === 'c') ? ['b', 'c'] : pattern.id === 'map-reduce' && active.startsWith('w') ? ['w1', 'w2', 'w3'] : [active]
  const activeEdges = prev ? [edgeKey(prev, active)] : []
  if (pattern.id === 'map-reduce' && active.startsWith('w')) activeEdges.push(edgeKey('plan', 'w1'), edgeKey('plan', 'w2'), edgeKey('plan', 'w3'))
  if (pattern.id === 'parallel' && (active === 'b' || active === 'c')) activeEdges.push(edgeKey('a', 'b'), edgeKey('a', 'c'))

  const kinds = useMemo(() => Array.from(new Set(g.nodes.map((n) => n.kind ?? 'default'))) as NodeKind[], [g])
  const list = PATTERNS.filter((p) => cat === 'All' || p.category === cat)

  return (
    <div className="page container">
      <SectionHead
        eyebrow="Agent architectures"
        title={<>Patterns, <span className="grad-text">animated in 3D</span></>}
        sub="From deterministic workflows to autonomous multi-agent systems. Each pattern shows a sample execution path — follow the glowing node."
      />

      <div className="pills" style={{ marginBottom: 20 }}>
        {CATS.map((c) => (
          <button key={c} className={`pill ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12, marginBottom: 36 }}>
        {list.map((p) => (
          <GlowCard
            key={p.id}
            onClick={() => nav(`/patterns/${p.id}`)}
            style={{ padding: 16, cursor: 'pointer', borderColor: p.id === pattern.id ? 'rgba(255,255,255,0.7)' : undefined, background: p.id === pattern.id ? 'rgba(255,255,255,0.1)' : undefined }}
          >
            <div style={{ marginBottom: 8 }}><Icon name={p.icon} size={20} /></div>
            <b style={{ fontSize: '0.95rem' }}>{p.name}</b>
            <div className="dim" style={{ fontSize: '0.75rem' }}>{p.category}</div>
          </GlowCard>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={pattern.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="tag violet">{pattern.category}</span>
          </div>
          <h2 style={{ fontSize: '2.2rem' }}>
            {pattern.name}
          </h2>
          <p className="section-sub" style={{ marginBottom: 24 }}>{pattern.summary}</p>

          <Graph3D {...g} height={500} activeNodes={activeNodes} activeEdges={activeEdges} camera={g.camera ?? [0, 0, 12]} particles={2}>
            <div className="stage-hud">
              <Legend kinds={kinds} />
              <div className="row" style={{ gap: 6 }}>
                <span className="tag cyan mono">step {i + 1}/{pattern.path.length}: {g.nodes.find((n) => n.id === active)?.label ?? active}</span>
                <button className="btn btn-sm" onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚' : '▶'}</button>
                <button className="btn btn-sm" onClick={() => { setPlaying(false); setI((x) => (x + 1) % pattern.path.length) }}>⏭</button>
              </div>
            </div>
          </Graph3D>

          <div className="grid grid-2" style={{ marginTop: 24 }}>
            <div className="card">
              <h3>How it works</h3>
              <ol className="muted" style={{ paddingLeft: 20, margin: 0 }}>
                {pattern.how.map((h) => <li key={h} style={{ marginBottom: 6 }}>{h}</li>)}
              </ol>
            </div>
            <div className="card">
              <h3>Use it when</h3>
              <ul className="muted" style={{ paddingLeft: 20, margin: 0 }}>
                {pattern.useWhen.map((h) => <li key={h} style={{ marginBottom: 6 }}>{h}</li>)}
              </ul>
            </div>
            <div className="card" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
              <h3>+ Strengths</h3>
              <ul className="muted" style={{ paddingLeft: 20, margin: 0 }}>
                {pattern.pros.map((h) => <li key={h} style={{ marginBottom: 6 }}>{h}</li>)}
              </ul>
            </div>
            <div className="card" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
              <h3>− Trade-offs</h3>
              <ul className="muted" style={{ paddingLeft: 20, margin: 0 }}>
                {pattern.cons.map((h) => <li key={h} style={{ marginBottom: 6 }}>{h}</li>)}
              </ul>
            </div>
          </div>

          <h3 style={{ marginTop: 32 }}>Implementation sketch</h3>
          <CodeBlock code={pattern.code} />
        </motion.div>
      </AnimatePresence>

      <div className="divider" />
      <SectionHead eyebrow="Choosing" title="Workflow or agent?" sub="A useful rule of thumb: use the simplest pattern that works. Autonomy costs latency, money and predictability." />
      <div className="table-wrap">
        <table className="nice">
          <thead>
            <tr>
              <th>Pattern</th>
              <th>Who decides the path?</th>
              <th>Predictability</th>
              <th>Cost / latency</th>
              <th>Typical use</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Prompt chaining', 'Developer (fixed)', '★★★★★', 'Low', 'Content pipelines'],
              ['Routing', 'LLM picks a branch once', '★★★★☆', 'Low', 'Support triage'],
              ['Parallelization', 'Developer (fixed)', '★★★★☆', 'Medium', 'Guardrails, voting'],
              ['Orchestrator-workers', 'LLM plans sub-tasks', '★★★☆☆', 'Medium-High', 'Reports, multi-file edits'],
              ['Reflection', 'LLM grader loops', '★★★☆☆', 'Medium-High', 'Code, writing quality'],
              ['ReAct agent', 'LLM at every step', '★★☆☆☆', 'Variable', 'Open-ended tasks with tools'],
              ['Multi-agent', 'Many LLMs', '★★☆☆☆', 'High', 'Complex, multi-skill domains'],
            ].map((r) => (
              <tr key={r[0]}>
                {r.map((c, k) => <td key={k} className={k === 0 ? '' : 'muted'}>{k === 0 ? <b>{c}</b> : c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="tip" title="Mix and match">
        Patterns compose. A supervisor’s workers can be ReAct agents; a ReAct agent’s tool can interrupt for human approval; an orchestrator’s workers can each run a reflection loop. In LangGraph they are all just nodes, edges and subgraphs.
      </Callout>
    </div>
  )
}
