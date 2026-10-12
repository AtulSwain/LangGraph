import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, Html, OrbitControls, Stars, Float } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import * as THREE from 'three'
import { SceneLights, edgeKey } from '../components/Graph3D'
import Graph3D from '../components/Graph3D'
import { GRAPHS } from '../data/graphs'
import Reveal, { SectionHead } from '../components/Reveal'
import CodeBlock from '../components/CodeBlock'
import Callout from '../components/Callout'

interface Layer {
  id: string
  name: string
  sub: string
  color: string
  items: string[]
  desc: string
  pkg: string
}

const LAYERS: Layer[] = [
  {
    id: 'models',
    name: 'Models & Integrations',
    sub: 'The raw capabilities',
    color: '#64748b',
    pkg: 'langchain-anthropic, langchain-openai, langchain-postgres, …',
    items: ['Chat models (Anthropic, OpenAI, Google, Mistral, Ollama…)', 'Embedding models', 'Vector stores (pgvector, Pinecone, Chroma…)', 'External APIs & tools'],
    desc: 'The foundation: LLM providers, embeddings, databases and APIs. LangChain wraps hundreds of them in standard interfaces, so you can swap providers with one line.',
  },
  {
    id: 'core',
    name: 'LangChain Core',
    sub: 'Shared abstractions',
    color: '#60a5fa',
    pkg: 'langchain-core · @langchain/core',
    items: ['Runnable interface (invoke / stream / batch)', 'Messages (Human, AI, Tool, System)', 'Prompt templates', 'Tool & retriever interfaces', 'Callbacks / tracing hooks'],
    desc: 'Lightweight base package that defines the common language every component speaks. LangGraph nodes, LangChain chains and integrations all interoperate through it.',
  },
  {
    id: 'langchain',
    name: 'LangChain',
    sub: 'Components & high-level agents',
    color: '#34d399',
    pkg: 'langchain · langchain-community',
    items: ['create_agent + middleware (v1)', 'LCEL chains (prompt | model | parser)', 'Retrievers, text splitters, loaders', 'Structured output helpers'],
    desc: 'Batteries-included components and a high-level agent API. In v1, LangChain agents run on the LangGraph runtime, so you get persistence, streaming and HITL for free.',
  },
  {
    id: 'langgraph',
    name: 'LangGraph',
    sub: 'Orchestration runtime',
    color: '#a78bfa',
    pkg: 'langgraph · @langchain/langgraph',
    items: ['StateGraph & Functional API', 'Pregel execution engine (super-steps)', 'Checkpointers & Store', 'interrupt / Command / Send', 'Prebuilt: ToolNode, create_react_agent'],
    desc: 'The low-level orchestration layer: models your app as a stateful graph, executes it durably, and exposes persistence, memory, HITL and streaming as primitives.',
  },
  {
    id: 'platform',
    name: 'Deployment (LangGraph Platform)',
    sub: 'Run agents at scale',
    color: '#f472b6',
    pkg: 'langgraph-cli · langgraph-sdk · LangGraph Server',
    items: ['LangGraph Server (threads, runs, crons, webhooks)', 'Task queue & horizontal scaling', 'LangGraph Studio (visual debugger)', 'SDKs + React useStream', 'Cloud, hybrid or self-hosted'],
    desc: 'Production infrastructure for long-running, stateful agents: an opinionated API server with persistence, background runs, double-texting strategies and a visual IDE. Now offered as part of LangSmith (“LangSmith Deployment”).',
  },
]

const LANGSMITH: Layer = {
  id: 'langsmith',
  name: 'LangSmith',
  sub: 'Observe · Evaluate · Improve',
  color: '#fbbf24',
  pkg: 'langsmith SDK (framework-agnostic)',
  items: ['Tracing of every node, LLM & tool call', 'Datasets & evaluations (LLM-as-judge, trajectory)', 'Prompt hub & playground', 'Monitoring, dashboards, alerts', 'Annotation queues'],
  desc: 'A vertical pillar across the whole stack: traces anything (LangChain, LangGraph, or plain code via @traceable / OpenTelemetry) and turns traces into datasets and evaluations.',
}

