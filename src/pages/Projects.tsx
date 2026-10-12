import { useParams } from 'react-router-dom'
import { useNavigate } from '../components/nav'
import { AnimatePresence, motion } from 'framer-motion'
import { PROJECTS } from '../data/projects'
import { GRAPHS } from '../data/graphs'
import Graph3D, { Legend, type NodeKind } from '../components/Graph3D'
import CodeBlock from '../components/CodeBlock'
import Icon from '../components/Icon'
import Callout from '../components/Callout'
import { GlowCard, SectionHead } from '../components/Reveal'
import { useWalk } from '../components/useWalk'

export default function Projects() {
  const { id } = useParams()
  const nav = useNavigate()
  const project = PROJECTS.find((p) => p.id === id) ?? PROJECTS[0]
  const g = GRAPHS[project.graph]
  const walk = useWalk(project.graph)
  const kinds = Array.from(new Set(g.nodes.map((n) => n.kind ?? 'default'))) as NodeKind[]

  return (
    <div className="page container">
      <SectionHead
        eyebrow="Build"
        title={
          <>
            Six real projects, <span className="grad-text">start to finish.</span>
          </>
        }
        sub="Complete, runnable code for production-shaped agents. Each project lists the concepts it teaches, the install command, a step-by-step plan, the full source and ideas to extend it."
      />

      <div className="grid grid-3" style={{ marginBottom: 48 }}>
        {PROJECTS.map((p, i) => (
          <GlowCard
            key={p.id}
            onClick={() => nav(`/projects/${p.id}`)}
            className={p.id === project.id ? 'selected' : ''}
            style={{ cursor: 'pointer', padding: 20 }}
          >
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="icon-badge" style={{ margin: 0 }}>
                <Icon name={p.icon} size={20} />
              </span>
              <span className="serif" style={{ fontSize: '2rem', color: 'var(--dim)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 style={{ marginBottom: 4 }}>{p.title}</h3>
            <div className="mono dim" style={{ fontSize: '0.75rem' }}>
              {p.level.toUpperCase()} · {p.time}
            </div>
          </GlowCard>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={project.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
          <div className="grid grid-2" style={{ gap: 40, alignItems: 'start' }}>
            <div>
              <div className="eyebrow">Project {PROJECTS.indexOf(project) + 1}</div>
              <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)' }}>{project.title}</h2>
              <p className="section-sub">{project.summary}</p>
              <dl className="kv" style={{ margin: '24px 0' }}>
                <dt>Level</dt>
                <dd>{project.level}</dd>
                <dt>Time</dt>
                <dd>{project.time}</dd>
                <dt>You’ll learn</dt>
                <dd>
                  <div className="row" style={{ gap: 6 }}>
                    {project.concepts.map((c) => (
                      <span key={c} className="tag">
                        {c}
                      </span>
                    ))}
                  </div>
                </dd>
              </dl>
              <h3>Plan</h3>
              <ol className="step-list">
                {project.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
            <Graph3D {...g} height={440} activeNodes={walk.active} activeEdges={walk.edges} camera={g.camera ?? [0, 0, 12]}>
              <div className="stage-hud">
                <Legend kinds={kinds} />
              </div>
            </Graph3D>
          </div>

          <h3 style={{ marginTop: 36 }}>Install</h3>
          <CodeBlock code={{ bash: project.install }} />
          <h3 style={{ marginTop: 28 }}>Full source</h3>
          <CodeBlock code={project.code} title={`${project.id.replace(/-/g, '_')}.py`} />

          <h3 style={{ marginTop: 28 }}>Take it further</h3>
          <div className="grid grid-3">
            {project.extend.map((e, i) => (
              <div key={e} className="card" style={{ padding: 18 }}>
                <span className="mono dim" style={{ fontSize: '0.72rem' }}>
                  CHALLENGE {i + 1}
                </span>
                <div style={{ marginTop: 6 }}>{e}</div>
              </div>
            ))}
          </div>
          <Callout type="tip" title="Run it">
            Set your provider API key (e.g. <code>ANTHROPIC_API_KEY</code>), and optionally <code>LANGSMITH_TRACING=true</code> with <code>LANGSMITH_API_KEY</code> to watch every step in LangSmith. Model names are examples — use any
            model your provider offers.
          </Callout>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
