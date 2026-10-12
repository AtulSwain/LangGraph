import { useFrame } from '@react-three/fiber'
import { Sparkles, Stars } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import SmartCanvas from '../components/SmartCanvas'
import { GraphScene, SceneLights, edgeKey } from '../components/Graph3D'
import Graph3D, { Legend } from '../components/Graph3D'
import { GRAPHS, heroConstellation } from '../data/graphs'
import Reveal, { GlowCard, SectionHead } from '../components/Reveal'
import CodeBlock from '../components/CodeBlock'
import Icon from '../components/Icon'
import { MODULES, CONCEPTS } from '../data/concepts'
import { PATTERNS } from '../data/patterns'
import { PROJECTS } from '../data/projects'
import { QUIZ } from '../data/quiz'
import { GLOSSARY } from '../data/glossary'
import { TIMELINE } from '../data/knowledge'

function HeroScene() {
  const g = useMemo(heroConstellation, [])
  const group = useRef<THREE.Group>(null)
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % g.nodes.length), 700)
    return () => clearInterval(t)
  }, [g.nodes.length])
  useFrame((state, dt) => {
    if (!group.current) return
    group.current.rotation.y += dt * 0.07
    const { x, y } = state.pointer
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, y * 0.25, 0.04)
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 5.8 + x * 0.4, 0.04)
  })
  const active = `n${step}`
  const prev = `n${(step - 1 + g.nodes.length) % g.nodes.length}`
  return (
    <group ref={group} position={[5.8, 0, -3.5]} scale={0.78}>
      <GraphScene nodes={g.nodes} edges={g.edges} activeNodes={[active]} activeEdges={[edgeKey(prev, active)]} showLabels={false} particles={1} />
    </group>
  )
}

const FEATURES = [
  { icon: 'Repeat', title: 'Cycles & control', text: 'Loops, branches, parallel fan-out and conditional routing — the real shape of agents, not a straight line.' },
  { icon: 'Save', title: 'Durable persistence', text: 'A checkpoint after every super-step. Resume conversations, survive crashes, run for days.' },
  { icon: 'Hand', title: 'Human-in-the-loop', text: 'interrupt() anywhere to approve, edit or reject — then resume exactly where you paused.' },
  { icon: 'Waves', title: 'First-class streaming', text: 'Tokens, state updates and custom progress events from any node, straight to your UI.' },
  { icon: 'Brain', title: 'Short & long-term memory', text: 'Thread-scoped history plus a cross-thread Store with semantic search.' },
  { icon: 'Users', title: 'Multi-agent systems', text: 'Subgraphs, Command handoffs, supervisors, swarms and deep agents.' },
]

const MARQUEE = ['StateGraph', 'Reducers', 'add_messages', 'Conditional edges', 'Command', 'Send', 'Subgraphs', 'Checkpointers', 'Threads', 'Store', 'interrupt()', 'Time travel', 'Streaming', 'Functional API', 'Middleware', 'Deep Agents', 'MCP', 'useStream', 'LangSmith', 'Durable execution']

const REACT_STEPS = [
  { nodes: ['__start__'], edges: [], text: 'User asks: “What’s the weather in Paris, and what is 6 × 7?” The message enters the graph at START.' },
  { nodes: ['agent'], edges: [edgeKey('__start__', 'agent')], text: 'The agent node calls the LLM. It decides it needs tools and emits two tool calls.' },
  { nodes: ['tools'], edges: [edgeKey('agent', 'tools')], text: 'A conditional edge sees tool_calls and routes to the tools node, which runs get_weather and multiply in parallel.' },
  { nodes: ['agent'], edges: [edgeKey('tools', 'agent')], text: 'Tool results flow back into state as ToolMessages. The agent reads them and writes the final answer.' },
  { nodes: ['__end__'], edges: [edgeKey('agent', '__end__')], text: 'No more tool calls, so the flow routes to END. Every step was checkpointed — you could replay or fork it.' },
]

