import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Graph3D, { Legend, autoLayout, edgeKey, KIND_LABELS, type GEdge, type GNode, type NodeKind } from '../components/Graph3D'
import { GRAPHS } from '../data/graphs'
import CodeBlock from '../components/CodeBlock'
import Icon from '../components/Icon'
import Callout from '../components/Callout'
import { SectionHead } from '../components/Reveal'

// ───────────────────────── Simulator model ─────────────────────────
type Dict = Record<string, unknown>
interface Step {
  node: string
  nodes?: string[]
  edges: string[]
  update: Dict
  log: string
  interrupt?: Dict
}
interface Scenario {
  id: string
  name: string
  icon: string
  graph: string
  desc: string
  appendKeys: string[]
  initial: Dict
  steps: Step[]
  resume?: (choice: 'approve' | 'reject', n: number) => Step[]
  code: string
}

const msg = (type: string, content: string, extra: Dict = {}) => ({ type, content, ...extra })

const SCENARIOS: Scenario[] = [
  {
    id: 'react',
    name: 'ReAct agent with tools',
    icon: 'Bot',
    graph: 'react',
    desc: 'A tool-calling agent answers a two-part question. Watch messages accumulate via the add_messages reducer.',
    appendKeys: ['messages'],
    initial: { messages: [] },
    steps: [
      { node: '__start__', edges: [], update: { messages: [msg('human', 'Weather in Paris, and what is 6 × 7?')] }, log: 'invoke() → input written to state' },
      {
        node: 'agent',
        edges: [edgeKey('__start__', 'agent')],
        update: { messages: [msg('ai', '', { tool_calls: [{ name: 'get_weather', args: { city: 'Paris' } }, { name: 'multiply', args: { a: 6, b: 7 } }] })] },
        log: 'agent: LLM requests 2 tool calls',
      },
      {
        node: 'tools',
        edges: [edgeKey('agent', 'tools')],
        update: { messages: [msg('tool', 'Sunny, 21°C', { name: 'get_weather' }), msg('tool', '42', { name: 'multiply' })] },
        log: 'tools_condition → "tools"; ToolNode runs both calls in parallel',
      },
      { node: 'agent', edges: [edgeKey('tools', 'agent')], update: { messages: [msg('ai', 'Paris is sunny at 21°C, and 6 × 7 = 42.')] }, log: 'agent: reads tool results, writes final answer' },
      { node: '__end__', edges: [edgeKey('agent', '__end__')], update: {}, log: 'tools_condition → END (no tool calls). Run complete.' },
    ],
    code: `graph = builder.compile(checkpointer=InMemorySaver())
config = {"configurable": {"thread_id": "demo"}}
for update in graph.stream(
    {"messages": [("user", "Weather in Paris, and what is 6 x 7?")]},
    config, stream_mode="updates"):
    print(update)`,
  },
  {
    id: 'hitl',
    name: 'Refund with human approval',
    icon: 'Hand',
    graph: 'hitl',
    desc: 'The agent drafts a refund, then interrupt() pauses for you. Approve or reject — rejections loop back for a revised draft.',
    appendKeys: ['audit'],
    initial: { request: null, draft: null, decision: null, result: null, audit: [] },
    steps: [
      { node: '__start__', edges: [], update: { request: 'Refund $250 for order #981', audit: ['request received'] }, log: 'invoke() with the customer request' },
      { node: 'draft', edges: [edgeKey('__start__', 'draft')], update: { draft: { tool: 'refund', order: 981, amount: 250 }, audit: ['draft v1'] }, log: 'draft_action: LLM proposes a refund' },
      {
        node: 'approval',
        edges: [edgeKey('draft', 'approval')],
        update: {},
        interrupt: { question: 'Approve this refund?', action: { tool: 'refund', order: 981, amount: 250 } },
        log: '⏸ interrupt() — checkpoint saved, waiting for a human',
      },
    ],
    resume: (choice, n) => {
      if (choice === 'approve')
        return [
          { node: 'execute', edges: [edgeKey('approval', 'execute')], update: { decision: 'approved', result: 'Refund issued ✓', audit: ['approved by human'] }, log: 'Command(resume="approve") → execute' },
          { node: '__end__', edges: [edgeKey('execute', '__end__')], update: {}, log: 'Run complete.' },
        ]
      const amount = Math.max(50, 250 - 50 * (n + 1))
      return [
        { node: 'revise', edges: [edgeKey('approval', 'revise')], update: { decision: 'rejected', audit: [`rejected (#${n + 1})`] }, log: 'Command(resume="reject") → revise with feedback' },
        { node: 'draft', edges: [edgeKey('revise', 'draft')], update: { draft: { tool: 'refund', order: 981, amount }, audit: [`draft v${n + 2}`] }, log: `draft_action: new proposal $${amount}` },
        {
          node: 'approval',
          edges: [edgeKey('draft', 'approval')],
          update: { decision: null },
          interrupt: { question: 'Approve this refund?', action: { tool: 'refund', order: 981, amount } },
          log: '⏸ interrupt() again',
        },
      ]
    },
    code: `def human_approval(state) -> Command[Literal["execute", "revise"]]:
    decision = interrupt({"question": "Approve this refund?", "action": state["draft"]})
    return Command(goto="execute" if decision == "approve" else "revise")

graph.invoke({"request": "Refund $250 for order #981"}, config)   # pauses
graph.invoke(Command(resume="approve"), config)                    # continues`,
  },
  {
    id: 'mapreduce',
    name: 'Map-reduce with Send',
    icon: 'Puzzle',
    graph: 'mapReduce',
    desc: 'The planner creates three subjects; Send() spawns three workers in ONE super-step; operator.add merges their jokes.',
    appendKeys: ['jokes'],
    initial: { topic: null, subjects: [], jokes: [], best: null },
    steps: [
      { node: '__start__', edges: [], update: { topic: 'animals' }, log: 'invoke({"topic": "animals"})' },
      { node: 'plan', edges: [edgeKey('__start__', 'plan')], update: { subjects: ['cats', 'owls', 'octopi'] }, log: 'plan_subjects: LLM proposes 3 subjects' },
      {
        node: 'w2',
        nodes: ['w1', 'w2', 'w3'],
        edges: [edgeKey('plan', 'w1'), edgeKey('plan', 'w2'), edgeKey('plan', 'w3')],
        update: { jokes: ['Cats: purr-fect timing', 'Owls: who-dunnit?', 'Octopi: eight-armed and dangerous'] },
        log: '[Send("worker", {"subject": s}) for s in subjects] → 3 parallel tasks',
      },
      { node: 'reduce', edges: [edgeKey('w1', 'reduce'), edgeKey('w2', 'reduce'), edgeKey('w3', 'reduce')], update: { best: 'Octopi: eight-armed and dangerous' }, log: 'reduce: picks the best joke' },
      { node: '__end__', edges: [edgeKey('reduce', '__end__')], update: {}, log: 'Run complete.' },
    ],
    code: `def continue_to_jokes(state):
    return [Send("worker", {"subject": s}) for s in state["subjects"]]

builder.add_conditional_edges("plan", continue_to_jokes, ["worker"])`,
  },
]

