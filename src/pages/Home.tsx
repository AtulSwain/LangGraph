import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles, Stars } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { GraphScene, SceneLights, edgeKey } from '../components/Graph3D'
import Graph3D, { Legend } from '../components/Graph3D'
import { GRAPHS, heroConstellation } from '../data/graphs'
import Reveal, { GlowCard, SectionHead } from '../components/Reveal'
import CodeBlock from '../components/CodeBlock'
import { MODULES, CONCEPTS } from '../data/concepts'

function HeroScene() {
  const g = useMemo(heroConstellation, [])
  const group = useRef<THREE.Group>(null)
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % g.nodes.length), 650)
    return () => clearInterval(t)
  }, [g.nodes.length])
  useFrame((state, dt) => {
    if (!group.current) return
    group.current.rotation.y += dt * 0.08
    const { x, y } = state.pointer
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, y * 0.25, 0.04)
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 4.6 + x * 0.4, 0.04)
  })
  const active = `n${step}`
  const prev = `n${(step - 1 + g.nodes.length) % g.nodes.length}`
  return (
    <group ref={group} position={[4.6, 0, -2.5]} scale={0.82}>
      <GraphScene nodes={g.nodes} edges={g.edges} activeNodes={[active]} activeEdges={[edgeKey(prev, active)]} showLabels={false} particles={1} />
    </group>
  )
}

const FEATURES = [
  { icon: '🔁', title: 'Cycles & Control', text: 'Loops, branches and conditional routing — the shape real agents need, not just linear chains.', color: '#22d3ee' },
  { icon: '💾', title: 'Persistence', text: 'Checkpoint every super-step. Resume conversations, survive crashes, run for days.', color: '#2dd4bf' },
  { icon: '✋', title: 'Human-in-the-Loop', text: 'interrupt() anywhere to approve, edit or reject — then resume exactly where you paused.', color: '#f472b6' },
  { icon: '🌊', title: 'First-class Streaming', text: 'Stream tokens, state updates and custom events from any node to your UI.', color: '#fbbf24' },
  { icon: '🧠', title: 'Short & Long-term Memory', text: 'Thread-scoped history plus a cross-thread Store with semantic search.', color: '#a78bfa' },
  { icon: '👥', title: 'Multi-Agent Ready', text: 'Subgraphs, Command handoffs, supervisors and swarms for teams of agents.', color: '#60a5fa' },
]

const MARQUEE = ['StateGraph', 'Reducers', 'add_messages', 'Conditional edges', 'Command', 'Send', 'Subgraphs', 'Checkpointers', 'Threads', 'Store', 'interrupt()', 'Time travel', 'Streaming', 'Functional API', 'ToolNode', 'Supervisor', 'Swarm', 'LangGraph Studio', 'LangSmith', 'Durable execution']

const REACT_STEPS = [
  { nodes: ['__start__'], edges: [], text: 'User asks: “What’s the weather in Paris, and what is 6 × 7?” The message enters the graph at START.' },
  { nodes: ['agent'], edges: [edgeKey('__start__', 'agent')], text: 'The agent node calls the LLM. It decides it needs tools and emits two tool calls.' },
  { nodes: ['tools'], edges: [edgeKey('agent', 'tools')], text: 'A conditional edge sees tool_calls → routes to the tools node, which runs get_weather and multiply in parallel.' },
  { nodes: ['agent'], edges: [edgeKey('tools', 'agent')], text: 'Tool results (ToolMessages) flow back into state. The agent reads them and writes the final answer.' },
  { nodes: ['__end__'], edges: [edgeKey('agent', '__end__')], text: 'No more tool calls → route to END. Every step was checkpointed, so you could replay or fork it.' },
]