const EXPLORE = [
  { to: '/architecture', icon: 'Box', t: 'Architecture in 3D', d: 'Fly through the ecosystem stack and watch the Pregel runtime execute super-steps.' },
  { to: '/patterns', icon: 'Network', t: 'Agent patterns', d: 'ReAct, plan-and-execute, reflection, supervisor, swarm, agentic RAG — each animated.' },
  { to: '/playground', icon: 'Gamepad2', t: 'Playground', d: 'Step through runs, approve interrupts, time-travel, and design your own graph.' },
  { to: '/projects', icon: 'Hammer', t: 'Complete projects', d: 'Support router, research assistant, SQL analyst, docs chatbot, email assistant, content team.' },
  { to: '/models', icon: 'Cpu', t: 'Models & providers', d: 'Twelve providers and how to choose a model for each node in your graph.' },
  { to: '/compare', icon: 'Scale', t: 'Compare frameworks', d: 'LangGraph vs CrewAI, AutoGen, OpenAI Agents SDK, LlamaIndex, Pydantic AI, ADK and Mastra.' },
  { to: '/interview', icon: 'CircleHelp', t: 'Interview prep', d: 'Thirty questions with crisp model answers, from basics to production.' },
  { to: '/quiz', icon: 'Trophy', t: 'Certification quiz', d: 'Questions with explanations. Reach “Graph Architect”.' },
  { to: '/resources', icon: 'Library', t: 'Resources & news', d: 'Official docs, repos, courses, and a timeline of what’s new.' },
]

const FAQ = [
  ['Do I need LangChain to use LangGraph?', 'No. LangGraph is standalone — nodes can call any SDK. LangChain is convenient for model/tool integrations, and LangChain v1 agents (create_agent) are themselves built on LangGraph.'],
  ['Is LangGraph only for Python?', 'No. There is a first-class JavaScript/TypeScript library, @langchain/langgraph, with the same concepts (Annotation or Zod instead of TypedDict, camelCase methods).'],
  ['Is it free / open source?', 'Yes, the LangGraph library is MIT-licensed. LangSmith (observability, evaluation, deployment) is a commercial product with a free tier.'],
  ['What is the difference between LangGraph Platform and LangSmith Deployment?', 'Same thing — LangGraph Platform was renamed LangSmith Deployment in October 2025, and LangGraph Studio became LangSmith Studio. APIs kept working.'],
  ['When should I NOT use LangGraph?', 'If your app is a single LLM call or a simple linear pipeline, a plain function or LangChain chain is enough. Reach for LangGraph when you need loops, branching, persistence, HITL or multiple agents.'],
  ['How is it different from CrewAI or AutoGen?', 'Those are higher-level, opinionated multi-agent frameworks. LangGraph is lower-level: you control the exact flow and state, trading a little boilerplate for control and reliability. See the Compare page for details.'],
]