function Slab({ layer, index, selected, onSelect }: { layer: Layer; index: number; selected: boolean; onSelect: (l: Layer) => void }) {
  const ref = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  const baseY = -2.6 + index * 1.25
  useFrame((s, dt) => {
    if (!ref.current) return
    const targetY = baseY + (selected ? 0.35 : hover ? 0.15 : 0) + Math.sin(s.clock.elapsedTime * 0.8 + index) * 0.04
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 1 - Math.pow(0.002, dt))
  })
  return (
    <group ref={ref} position={[-1, baseY, 0]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect(layer)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        <boxGeometry args={[7.5, 0.55, 4]} />
        <meshStandardMaterial
          color={layer.color}
          emissive={layer.color}
          emissiveIntensity={selected ? 0.75 : hover ? 0.5 : 0.18}
          transparent
          opacity={selected ? 0.85 : 0.55}
          roughness={0.2}
          metalness={0.5}
        />
        <Edges color={selected ? '#ffffff' : layer.color} threshold={15} />
      </mesh>
      {/* little "component" studs on top of each slab */}
      {layer.items.slice(0, 4).map((_, i) => (
        <mesh key={i} position={[-2.6 + i * 1.75, 0.42, 0.6 - (i % 2) * 1.2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.28, 24]} />
          <meshStandardMaterial color={layer.color} emissive={layer.color} emissiveIntensity={0.9} />
        </mesh>
      ))}
      <Html position={[-1.2, 0.05, 2.05]} center style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
        <div className={`node-label ${selected ? 'active' : ''}`} style={{ transform: 'none', fontSize: 13, borderColor: layer.color }}>
          {layer.name}
        </div>
      </Html>
    </group>
  )
}

function Pillar({ selected, onSelect }: { selected: boolean; onSelect: (l: Layer) => void }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = (selected ? 0.8 : 0.3) + Math.sin(s.clock.elapsedTime * 2) * 0.1
  })
  return (
    <group position={[4.2, 0, 0]}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(LANGSMITH)
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <boxGeometry args={[0.9, 6.4, 4]} />
        <meshStandardMaterial color={LANGSMITH.color} emissive={LANGSMITH.color} transparent opacity={selected ? 0.8 : 0.45} />
        <Edges color={selected ? '#fff' : LANGSMITH.color} />
      </mesh>
      <Html position={[0, 3.6, 0]} center style={{ pointerEvents: 'none' }}>
        <div className={`node-label ${selected ? 'active' : ''}`} style={{ borderColor: LANGSMITH.color }}>LangSmith</div>
      </Html>
    </group>
  )
}

function DataFlow() {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  useFrame((s) => {
    refs.current.forEach((m, i) => {
      if (!m) return
      const t = (s.clock.elapsedTime * 0.35 + i / 8) % 1
      m.position.set(-1 + Math.sin(i * 2.1) * 2.5, -2.8 + t * 6.2, Math.cos(i * 1.3) * 1.2)
      ;(m.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI)
    })
  })
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#ffffff" transparent />
        </mesh>
      ))}
    </>
  )
}