export default function Home() {
  const [rs, setRs] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setRs((s) => (s + 1) % REACT_STEPS.length), 3200)
    return () => clearInterval(t)
  }, [])
  const step = REACT_STEPS[rs]

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="hero">
        <div className="hero-canvas">
          <Canvas camera={{ position: [0, 0, 12], fov: 50 }} dpr={[1, 1.75]}>
            <Suspense fallback={null}>
              <SceneLights />
              <Stars radius={80} depth={60} count={3000} factor={4} saturation={0} fade speed={0.8} />
              <Sparkles count={120} scale={[20, 12, 10]} size={2.2} speed={0.4} color="#a78bfa" />
              <HeroScene />
            </Suspense>
          </Canvas>
        </div>
        <div className="hero-fade" />
        <div className="hero-scrim" />
        <div className="container hero-content">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <div className="eyebrow">● Interactive 3D study guide</div>
            <h1>
              Build agents that
              <br />
              <span className="grad-text">think in graphs.</span>
            </h1>
            <p className="lead">
              Master <b>LangGraph</b> — the framework for stateful, controllable AI agents — together with <b>LangChain</b> and <b>LangSmith</b>.
              Explore every concept in 3D, run live simulations, and test yourself.
            </p>
            <div className="hero-cta">
              <Link to="/learn" className="btn btn-primary">Start the study guide →</Link>
              <Link to="/playground" className="btn">▶ Open the playground</Link>
            </div>
            <div className="stat-row">
              <div className="stat"><b className="grad-text">{CONCEPTS.length}</b><span>in-depth lessons</span></div>
              <div className="stat"><b className="grad-text">12</b><span>agent patterns in 3D</span></div>
              <div className="stat"><b className="grad-text">22</b><span>quiz questions</span></div>
              <div className="stat"><b className="grad-text">Py + TS</b><span>code examples</span></div>
            </div>
          </motion.div>
        </div>
        <div className="hero-hint">↓ SCROLL TO EXPLORE · MOVE YOUR MOUSE</div>
      </section>

      {/* ───────── MARQUEE ───────── */}
      <div className="marquee" style={{ padding: '10px 0 30px' }}>
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className={`tag ${['cyan', 'violet', 'pink', 'amber', 'green'][i % 5]}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* ───────── WHAT IS ───────── */}
      <section className="section container">
        <div className="grid grid-2" style={{ alignItems: 'center', gap: 48 }}>
          <div>
            <SectionHead
              eyebrow="01 · The big idea"
              title={<>Your agent is a <span className="grad-text">graph</span>.</>}
              sub="LangGraph models an AI application as a state machine: a shared State flows through Nodes (functions), and Edges decide what happens next — including loops back to earlier steps."
            />
            <Reveal delay={0.1}>
              <div className="grid" style={{ gap: 12 }}>
                {[
                  ['🧠 State', 'The shared memory of a run — a typed dict every node reads and updates.'],
                  ['⚙️ Nodes', 'Python/TS functions: call an LLM, run a tool, transform data.'],
                  ['➡️ Edges', 'Fixed or conditional transitions. Cycles = agent loops.'],
                ].map(([t, d]) => (
                  <div key={t} className="card" style={{ padding: 16 }}>
                    <b>{t}</b> <span className="muted">— {d}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <CodeBlock
              title="agent.py"
              code={{
                python: `from langgraph.graph import StateGraph, MessagesState, START
from langgraph.prebuilt import ToolNode, tools_condition

builder = StateGraph(MessagesState)
builder.add_node("agent", call_llm_with_tools)
builder.add_node("tools", ToolNode(tools))

builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", tools_condition)
builder.add_edge("tools", "agent")   # ← the loop

graph = builder.compile(checkpointer=InMemorySaver())`,
                js: `import { StateGraph, MessagesAnnotation, START } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callLlmWithTools)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "agent")
  .addConditionalEdges("agent", toolsCondition)
  .addEdge("tools", "agent") // ← the loop
  .compile({ checkpointer: new MemorySaver() });`,
              }}
            />
          </Reveal>
        </div>
      </section>

      {/* ───────── LIVE REACT LOOP ───────── */}
      <section className="section container">
        <SectionHead
          center
          eyebrow="02 · Watch it run"
          title={<>The agent loop, <span className="grad-text">live in 3D</span></>}
          sub="This is the classic ReAct agent. Watch the state travel through the graph — each glowing hop is one super-step."
        />
        <Reveal>
          <Graph3D {...GRAPHS.react} height={480} activeNodes={step.nodes} activeEdges={step.edges} particles={3} autoRotate={false}>
            <div className="stage-hud">
              <Legend kinds={['start', 'llm', 'tool', 'end']} />
              <span className="tag cyan mono">super-step {rs}</span>
            </div>
          </Graph3D>
          <motion.div key={rs} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span className="road-dot" style={{ width: 40, height: 40, fontSize: '0.9rem' }}>{rs + 1}</span>
            <span>{step.text}</span>
          </motion.div>
        </Reveal>
      </section>

      {/* ───────── FEATURES ───────── */}
      <section className="section container">
        <SectionHead eyebrow="03 · Why LangGraph" title={<>Infrastructure for agents that <span className="grad-text">actually ship</span></>} sub="Prompts are the easy part. Reliability, control, memory and recovery are what take agents to production — LangGraph makes them primitives." />
        <div className="grid grid-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <GlowCard style={{ height: '100%' }}>
                <div className="icon-badge" style={{ boxShadow: `0 0 24px ${f.color}33`, borderColor: `${f.color}55` }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>{f.text}</p>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── CHAIN VS GRAPH ───────── */}
      <section className="section container">
        <SectionHead eyebrow="04 · Chains vs graphs" title="When a straight line isn’t enough" />
        <div className="grid grid-2">
          <Reveal>
            <div className="card" style={{ height: '100%' }}>
              <span className="tag">Chain (DAG)</span>
              <h3 style={{ marginTop: 12 }}>prompt → LLM → parser</h3>
              <div className="mono muted" style={{ fontSize: '1.1rem', margin: '18px 0' }}>
                ● ──▶ ● ──▶ ● ──▶ ●
              </div>
              <ul className="muted">
                <li>Fixed sequence, runs once</li>
                <li>Great for RAG, extraction, summarization</li>
                <li>No memory of where it was if interrupted</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card" style={{ height: '100%', borderColor: 'rgba(167,139,250,0.4)' }}>
              <span className="tag violet">Graph (with cycles)</span>
              <h3 style={{ marginTop: 12 }}>reason ⇄ act ⇄ observe</h3>
              <div className="mono" style={{ fontSize: '1.1rem', margin: '18px 0', color: 'var(--violet)' }}>
                ● ──▶ ● ⇄ ● ──▶ ◆ ──▶ ●
              </div>
              <ul className="muted">
                <li>Loops until the job is done, branches on decisions</li>
                <li>Checkpointed state: pause, resume, rewind</li>
                <li>Humans and multiple agents can join the flow</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── ROADMAP ───────── */}
      <section className="section container">
        <div className="grid grid-2" style={{ gap: 48 }}>
          <SectionHead
            eyebrow="05 · Learning path"
            title={<>From zero to <span className="grad-text">multi-agent</span></>}
            sub="Seven modules, each with explanations, analogies, runnable code in Python and TypeScript, 3D diagrams and key takeaways. Your progress is saved in your browser."
          />
          <div className="roadmap">
            {MODULES.map((m, i) => {
              const lessons = CONCEPTS.filter((c) => c.module === m.id)
              return (
                <Reveal key={m.id} delay={i * 0.05}>
                  <Link to={`/learn/${lessons[0].id}`} className="road-step" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <div className="road-dot" style={{ borderColor: m.color, boxShadow: `0 0 20px ${m.color}55` }}>{i + 1}</div>
                    <div className="card hoverable" style={{ flex: 1, padding: '14px 18px' }}>
                      <b>{m.title}</b>
                      <div className="dim" style={{ fontSize: '0.85rem' }}>{lessons.map((l) => l.title).join(' · ')}</div>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────── EXPLORE ───────── */}
      <section className="section container">
        <SectionHead center eyebrow="06 · Explore" title="Pick your adventure" />
        <div className="grid grid-3">
          {[
            { to: '/architecture', icon: '🏗️', t: 'Architecture in 3D', d: 'Fly through the LangChain ecosystem stack and watch the Pregel runtime execute super-steps.' },
            { to: '/patterns', icon: '🧬', t: '12 Agent Patterns', d: 'ReAct, Plan-and-Execute, Reflection, Supervisor, Swarm, Agentic RAG… each as an animated 3D graph.' },
            { to: '/playground', icon: '🎮', t: 'Playground', d: 'Step through simulated runs, approve interrupts, time-travel checkpoints, and build your own graph.' },
            { to: '/langchain', icon: '🦜', t: 'LangChain & Family', d: 'How LangChain, LangGraph, LangSmith and the Platform fit together — and which to use when.' },
            { to: '/quiz', icon: '🏆', t: 'Certification Quiz', d: 'Twenty-two questions with explanations. Can you reach “Graph Architect” rank?' },
            { to: '/glossary', icon: '📖', t: 'Cheatsheet & Glossary', d: 'Every term and API at a glance, searchable, with copy-ready snippets.' },
          ].map((c, i) => (
            <Reveal key={c.to} delay={i * 0.05}>
              <Link to={c.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                <GlowCard style={{ height: '100%' }}>
                  <div className="icon-badge">{c.icon}</div>
                  <h3>{c.t}</h3>
                  <p className="muted" style={{ marginBottom: 12 }}>{c.d}</p>
                  <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Open →</span>
                </GlowCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="section container" style={{ maxWidth: 860 }}>
        <SectionHead center eyebrow="07 · FAQ" title="Quick answers" />
        {[
          ['Do I need LangChain to use LangGraph?', 'No. LangGraph is standalone — nodes can call any SDK. LangChain is convenient for model/tool integrations, and LangChain v1 agents are themselves built on LangGraph.'],
          ['Is LangGraph only for Python?', 'No. There is a first-class JavaScript/TypeScript library, @langchain/langgraph, with the same concepts (Annotation instead of TypedDict, camelCase methods).'],
          ['Is it free / open source?', 'Yes, the LangGraph library is MIT-licensed. The hosted deployment platform and LangSmith are commercial products with free tiers.'],
          ['When should I NOT use LangGraph?', 'If your app is a single LLM call or a simple linear pipeline, a plain function or LangChain chain is enough. Reach for LangGraph when you need loops, branching, persistence, HITL or multiple agents.'],
          ['How is it different from CrewAI / AutoGen?', 'Those are higher-level, opinionated multi-agent frameworks. LangGraph is lower-level: you control the exact flow and state, which trades a little boilerplate for a lot of control and reliability.'],
        ].map(([q, a]) => (
          <details key={q} className="faq">
            <summary>{q}</summary>
            <p className="muted">{a}</p>
          </details>
        ))}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/learn" className="btn btn-primary">Begin lesson 1 →</Link>
        </div>
      </section>
    </>
  )
}
