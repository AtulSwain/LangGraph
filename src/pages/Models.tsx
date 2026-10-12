import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, Float, Html, OrbitControls, Stars } from '@react-three/drei'
import { Suspense, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { PROVIDERS, ROLES } from '../data/knowledge'
import { SceneLights } from '../components/Graph3D'
import CodeBlock from '../components/CodeBlock'
import Callout from '../components/Callout'
import Icon from '../components/Icon'
import Reveal, { SectionHead } from '../components/Reveal'

/** 3D: a central "graph" core with provider satellites orbiting; click one to inspect. */
function Orbiters({ sel, onSel }: { sel: number; onSel: (i: number) => void }) {
  const group = useRef<THREE.Group>(null)
  const positions = useMemo(
    () =>
      PROVIDERS.map((_, i) => {
        const a = (i / PROVIDERS.length) * Math.PI * 2
        const r = 4.6 + (i % 2) * 0.8
        return new THREE.Vector3(Math.cos(a) * r, (i % 3) * 0.5 - 0.5, Math.sin(a) * r)
      }),
    [],
  )
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.12
  })
  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} flatShading />
        <Edges color="#fff" />
      </mesh>
      <Html center position={[0, -1.6, 0]} style={{ pointerEvents: 'none' }}>
        <div className="node-label active">your graph</div>
      </Html>
      {positions.map((p, i) => {
        const active = i === sel
        return (
          <group key={i} position={p}>
            <mesh
              onClick={(e) => {
                e.stopPropagation()
                onSel(i)
              }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = '')}
              scale={active ? 1.4 : 1}
            >
              <octahedronGeometry args={[0.32, 0]} />
              <meshStandardMaterial color={active ? '#fff' : '#151515'} emissive="#fff" emissiveIntensity={active ? 0.8 : 0.03} />
              <Edges color="#fff" />
            </mesh>
            <Html center position={[0, -0.6, 0]} style={{ pointerEvents: 'none' }}>
              <div className={`node-label ${active ? 'active' : ''}`} style={active ? undefined : { fontSize: 10, padding: '1px 6px', opacity: 0.8 }}>{PROVIDERS[i].name}</div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

export default function Models() {
  const [sel, setSel] = useState(0)
  const p = PROVIDERS[sel]
  return (
    <div className="page container">
      <SectionHead
        eyebrow="Models"
        title={
          <>
            The right model <span className="grad-text">for every node.</span>
          </>
        }
        sub="LangGraph is model-agnostic. Through LangChain integrations, any node can call any provider — and the best graphs mix several models. Click a provider to inspect it."
      />

      <div className="sim-layout">
        <div className="stage" style={{ height: 500 }}>
          <Canvas camera={{ position: [0, 8, 9], fov: 50 }} dpr={[1, 1.75]}>
            <Suspense fallback={null}>
              <SceneLights />
              <Stars radius={60} depth={40} count={900} factor={2.5} saturation={0} fade />
              <Float speed={1} floatIntensity={0.3} rotationIntensity={0.05}>
                <Orbiters sel={sel} onSel={setSel} />
              </Float>
              <OrbitControls enablePan={false} enableDamping minDistance={6} maxDistance={18} makeDefault />
            </Suspense>
          </Canvas>
          <div className="stage-hint">click a provider · drag to orbit</div>
        </div>
        <div className="card">
          <div className="eyebrow">Provider</div>
          <h2 style={{ fontSize: '2.4rem' }}>{p.name}</h2>
          <dl className="kv">
            <dt>Package</dt>
            <dd><code>{p.pkg}</code></dd>
            <dt>Init string</dt>
            <dd><code>{p.init}</code></dd>
            <dt>Families</dt>
            <dd>{p.families}</dd>
            <dt>Strengths</dt>
            <dd>{p.strengths}</dd>
            <dt>Notes</dt>
            <dd>{p.notes}</dd>
          </dl>
          <div className="pills" style={{ marginTop: 20 }}>
            {PROVIDERS.map((x, i) => (
              <button key={x.name} className={`pill ${i === sel ? 'active' : ''}`} onClick={() => setSel(i)} style={{ fontSize: '0.78rem', padding: '5px 11px' }}>
                {x.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="section" style={{ paddingBottom: 0 }}>
        <SectionHead eyebrow="Selection guide" title="Match the model to the job." sub="Every node in your graph has a role. Size the model to the role — that’s the single biggest lever on quality, latency and cost." />
        <div className="grid grid-4">
          {ROLES.map((r, i) => (
            <Reveal key={r.role} delay={i * 0.04}>
              <div className="card" style={{ height: '100%' }}>
                <div className="icon-badge"><Icon name={r.icon} size={20} /></div>
                <h3 style={{ fontSize: '1.05rem' }}>{r.role}</h3>
                <p className="dim" style={{ fontSize: '0.85rem', margin: '0 0 10px' }}>{r.need}</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{r.pick}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead eyebrow="In practice" title="Mixing models in one graph." />
        <CodeBlock
          title="multi_model_graph.py"
          code={{
            python: `from dataclasses import dataclass
from langchain.chat_models import init_chat_model
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.runtime import Runtime

router  = init_chat_model("anthropic:claude-haiku-4-5", temperature=0)   # fast + cheap
thinker = init_chat_model("anthropic:claude-sonnet-4-5")                 # strong reasoning
backup  = init_chat_model("openai:gpt-4.1")                               # different provider
worker  = thinker.with_fallbacks([backup])                               # survive outages

@dataclass
class Ctx:
    model_override: str | None = None        # A/B test models per request

class State(MessagesState):
    difficulty: str

def triage(state: State):
    label = router.invoke([("system", "Reply with exactly 'easy' or 'hard'.")] + state["messages"][-1:])
    return {"difficulty": label.content.strip().lower()}

def answer(state: State, runtime: Runtime[Ctx]):
    llm = init_chat_model(runtime.context.model_override) if runtime.context.model_override else (
        router if state["difficulty"] == "easy" else worker)
    return {"messages": [llm.invoke(state["messages"])]}

g = StateGraph(State, context_schema=Ctx)
g.add_node("triage", triage)
g.add_node("answer", answer)
g.add_edge(START, "triage"); g.add_edge("triage", "answer"); g.add_edge("answer", END)
app = g.compile()

app.invoke({"messages": [("user", "Prove there are infinitely many primes")]}, context={})`,
          }}
        />
        <div className="table-wrap" style={{ marginTop: 28 }}>
          <table className="nice">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Package</th>
                <th>Example init string</th>
                <th>Best at</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDERS.map((x) => (
                <tr key={x.name}>
                  <td><b>{x.name}</b></td>
                  <td className="mono muted" style={{ fontSize: '0.8rem' }}>{x.pkg}</td>
                  <td className="mono" style={{ fontSize: '0.8rem' }}>{x.init}</td>
                  <td className="muted">{x.strengths}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="warn" title="Model names change often">
          Providers release and retire model versions frequently. The strings above illustrate the <code>provider:model</code> format — always copy current model IDs from your provider’s documentation.
        </Callout>
        <Callout type="tip" title="Checklist for agent models">
          Reliable tool calling (including parallel calls) · structured output / JSON schema · enough context window for your history · streaming support · acceptable latency and price at your volume · data-handling terms that fit your use case.
        </Callout>
      </section>
    </div>
  )
}