// ───────────────────────── Pregel visualizer ─────────────────────────
const PREGEL_STEPS = [
  { step: -1, phase: 'Input', nodes: ['__start__'], edges: [] as string[], channel: '[]', note: 'invoke({"aggregate": []}) writes the input to the channels. The START node is triggered.' },
  { step: 0, phase: 'Plan', nodes: ['a'], edges: [edgeKey('__start__', 'a')], channel: '[]', note: 'PLAN: node a subscribes to channels updated by START → it is scheduled for super-step 0.' },
  { step: 0, phase: 'Execute', nodes: ['a'], edges: [], channel: '[]', note: 'EXECUTE: a runs and returns {"aggregate": ["A"]}. Writes are buffered, not visible yet.' },
  { step: 0, phase: 'Update', nodes: [], edges: [], channel: '["A"]', note: 'UPDATE: buffered writes are applied through the operator.add reducer. ✓ Checkpoint saved.' },
  { step: 1, phase: 'Plan', nodes: ['b', 'c'], edges: [edgeKey('a', 'b'), edgeKey('a', 'c')], channel: '["A"]', note: 'PLAN: two edges leave a → both b and c are triggered in the SAME super-step.' },
  { step: 1, phase: 'Execute', nodes: ['b', 'c'], edges: [], channel: '["A"]', note: 'EXECUTE: b and c run in parallel. Neither sees the other’s output — they both read ["A"].' },
  { step: 1, phase: 'Update', nodes: [], edges: [], channel: '["A", "B", "C"]', note: 'UPDATE: both writes are merged by the reducer (no conflict thanks to operator.add). ✓ Checkpoint saved.' },
  { step: 2, phase: 'Plan', nodes: ['d'], edges: [edgeKey('b', 'd'), edgeKey('c', 'd')], channel: '["A", "B", "C"]', note: 'PLAN: d is triggered by b and c — it runs once (fan-in).' },
  { step: 2, phase: 'Execute', nodes: ['d'], edges: [], channel: '["A", "B", "C"]', note: 'EXECUTE: d sees the merged list and returns {"aggregate": ["D"]}.' },
  { step: 2, phase: 'Update', nodes: [], edges: [], channel: '["A", "B", "C", "D"]', note: 'UPDATE: applied. ✓ Checkpoint saved.' },
  { step: 3, phase: 'Done', nodes: ['__end__'], edges: [edgeKey('d', '__end__')], channel: '["A", "B", "C", "D"]', note: 'No more nodes are triggered → the run halts and returns the final state.' },
]

const PHASE_COLORS: Record<string, string> = { Input: '#34d399', Plan: '#60a5fa', Execute: '#a78bfa', Update: '#fbbf24', Done: '#fb7185' }

function PregelVisualizer() {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(true)
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setI((x) => (x + 1) % PREGEL_STEPS.length), 2000)
    return () => clearInterval(t)
  }, [playing])
  const s = PREGEL_STEPS[i]
  return (
    <div className="sim-layout">
      <Graph3D {...GRAPHS.parallel} height={460} activeNodes={s.nodes} activeEdges={s.edges} particles={2}>
        <div className="stage-hud">
          <span className="tag mono" style={{ color: PHASE_COLORS[s.phase], borderColor: PHASE_COLORS[s.phase] }}>
            {s.step >= 0 ? `super-step ${s.step}` : 'input'} · {s.phase}
          </span>
        </div>
      </Graph3D>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="row">
          {['Plan', 'Execute', 'Update'].map((p) => (
            <span key={p} className="tag" style={s.phase === p ? { color: '#0a0a18', background: PHASE_COLORS[p], borderColor: PHASE_COLORS[p] } : {}}>
              {p}
            </span>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ minHeight: 78, margin: 0 }}>
            {s.note}
          </motion.p>
        </AnimatePresence>
        <div>
          <label className="lbl">channel: aggregate (reducer = operator.add)</label>
          <div className="state-box" style={{ color: 'var(--amber)' }}>{s.channel}</div>
        </div>
        <div className="timeline">
          {PREGEL_STEPS.map((_, k) => (
            <button key={k} className={`cp ${k === i ? 'current' : k < i ? 'past' : ''}`} onClick={() => { setI(k); setPlaying(false) }}>
              {k}
            </button>
          ))}
        </div>
        <div className="row">
          <button className="btn btn-sm" onClick={() => { setI((x) => Math.max(0, x - 1)); setPlaying(false) }}>◀ Back</button>
          <button className="btn btn-sm btn-primary" onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
          <button className="btn btn-sm" onClick={() => { setI((x) => Math.min(PREGEL_STEPS.length - 1, x + 1)); setPlaying(false) }}>Next ▶</button>
        </div>
      </div>
    </div>
  )
}