export default function Home() {
  const [rs, setRs] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setRs((s) => (s + 1) % REACT_STEPS.length), 3200)
    return () => clearInterval(t)
  }, [])
  const step = REACT_STEPS[rs]

  const stats: [number, string][] = [
    [CONCEPTS.length, 'lessons'],
    [PATTERNS.length, 'agent patterns'],
    [PROJECTS.length, 'full projects'],
    [QUIZ.length, 'quiz questions'],
    [GLOSSARY.length, 'glossary terms'],
  ]

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="hero">
        <SmartCanvas className="hero-canvas" camera={{ position: [0, 0, 12], fov: 50 }}>
            <>
              <SceneLights />
              <Stars radius={80} depth={60} count={2200} factor={3} saturation={0} fade speed={0.5} />
              <Sparkles count={70} scale={[20, 12, 10]} size={1.6} speed={0.3} color="#ffffff" opacity={0.6} />
              <HeroScene />
            </>
        </SmartCanvas>
        <div className="hero-fade" />
        <div className="hero-scrim" />
        <div className="container hero-content">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
            <div className="eyebrow">The complete LangGraph guide · Updated for 1.x</div>
            <h1>
              Build agents
              <br />
              that <span className="grad-text">think in graphs.</span>
            </h1>
            <p className="lead">
              Everything about <b>LangGraph</b>, <b>LangChain</b> and <b>LangSmith</b> in one place — concepts, architecture, patterns, real projects and the newest features. Explored in 3D, simulated live,
              and tested with a quiz.
            </p>
            <div className="hero-cta">
              <Link to="/learn" className="btn btn-primary">
                Start learning <Icon name="ArrowRight" size={16} />
              </Link>
              <Link to="/projects" className="btn">
                Build a project
              </Link>
            </div>
            <div className="stat-row">
              {stats.map(([n, l]) => (
                <div key={l} className="stat">
                  <b>{n}</b>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="hero-hint">SCROLL</div>
      </section>

      {/* ───────── MARQUEE ───────── */}
      <div className="marquee band">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="marquee-item">
              {m} <span className="dim">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ───────── WHAT IS ───────── */}
      <section className="section container">
        <div className="grid grid-2" style={{ alignItems: 'center', gap: 56 }}>
          <div>
            <SectionHead
              eyebrow="01 — The big idea"
              title={
                <>
                  Your agent is a <span className="grad-text">graph.</span>
                </>
              }
              sub="LangGraph models an AI application as a state machine: a shared State flows through Nodes (functions), and Edges decide what happens next — including loops back to earlier steps."
            />
            <Reveal delay={0.1}>
              <div className="def-list">
                {[
                  ['State', 'The shared memory of a run — a typed object every node reads and updates.'],
                  ['Nodes', 'Plain functions: call an LLM, run a tool, transform data.'],
                  ['Edges', 'Fixed or conditional transitions. A cycle is an agent loop.'],
                ].map(([t, d], i) => (
                  <div key={t} className="def-row">
                    <span className="mono dim">0{i + 1}</span>
                    <b>{t}</b>
                    <span className="muted">{d}</span>
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
from langgraph.checkpoint.memory import InMemorySaver

builder = StateGraph(MessagesState)
builder.add_node("agent", call_llm_with_tools)
builder.add_node("tools", ToolNode(tools))

builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", tools_condition)
builder.add_edge("tools", "agent")   # ← the loop

graph = builder.compile(checkpointer=InMemorySaver())`,
                js: `import { StateGraph, MessagesAnnotation, START, MemorySaver } from "@langchain/langgraph";
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
          eyebrow="02 — Watch it run"
          title={
            <>
              The agent loop, <span className="grad-text">in three dimensions.</span>
            </>
          }
          sub="The classic ReAct agent. Each glowing hop is one super-step of the runtime."
        />
        <Reveal>
          <Graph3D {...GRAPHS.react} height={480} activeNodes={step.nodes} activeEdges={step.edges} particles={3}>
            <div className="stage-hud">
              <Legend kinds={['start', 'llm', 'tool', 'end']} />
              <span className="tag mono">super-step {rs}</span>
            </div>
          </Graph3D>
          <motion.div key={rs} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card step-caption">
            <span className="serif step-num">{String(rs + 1).padStart(2, '0')}</span>
            <span>{step.text}</span>
          </motion.div>
        </Reveal>
      </section>

      {/* ───────── FEATURES ───────── */}
      <section className="section container">
        <SectionHead
          eyebrow="03 — Why LangGraph"
          title={
            <>
              Infrastructure for agents <span className="grad-text">that ship.</span>
            </>
          }
          sub="Prompts are the easy part. Reliability, control, memory and recovery take agents to production — LangGraph makes them primitives. It powers agents at companies like Klarna, LinkedIn and Uber."
        />
        <div className="grid grid-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <GlowCard style={{ height: '100%' }}>
                <div className="icon-badge">
                  <Icon name={f.icon} size={20} />
                </div>
                <h3>{f.title}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {f.text}
                </p>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── CHAIN VS GRAPH ───────── */}
      <section className="section container">
        <SectionHead eyebrow="04 — Chains vs graphs" title="When a straight line isn’t enough." />
        <div className="grid grid-2">
          <Reveal>
            <div className="card" style={{ height: '100%' }}>
              <span className="tag">Chain · DAG</span>
              <h3 style={{ marginTop: 14 }}>prompt → LLM → parser</h3>
              <div className="mono muted" style={{ fontSize: '1.1rem', margin: '18px 0', letterSpacing: '0.1em' }}>
                ○ ─── ○ ─── ○ ─── ○
              </div>
              <ul className="muted clean-list">
                <li>Fixed sequence, runs once</li>
                <li>Great for RAG, extraction, summarization</li>
                <li>No memory of where it was if interrupted</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card inverse" style={{ height: '100%' }}>
              <span className="tag">Graph · with cycles</span>
              <h3 style={{ marginTop: 14 }}>reason ⇄ act ⇄ observe</h3>
              <div className="mono" style={{ fontSize: '1.1rem', margin: '18px 0', letterSpacing: '0.1em' }}>
                ● ─── ● ⇄ ● ─── ◆ ─── ●
              </div>
              <ul className="clean-list">
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
        <div className="grid grid-2" style={{ gap: 56 }}>
          <div className="sticky-col">
            <SectionHead
              eyebrow="05 — Curriculum"
              title={
                <>
                  From zero to <span className="grad-text">multi-agent.</span>
                </>
              }
              sub={`${MODULES.length} modules and ${CONCEPTS.length} lessons. Each has an explanation, an analogy, Python and TypeScript code, pitfalls and takeaways — many with a 3D diagram. Progress is saved in your browser.`}
            />
            <Link to="/learn" className="btn btn-primary">
              Open the study guide <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
          <div className="roadmap">
            {MODULES.map((m, i) => {
              const lessons = CONCEPTS.filter((c) => c.module === m.id)
              return (
                <Reveal key={m.id} delay={i * 0.04}>
                  <Link to={`/learn/${lessons[0].id}`} className="road-step" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <div className="road-dot">{i + 1}</div>
                    <div className="card hoverable" style={{ flex: 1, padding: '14px 18px' }}>
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <b>{m.title}</b>
                        <span className="mono dim" style={{ fontSize: '0.75rem' }}>
                          {lessons.length} lessons
                        </span>
                      </div>
                      <div className="dim" style={{ fontSize: '0.85rem' }}>
                        {lessons.map((l) => l.title).join(' · ')}
                      </div>
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
        <SectionHead center eyebrow="06 — Explore" title="Pick your path." />
        <div className="grid grid-3">
          {EXPLORE.map((c, i) => (
            <Reveal key={c.to} delay={i * 0.04}>
              <Link to={c.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                <GlowCard style={{ height: '100%' }}>
                  <div className="icon-badge">
                    <Icon name={c.icon} size={20} />
                  </div>
                  <h3>{c.t}</h3>
                  <p className="muted" style={{ marginBottom: 14 }}>
                    {c.d}
                  </p>
                  <span className="link-arrow">
                    Open <Icon name="ArrowRight" size={14} />
                  </span>
                </GlowCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── WHAT'S NEW ───────── */}
      <section className="section container">
        <SectionHead eyebrow="07 — What’s new" title="The latest in the ecosystem." />
        <div className="grid grid-3">
          {TIMELINE.slice(-3).map((t) => (
            <Reveal key={t.date}>
              <div className="card" style={{ height: '100%' }}>
                <div className="mono dim" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                  {t.date.toUpperCase()}
                </div>
                <h3 style={{ marginTop: 8 }}>{t.title}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {t.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <Link to="/learn/whats-new" className="link-arrow">
            Read: versions, migration & what’s new <Icon name="ArrowRight" size={14} />
          </Link>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="section container" style={{ maxWidth: 860 }}>
        <SectionHead center eyebrow="08 — FAQ" title="Quick answers." />
        {FAQ.map(([q, a]) => (
          <details key={q} className="faq">
            <summary>{q}</summary>
            <p className="muted">{a}</p>
          </details>
        ))}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/learn" className="btn btn-primary">
            Begin lesson one <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
      </section>
    </>
  )
}