interface HistItem {
  step: Step
  pendingAfter: Step[]
  interrupts: number
}

function Simulator() {
  const [sid, setSid] = useState(SCENARIOS[0].id)
  const sc = SCENARIOS.find((s) => s.id === sid)!
  const g = GRAPHS[sc.graph]
  const init = (): HistItem[] => [{ step: sc.steps[0], pendingAfter: sc.steps.slice(1), interrupts: sc.steps[0].interrupt ? 1 : 0 }]
  const [hist, setHist] = useState<HistItem[]>(init)
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setHist(init())
    setCursor(0)
    setPlaying(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid])

  const cur = hist[cursor]
  const atHead = cursor === hist.length - 1
  const waiting = atHead && !!cur.step.interrupt && cur.pendingAfter.length === 0
  const finished = atHead && cur.step.node === '__end__'

  const state = useMemo(() => {
    const s: Dict = JSON.parse(JSON.stringify(sc.initial))
    hist.slice(0, cursor + 1).forEach(({ step }) => {
      Object.entries(step.update).forEach(([k, v]) => {
        s[k] = sc.appendKeys.includes(k) ? [...((s[k] as unknown[]) ?? []), ...(v as unknown[])] : v
      })
    })
    return s
  }, [hist, cursor, sc])

  const next = () => {
    if (!atHead) {
      setCursor((c) => c + 1)
      return
    }
    if (waiting || finished) return
    const [nx, ...rest] = cur.pendingAfter
    if (!nx) return
    setHist((h) => [...h, { step: nx, pendingAfter: rest, interrupts: cur.interrupts + (nx.interrupt ? 1 : 0) }])
    setCursor((c) => c + 1)
  }

  useEffect(() => {
    if (!playing) return
    if (waiting || finished) {
      setPlaying(false)
      return
    }
    const t = setTimeout(next, 1300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, cursor, hist, waiting, finished])

  const resume = (choice: 'approve' | 'reject') => {
    if (!sc.resume) return
    const steps = sc.resume(choice, cur.interrupts - 1)
    setHist((h) => [...h.slice(0, -1), { ...cur, pendingAfter: steps }])
    setPlaying(true)
  }

  const fork = () => {
    // forking at an interrupt lets you answer it differently
    setHist((h) => h.slice(0, cursor + 1).map((it, k) => (k === cursor && it.step.interrupt ? { ...it, pendingAfter: [] } : it)))
    setPlaying(false)
  }

  const reset = () => {
    setHist(init())
    setCursor(0)
    setPlaying(false)
  }

  const activeNodes = cur.step.nodes ?? [cur.step.node]
  const kinds = Array.from(new Set(g.nodes.map((n) => n.kind ?? 'default'))) as NodeKind[]

  return (
    <>
      <div className="pills" style={{ marginBottom: 18 }}>
        {SCENARIOS.map((s) => (
          <button key={s.id} className={`pill ${s.id === sid ? 'active' : ''}`} onClick={() => setSid(s.id)}>
            <Icon name={s.icon} size={15} /> {s.name}
          </button>
        ))}
      </div>
      <p className="muted">{sc.desc}</p>

      <div className="sim-layout">
        <div>
          <Graph3D {...g} height={440} activeNodes={activeNodes} activeEdges={cur.step.edges} camera={g.camera ?? [0, 0, 12]} particles={2}>
            <div className="stage-hud">
              <Legend kinds={kinds} />
              <span className="tag cyan mono">checkpoint {cursor}{!atHead ? ' · replay' : ''}</span>
            </div>
          </Graph3D>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="row" style={{ marginBottom: 14 }}>
              <button className="btn btn-sm btn-primary" disabled={waiting || finished} onClick={() => setPlaying((p) => !p)}>
                {playing ? '❚❚ Pause' : '▶ Run'}
              </button>
              <button className="btn btn-sm" disabled={(waiting || finished) && atHead} onClick={() => { setPlaying(false); next() }}>
                Step ⏭
              </button>
              <button className="btn btn-sm" onClick={reset}>↺ Reset</button>
              <div className="spacer" />
              {!atHead && (
                <button className="btn btn-sm" style={{ borderColor: 'var(--pink)', color: 'var(--pink)' }} onClick={fork}>
                  ⑂ Fork from checkpoint {cursor}
                </button>
              )}
            </div>
            <label className="lbl">Checkpoints (click to time-travel)</label>
            <div className="timeline">
              {hist.map((h, k) => (
                <button
                  key={k}
                  title={h.step.node}
                  className={`cp ${k === cursor ? 'current' : k < cursor ? 'past' : ''}`}
                  onClick={() => { setPlaying(false); setCursor(k) }}
                >
                  {h.step.interrupt ? '⏸' : k}
                </button>
              ))}
            </div>
            {!atHead && (
              <p className="dim" style={{ fontSize: '0.85rem', margin: '10px 0 0' }}>
                Viewing a past checkpoint. “Step” replays saved history; “Fork” discards the future so you can take a different path (like <code>update_state</code> on an old checkpoint).
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence>
            {waiting && (
              <motion.div className="interrupt-box" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <b>⏸ __interrupt__</b>
                <div className="state-box" style={{ margin: '10px 0', maxHeight: 140 }}>{JSON.stringify(cur.step.interrupt, null, 2)}</div>
                <div className="row">
                  <button className="btn btn-sm btn-primary" onClick={() => resume('approve')}>✓ Command(resume="approve")</button>
                  <button className="btn btn-sm" onClick={() => resume('reject')}>✗ resume="reject"</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <label className="lbl">graph.get_state(config).values</label>
            <div className="state-box">{JSON.stringify(state, null, 2)}</div>
          </div>
          <div>
            <label className="lbl">next</label>
            <code>{finished ? '()' : waiting ? `('${cur.step.node}',)  # interrupted` : `('${(atHead ? cur.pendingAfter[0]?.node : hist[cursor + 1]?.step.node) ?? ''}',)`}</code>
          </div>
          <div>
            <label className="lbl">stream (updates)</label>
            <div className="log">
              {hist.slice(0, cursor + 1).map((h, k) => (
                <motion.div key={k} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <span className="dim">[{k}]</span> <b>{h.step.node}</b> — {h.step.log}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <CodeBlock code={sc.code} title="what this simulates" />
    </>
  )
}

// ───────────────────────── Graph builder ─────────────────────────
interface BNode {
  id: string
  kind: NodeKind
}

const KINDS: NodeKind[] = ['llm', 'tool', 'agent', 'router', 'human', 'data', 'default']
const ident = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'node'

const BODY: Record<string, string> = {
  llm: '    response = llm.invoke(state["messages"])\n    return {"messages": [response]}',
  tool: '    result = my_tool.invoke(state["messages"][-1])\n    return {"messages": [result]}',
  agent: '    out = sub_agent.invoke({"messages": state["messages"]})\n    return {"messages": out["messages"][-1:]}',
  router: '    label = classifier.invoke(state["messages"]).label\n    return {"route": label}',
  human: '    answer = interrupt({"question": "Please review", "state": state["messages"][-1].content})\n    return {"messages": [("user", answer)]}',
  data: '    docs = retriever.invoke(state["messages"][-1].content)\n    return {"docs": docs}',
  default: '    # your logic here\n    return {}',
}

function generatePython(nodes: BNode[], edges: GEdge[]) {
  const name = (id: string) => (id === '__start__' ? 'START' : id === '__end__' ? 'END' : `"${id}"`)
  const lines: string[] = [
    'from typing import Literal',
    'from langgraph.graph import StateGraph, MessagesState, START, END',
    nodes.some((n) => n.kind === 'human') ? 'from langgraph.types import interrupt\nfrom langgraph.checkpoint.memory import InMemorySaver' : '',
    '',
    'class State(MessagesState):',
    '    route: str',
    '    docs: list',
    '',
  ].filter((l, i) => l !== '' || i > 2)
  nodes.forEach((n) => {
    lines.push(`def ${n.id}(state: State) -> dict:`, `    """${KIND_LABELS[n.kind]} node"""`, BODY[n.kind] ?? BODY.default, '')
  })
  const condBySrc: Record<string, string[]> = {}
  edges.filter((e) => e.conditional).forEach((e) => (condBySrc[e.from] ??= []).push(e.to))
  Object.entries(condBySrc).forEach(([src, targets]) => {
    const lits = targets.map((t) => (t === '__end__' ? '"__end__"' : `"${t}"`)).join(', ')
    lines.push(`def route_after_${src.replace(/__/g, '')}(state: State) -> Literal[${lits}]:`)
    targets.forEach((t, i) => {
      const ret = t === '__end__' ? 'END' : `"${t}"`
      if (i < targets.length - 1) lines.push(`    if state.get("route") == "${t.replace(/__/g, '')}":`, `        return ${ret}`)
      else lines.push(`    return ${ret}`)
    })
    lines.push('')
  })
  lines.push('builder = StateGraph(State)')
  nodes.forEach((n) => lines.push(`builder.add_node("${n.id}", ${n.id})`))
  edges.filter((e) => !e.conditional).forEach((e) => lines.push(`builder.add_edge(${name(e.from)}, ${name(e.to)})`))
  Object.keys(condBySrc).forEach((src) => lines.push(`builder.add_conditional_edges(${name(src)}, route_after_${src.replace(/__/g, '')})`))
  lines.push('', nodes.some((n) => n.kind === 'human') ? 'graph = builder.compile(checkpointer=InMemorySaver())' : 'graph = builder.compile()')
  lines.push('print(graph.get_graph().draw_mermaid())')
  return lines.join('\n')
}

function generateJs(nodes: BNode[], edges: GEdge[]) {
  const name = (id: string) => (id === '__start__' ? 'START' : id === '__end__' ? 'END' : `"${id}"`)
  const lines = ['import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";', '', '// define your node functions and routers above, then:', 'const graph = new StateGraph(MessagesAnnotation)']
  nodes.forEach((n) => lines.push(`  .addNode("${n.id}", ${n.id.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())})`))
  edges.filter((e) => !e.conditional).forEach((e) => lines.push(`  .addEdge(${name(e.from)}, ${name(e.to)})`))
  const condBySrc: Record<string, string[]> = {}
  edges.filter((e) => e.conditional).forEach((e) => (condBySrc[e.from] ??= []).push(e.to))
  Object.entries(condBySrc).forEach(([src, t]) => lines.push(`  .addConditionalEdges(${name(src)}, routeAfter${src.replace(/_/g, '')}, [${t.map(name).join(', ')}])`))
  lines.push('  .compile();')
  return lines.join('\n')
}

function Builder() {
  const [nodes, setNodes] = useState<BNode[]>([
    { id: 'agent', kind: 'llm' },
    { id: 'tools', kind: 'tool' },
  ])
  const [edges, setEdges] = useState<GEdge[]>([
    { from: '__start__', to: 'agent' },
    { from: 'agent', to: 'tools', conditional: true },
    { from: 'agent', to: '__end__', conditional: true },
    { from: 'tools', to: 'agent' },
  ])
  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState<NodeKind>('llm')
  const [ef, setEf] = useState('__start__')
  const [et, setEt] = useState('agent')
  const [cond, setCond] = useState(false)

  const ids = ['__start__', ...nodes.map((n) => n.id), '__end__']
  const layout = useMemo(() => autoLayout(ids, edges), [ids.join(','), edges]) // eslint-disable-line react-hooks/exhaustive-deps
  const gNodes: GNode[] = ids.map((id) => ({
    id,
    label: id === '__start__' ? 'START' : id === '__end__' ? 'END' : id,
    pos: layout[id],
    kind: id === '__start__' ? 'start' : id === '__end__' ? 'end' : nodes.find((n) => n.id === id)!.kind,
  }))

  const addNode = () => {
    const id = ident(newName)
    if (!newName.trim() || ids.includes(id)) return
    setNodes((n) => [...n, { id, kind: newKind }])
    setNewName('')
  }
  const addEdge = () => {
    if (ef === et || edges.some((e) => e.from === ef && e.to === et)) return
    setEdges((e) => [...e, { from: ef, to: et, conditional: cond }])
  }
  const removeNode = (id: string) => {
    setNodes((n) => n.filter((x) => x.id !== id))
    setEdges((e) => e.filter((x) => x.from !== id && x.to !== id))
  }

  // validation
  const warnings: string[] = []
  const reach = new Set<string>(['__start__'])
  let changed = true
  while (changed) {
    changed = false
    edges.forEach((e) => {
      if (reach.has(e.from) && !reach.has(e.to)) {
        reach.add(e.to)
        changed = true
      }
    })
  }
  if (!edges.some((e) => e.from === '__start__')) warnings.push('No edge from START — the graph has no entry point.')
  nodes.forEach((n) => !reach.has(n.id) && warnings.push(`Node "${n.id}" is unreachable from START.`))
  if (!reach.has('__end__')) warnings.push('END is unreachable — the graph may never finish (or hit the recursion limit).')
  nodes.forEach((n) => !edges.some((e) => e.from === n.id) && warnings.push(`Node "${n.id}" has no outgoing edge (it will implicitly stop there).`))

  return (
    <>
      <div className="sim-layout">
        <Graph3D nodes={gNodes} edges={edges} height={460} particles={2} camera={[0, 0, 13]} />
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="lbl">Add node</label>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input className="input" placeholder="e.g. summarize" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNode()} />
              <select className="input" style={{ width: 140 }} value={newKind} onChange={(e) => setNewKind(e.target.value as NodeKind)}>
                {KINDS.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
              </select>
              <button className="btn btn-sm btn-primary" onClick={addNode}>+</button>
            </div>
          </div>
          <div>
            <label className="lbl">Add edge</label>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <select className="input" value={ef} onChange={(e) => setEf(e.target.value)}>
                {ids.filter((i) => i !== '__end__').map((i) => <option key={i} value={i}>{i === '__start__' ? 'START' : i}</option>)}
              </select>
              <span className="flow-arrow">→</span>
              <select className="input" value={et} onChange={(e) => setEt(e.target.value)}>
                {ids.filter((i) => i !== '__start__').map((i) => <option key={i} value={i}>{i === '__end__' ? 'END' : i}</option>)}
              </select>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <label className="row" style={{ gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={cond} onChange={(e) => setCond(e.target.checked)} /> conditional
              </label>
              <div className="spacer" />
              <button className="btn btn-sm" onClick={addEdge}>Add edge</button>
            </div>
          </div>
          <div>
            <label className="lbl">Nodes</label>
            <div className="row" style={{ gap: 6 }}>
              {nodes.map((n) => (
                <span key={n.id} className="tag violet">
                  {n.id} <button onClick={() => removeNode(n.id)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>✕</button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="lbl">Edges</label>
            <div className="row" style={{ gap: 6 }}>
              {edges.map((e) => (
                <span key={edgeKey(e.from, e.to)} className={`tag ${e.conditional ? 'amber' : ''}`}>
                  {e.from.replace('__start__', 'START')} {e.conditional ? '⇢' : '→'} {e.to.replace('__end__', 'END')}
                  <button onClick={() => setEdges((x) => x.filter((y) => y !== e))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>✕</button>
                </span>
              ))}
            </div>
          </div>
          {warnings.length > 0 ? (
            <div className="callout warn" style={{ margin: 0 }}>
              <div className="ci"><Icon name="TriangleAlert" size={16} /></div>
              <div style={{ fontSize: '0.85rem' }}>{warnings.map((w) => <div key={w}>{w}</div>)}</div>
            </div>
          ) : (
            <div className="callout tip" style={{ margin: 0 }}>
              <div className="ci"><Icon name="CircleCheck" size={16} /></div>
              <div style={{ fontSize: '0.85rem' }}>Graph looks valid: every node is reachable and END can be reached.</div>
            </div>
          )}
        </div>
      </div>
      <h3 style={{ marginTop: 28 }}>Generated code</h3>
      <CodeBlock code={{ python: generatePython(nodes, edges), js: generateJs(nodes, edges) }} title="graph.py" />
    </>
  )
}

export default function Playground() {
  const [tab, setTab] = useState<'sim' | 'build'>('sim')
  return (
    <div className="page container">
      <SectionHead
        eyebrow="Playground"
        title={<>Run it. Pause it. <span className="grad-text">Rewind it.</span></>}
        sub="Step through simulated LangGraph executions with checkpoints, human interrupts and time travel — or design your own graph and get the code."
      />
      <div className="pills" style={{ marginBottom: 26 }}>
        <button className={`pill ${tab === 'sim' ? 'active' : ''}`} onClick={() => setTab('sim')}><Icon name="Clapperboard" size={15} /> Execution simulator</button>
        <button className={`pill ${tab === 'build' ? 'active' : ''}`} onClick={() => setTab('build')}><Icon name="Blocks" size={15} /> Graph builder</button>
      </div>
      {tab === 'sim' ? <Simulator /> : <Builder />}
      <Callout type="info" title="About the simulator">
        The simulator replays scripted runs to illustrate the exact semantics of LangGraph (super-steps, reducers, checkpoints, interrupts, replay and forks).
        No LLM is called — run the generated code locally with your own API key to see the real thing.
      </Callout>
    </div>
  )
}