const LIFECYCLE = [
  { icon: '💻', t: 'Client', d: 'Your app / SDK / useStream posts a run to a thread.' },
  { icon: '🌐', t: 'LangGraph Server', d: 'Validates, assigns a run id, applies double-texting strategy.' },
  { icon: '📬', t: 'Task queue', d: 'Run is queued; any worker can pick it up.' },
  { icon: '⚙️', t: 'Worker → Pregel', d: 'Loads the latest checkpoint and executes super-steps.' },
  { icon: '🗄️', t: 'Checkpointer DB', d: 'Each super-step persisted (Postgres). Store for long-term memory.' },
  { icon: '📡', t: 'Stream back', d: 'Events streamed to the client via SSE; traces to LangSmith.' },
]

export default function Architecture() {
  const [sel, setSel] = useState<Layer>(LAYERS[3])
  return (
    <div className="page">
      <section className="container" style={{ paddingTop: 20 }}>
        <SectionHead
          eyebrow="Architecture · 3D"
          title={<>The LangChain <span className="grad-text">ecosystem stack</span></>}
          sub="Click a layer to explore it. Data flows upward from raw model capabilities to production deployments, while LangSmith observes every layer."
        />
        <div className="sim-layout">
          <div className="stage" style={{ height: 560 }}>
            <Canvas camera={{ position: [6, 4.5, 11], fov: 45 }} dpr={[1, 1.75]}>
              <Suspense fallback={null}>
                <SceneLights />
                <Stars radius={60} depth={40} count={1500} factor={3} fade />
                <Float speed={1} rotationIntensity={0.05} floatIntensity={0.2}>
                  <group position={[0.4, 0.2, 0]}>
                    {LAYERS.map((l, i) => (
                      <Slab key={l.id} layer={l} index={i} selected={sel.id === l.id} onSelect={setSel} />
                    ))}
                    <Pillar selected={sel.id === 'langsmith'} onSelect={setSel} />
                    <DataFlow />
                  </group>
                </Float>
                <OrbitControls enablePan={false} enableDamping minDistance={7} maxDistance={22} autoRotate autoRotateSpeed={0.4} makeDefault />
              </Suspense>
            </Canvas>
            <div className="stage-hint">click a layer · drag to orbit</div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={sel.id} className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ borderColor: `${sel.color}66` }}>
              <span className="tag" style={{ color: sel.color, borderColor: `${sel.color}66` }}>{sel.sub}</span>
              <h2 style={{ marginTop: 14, fontSize: '1.8rem' }}>{sel.name}</h2>
              <p className="muted">{sel.desc}</p>
              <label className="lbl" style={{ marginTop: 18 }}>Key pieces</label>
              <ul style={{ paddingLeft: 18, margin: '0 0 16px' }}>
                {sel.items.map((it) => (
                  <li key={it} style={{ marginBottom: 4 }}>{it}</li>
                ))}
              </ul>
              <label className="lbl">Packages</label>
              <code>{sel.pkg}</code>
              <div className="pills" style={{ marginTop: 22 }}>
                {[...LAYERS, LANGSMITH].map((l) => (
                  <button key={l.id} className={`pill ${sel.id === l.id ? 'active' : ''}`} onClick={() => setSel(l)}>
                    {l.name.split(' (')[0]}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="section container">
        <SectionHead
          eyebrow="Runtime internals"
          title={<>Inside the <span className="grad-text">Pregel engine</span></>}
          sub="LangGraph executes graphs in super-steps — Plan, Execute (in parallel), Update. Step through the classic fan-out / fan-in example and watch the channel fill up."
        />
        <PregelVisualizer />
        <Reveal>
          <CodeBlock
            title="the graph being visualized"
            code={{
              python: `import operator
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    aggregate: Annotated[list, operator.add]

def node(name):
    return lambda state: {"aggregate": [name]}

b = StateGraph(State)
for n in "abcd":
    b.add_node(n, node(n.upper()))
b.add_edge(START, "a")
b.add_edge("a", "b"); b.add_edge("a", "c")
b.add_edge("b", "d"); b.add_edge("c", "d")
b.add_edge("d", END)
graph = b.compile()

graph.invoke({"aggregate": []})
# {'aggregate': ['A', 'B', 'C', 'D']}`,
            }}
          />
        </Reveal>
        <div className="grid grid-3" style={{ marginTop: 24 }}>
          {[
            ['Channels', 'Each state key is backed by a channel: LastValue (overwrite), BinaryOperatorAggregate (reducer), Topic (pub/sub of many values), EphemeralValue (cleared after a step).'],
            ['Transactions', 'A super-step is all-or-nothing. If a parallel node fails, the step’s writes aren’t applied; successful siblings’ writes are saved as pending writes so they don’t re-run on retry.'],
            ['Triggers', 'A node runs when a channel it listens to changed in the previous step. When no channel changes, the graph halts — that’s how END works under the hood.'],
          ].map(([t, d]) => (
            <Reveal key={t}>
              <div className="card" style={{ height: '100%' }}>
                <h3>{t}</h3>
                <p className="muted" style={{ margin: 0 }}>{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <SectionHead eyebrow="Production" title={<>Life of a <span className="grad-text">run</span> in production</>} sub="What happens between a user pressing “send” and tokens streaming back, when your graph is deployed on LangGraph Server." />
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          {LIFECYCLE.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <div className="card" style={{ height: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>{s.icon}</div>
                <div className="mono dim" style={{ fontSize: '0.72rem' }}>STEP {i + 1}</div>
                <b>{s.t}</b>
                <p className="muted" style={{ fontSize: '0.88rem', margin: '8px 0 0' }}>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Callout type="tip" title="Double-texting">
          What if a user sends a second message while the first run is still going? LangGraph Server lets you choose: <b>reject</b> the new one, <b>enqueue</b> it,
          <b> interrupt</b> the current run (keeping progress), or <b>rollback</b> the current run and start fresh.
        </Callout>
      </section>

      <section className="section container">
        <SectionHead eyebrow="Persistence model" title={<>Threads, checkpoints & <span className="grad-text">the store</span></>} />
        <div className="grid grid-2">
          <Reveal>
            <div className="card" style={{ height: '100%' }}>
              <h3>🧵 Thread = timeline of checkpoints</h3>
              <div className="row" style={{ gap: 6, margin: '18px 0' }}>
                {['cp-0\ninput', 'cp-1\nagent', 'cp-2\ntools', 'cp-3\nagent', 'cp-4\n⏸ interrupt'].map((c, i) => (
                  <div key={c} className="row" style={{ gap: 6 }}>
                    <div className="cp past" style={{ width: 82, height: 54, whiteSpace: 'pre', textAlign: 'center', lineHeight: 1.3, fontSize: '0.72rem' }}>{c}</div>
                    {i < 4 && <span className="flow-arrow">→</span>}
                  </div>
                ))}
              </div>
              <p className="muted" style={{ margin: 0 }}>Scoped to one <code>thread_id</code>. Stores the full state after every super-step: short-term memory, HITL pauses, crash recovery, time travel.</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card" style={{ height: '100%' }}>
              <h3>🗄️ Store = shared long-term memory</h3>
              <div className="state-box" style={{ margin: '18px 0' }}>
{`("memories", "user-ada")
  ├─ "food"   → {"fact": "vegetarian"}
  ├─ "style"  → {"fact": "prefers bullet points"}
("org", "acme", "policies")
  └─ "refund" → {"max_amount": 200}`}
              </div>
              <p className="muted" style={{ margin: 0 }}>Namespaced JSON documents shared across all threads, with optional semantic (vector) search. Perfect for user profiles and learned instructions.</p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
