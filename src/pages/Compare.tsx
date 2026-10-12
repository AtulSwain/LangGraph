import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FRAMEWORKS } from '../data/knowledge'
import Callout from '../components/Callout'
import Reveal, { SectionHead } from '../components/Reveal'

const DIMS: { key: keyof (typeof FRAMEWORKS)[number]; label: string }[] = [
  { key: 'by', label: 'Maintainer' },
  { key: 'langs', label: 'Languages' },
  { key: 'model', label: 'Orchestration model' },
  { key: 'persistence', label: 'Persistence' },
  { key: 'hitl', label: 'Human-in-the-loop' },
  { key: 'bestFor', label: 'Best for' },
  { key: 'tradeoff', label: 'Trade-off' },
]

export default function Compare() {
  const [a, setA] = useState(0)
  const [b, setB] = useState(2)
  const A = FRAMEWORKS[a]
  const B = FRAMEWORKS[b]
  return (
    <div className="page container">
      <SectionHead
        eyebrow="Landscape"
        title={
          <>
            LangGraph <span className="grad-text">and the alternatives.</span>
          </>
        }
        sub="A fair, practical comparison of today’s agent frameworks. There is no single winner — the right choice depends on how much control, durability and abstraction you need."
      />

      <h3>Head to head</h3>
      <div className="grid grid-2" style={{ marginBottom: 14 }}>
        {[
          [a, setA],
          [b, setB],
        ].map(([v, set], k) => (
          <select key={k} className="input" value={v as number} onChange={(e) => (set as (n: number) => void)(Number(e.target.value))}>
            {FRAMEWORKS.map((f, i) => (
              <option key={f.name} value={i}>
                {f.name}
              </option>
            ))}
          </select>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${a}-${b}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="table-wrap">
          <table className="nice">
            <thead>
              <tr>
                <th style={{ width: '18%' }}></th>
                <th>{A.name}</th>
                <th>{B.name}</th>
              </tr>
            </thead>
            <tbody>
              {DIMS.map((d) => (
                <tr key={d.key}>
                  <td className="mono dim" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{d.label}</td>
                  <td>{A[d.key]}</td>
                  <td>{B[d.key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </AnimatePresence>

      <section className="section" style={{ paddingBottom: 0 }}>
        <SectionHead eyebrow="All frameworks" title="At a glance." />
        <div className="grid grid-3">
          {FRAMEWORKS.map((f, i) => (
            <Reveal key={f.name} delay={i * 0.03}>
              <div className={`card ${i === 0 ? 'inverse' : ''}`} style={{ height: '100%' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0 }}>{f.name}</h3>
                  <span className="tag">{f.langs}</span>
                </div>
                <p style={{ fontSize: '0.9rem', margin: '12px 0', opacity: 0.85 }}>{f.model}</p>
                <div style={{ fontSize: '0.85rem' }}>
                  <b>Best for:</b> <span style={{ opacity: 0.8 }}>{f.bestFor}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead eyebrow="Decision guide" title="Choose LangGraph when…" />
        <div className="grid grid-2">
          <div className="card">
            <h3>LangGraph is a great fit</h3>
            <ul className="clean-list muted">
              <li>You need precise control over every step and transition</li>
              <li>Runs are long, must survive restarts, or wait on humans</li>
              <li>You need time travel, replay and auditability</li>
              <li>You want to mix deterministic workflow steps with agentic ones</li>
              <li>You deploy in Python or TypeScript and want provider freedom</li>
            </ul>
          </div>
          <div className="card">
            <h3>Consider something else</h3>
            <ul className="clean-list muted">
              <li>A single prompt or linear chain — use plain code or LangChain</li>
              <li>A quick role-play multi-agent prototype — CrewAI is fast to start</li>
              <li>You’re all-in on one vendor’s cloud and its SDK conventions</li>
              <li>You only need RAG over documents with minimal orchestration</li>
            </ul>
          </div>
        </div>
        <Callout type="info" title="A note on this comparison">
          Frameworks evolve quickly; this table summarizes their general design at the time of writing. Several also interoperate — e.g. tools via MCP, or observability through OpenTelemetry and LangSmith.
        </Callout>
      </section>
    </div>
  )
}
