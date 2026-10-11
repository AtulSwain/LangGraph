import type { GEdge, GNode } from '../components/Graph3D'

export interface GraphPreset {
  nodes: GNode[]
  edges: GEdge[]
  camera?: [number, number, number]
}

export const S = (x: number, y: number, z = 0): GNode => ({ id: '__start__', label: 'START', pos: [x, y, z], kind: 'start' })
export const E = (x: number, y: number, z = 0): GNode => ({ id: '__end__', label: 'END', pos: [x, y, z], kind: 'end' })

export const GRAPHS: Record<string, GraphPreset> = {
  sequence: {
    nodes: [S(-6, 0), { id: 'step_1', pos: [-2.4, 0.4, 0.5], kind: 'llm' }, { id: 'step_2', pos: [1.2, -0.3, -0.5], kind: 'tool' }, E(5, 0)],
    edges: [
      { from: '__start__', to: 'step_1' },
      { from: 'step_1', to: 'step_2' },
      { from: 'step_2', to: '__end__' },
    ],
  },
  conditional: {
    nodes: [
      S(-6, 0),
      { id: 'classify', pos: [-2.6, 0, 0], kind: 'router' },
      { id: 'billing', pos: [1, 2, 0.6], kind: 'agent' },
      { id: 'tech_support', pos: [1.3, 0, -0.8], kind: 'agent' },
      { id: 'small_talk', pos: [1, -2, 0.6], kind: 'llm' },
      E(5, 0),
    ],
    edges: [
      { from: '__start__', to: 'classify' },
      { from: 'classify', to: 'billing', conditional: true, label: '"billing"' },
      { from: 'classify', to: 'tech_support', conditional: true, label: '"tech"' },
      { from: 'classify', to: 'small_talk', conditional: true, label: '"chat"' },
      { from: 'billing', to: '__end__' },
      { from: 'tech_support', to: '__end__' },
      { from: 'small_talk', to: '__end__' },
    ],
  },
  react: {
    nodes: [S(-5.5, 0), { id: 'agent', label: 'agent (LLM)', pos: [-1.2, 0, 0], kind: 'llm' }, { id: 'tools', label: 'tools', pos: [2.4, 2.2, -0.5], kind: 'tool' }, E(3, -2.2)],
    edges: [
      { from: '__start__', to: 'agent' },
      { from: 'agent', to: 'tools', conditional: true, label: 'tool_calls?' },
      { from: 'tools', to: 'agent' },
      { from: 'agent', to: '__end__', conditional: true, label: 'done' },
    ],
  },
  mapReduce: {
    nodes: [
      S(-6.5, 0),
      { id: 'plan', label: 'plan_subjects', pos: [-3.4, 0, 0], kind: 'llm' },
      { id: 'w1', label: 'Send → worker', pos: [0, 2.4, 0.6], kind: 'agent' },
      { id: 'w2', label: 'Send → worker', pos: [0, 0, -0.6], kind: 'agent' },
      { id: 'w3', label: 'Send → worker', pos: [0, -2.4, 0.6], kind: 'agent' },
      { id: 'reduce', label: 'reduce', pos: [3.4, 0, 0], kind: 'data' },
      E(6.2, 0),
    ],
    edges: [
      { from: '__start__', to: 'plan' },
      { from: 'plan', to: 'w1', conditional: true },
      { from: 'plan', to: 'w2', conditional: true },
      { from: 'plan', to: 'w3', conditional: true },
      { from: 'w1', to: 'reduce' },
      { from: 'w2', to: 'reduce' },
      { from: 'w3', to: 'reduce' },
      { from: 'reduce', to: '__end__' },
    ],
  },
  hitl: {
    nodes: [
      S(-6, 0),
      { id: 'draft', label: 'draft_action', pos: [-2.8, 0, 0], kind: 'llm' },
      { id: 'approval', label: 'human_approval ⏸', pos: [0.4, 0, 0.6], kind: 'human' },
      { id: 'execute', label: 'execute', pos: [3.4, 1.8, 0], kind: 'tool' },
      { id: 'revise', label: 'revise', pos: [0.6, -2.6, -0.4], kind: 'llm' },
      E(6, 1.8),
    ],
    edges: [
      { from: '__start__', to: 'draft' },
      { from: 'draft', to: 'approval' },
      { from: 'approval', to: 'execute', conditional: true, label: 'approve' },
      { from: 'approval', to: 'revise', conditional: true, label: 'reject' },
      { from: 'revise', to: 'draft' },
      { from: 'execute', to: '__end__' },
    ],
  },
  supervisor: {
    nodes: [
      S(-6, 0),
      { id: 'supervisor', pos: [-2.2, 0, 0], kind: 'router' },
      { id: 'researcher', pos: [1.8, 2.6, 0.4], kind: 'agent' },
      { id: 'coder', pos: [2.4, 0, -0.8], kind: 'agent' },
      { id: 'writer', pos: [1.8, -2.6, 0.4], kind: 'agent' },
      E(-2.2, -3.2),
    ],
    edges: [
      { from: '__start__', to: 'supervisor' },
      { from: 'supervisor', to: 'researcher', conditional: true },
      { from: 'supervisor', to: 'coder', conditional: true },
      { from: 'supervisor', to: 'writer', conditional: true },
      { from: 'researcher', to: 'supervisor' },
      { from: 'coder', to: 'supervisor' },
      { from: 'writer', to: 'supervisor' },
      { from: 'supervisor', to: '__end__', conditional: true, label: 'FINISH' },
    ],
  },
  swarm: {
    nodes: [
      S(-5.5, 2.4),
      { id: 'triage', pos: [-2.2, 1.6, 0], kind: 'agent' },
      { id: 'flights', pos: [2.2, 1.6, -0.6], kind: 'agent' },
      { id: 'hotels', pos: [0, -1.8, 0.6], kind: 'agent' },
      E(4.5, -2),
    ],
    edges: [
      { from: '__start__', to: 'triage' },
      { from: 'triage', to: 'flights', conditional: true, label: 'handoff' },
      { from: 'flights', to: 'triage', conditional: true },
      { from: 'triage', to: 'hotels', conditional: true },
      { from: 'hotels', to: 'triage', conditional: true },
      { from: 'flights', to: 'hotels', conditional: true, label: 'handoff' },
      { from: 'hotels', to: 'flights', conditional: true },
      { from: 'flights', to: '__end__', conditional: true },
      { from: 'hotels', to: '__end__', conditional: true },
    ],
  },
  hierarchical: {
    nodes: [
      S(-6.5, 0),
      { id: 'top', label: 'top_supervisor', pos: [-3.2, 0, 0], kind: 'router' },
      { id: 'research_team', label: 'research_team ⧉', pos: [0.4, 2.2, 0], kind: 'router' },
      { id: 'writing_team', label: 'writing_team ⧉', pos: [0.4, -2.2, 0], kind: 'router' },
      { id: 'search', pos: [4, 3.4, 0.6], kind: 'tool' },
      { id: 'scraper', pos: [4, 1.2, -0.6], kind: 'tool' },
      { id: 'author', pos: [4, -1.2, 0.6], kind: 'llm' },
      { id: 'editor', pos: [4, -3.4, -0.6], kind: 'llm' },
      E(-3.2, -3.2),
    ],
    edges: [
      { from: '__start__', to: 'top' },
      { from: 'top', to: 'research_team', conditional: true },
      { from: 'top', to: 'writing_team', conditional: true },
      { from: 'research_team', to: 'top' },
      { from: 'writing_team', to: 'top' },
      { from: 'research_team', to: 'search', conditional: true },
      { from: 'research_team', to: 'scraper', conditional: true },
      { from: 'writing_team', to: 'author', conditional: true },
      { from: 'writing_team', to: 'editor', conditional: true },
      { from: 'top', to: '__end__', conditional: true },
    ],
    camera: [0, 0, 13],
  },
  planExecute: {
    nodes: [
      S(-6.5, 0),
      { id: 'planner', pos: [-3.4, 0, 0], kind: 'llm' },
      { id: 'executor', label: 'executor (agent)', pos: [0, 1.6, 0.5], kind: 'agent' },
      { id: 'replan', label: 'replanner', pos: [3.2, 0, -0.5], kind: 'llm' },
      E(5.8, -1.8),
    ],
    edges: [
      { from: '__start__', to: 'planner' },
      { from: 'planner', to: 'executor' },
      { from: 'executor', to: 'replan' },
      { from: 'replan', to: 'executor', conditional: true, label: 'more steps' },
      { from: 'replan', to: '__end__', conditional: true, label: 'respond' },
    ],
  },
  reflection: {
    nodes: [S(-5.5, 0), { id: 'generate', pos: [-1.8, 0, 0], kind: 'llm' }, { id: 'reflect', label: 'critique', pos: [2.2, 1.8, -0.4], kind: 'llm' }, E(2.6, -2.2)],
    edges: [
      { from: '__start__', to: 'generate' },
      { from: 'generate', to: 'reflect', conditional: true, label: 'iterate' },
      { from: 'reflect', to: 'generate' },
      { from: 'generate', to: '__end__', conditional: true, label: 'good enough' },
    ],
  },
  agenticRag: {
    nodes: [
      S(-7, 0),
      { id: 'agent', label: 'agent', pos: [-4, 0, 0], kind: 'llm' },
      { id: 'retrieve', pos: [-1.2, 1.8, 0.6], kind: 'data' },
      { id: 'grade', label: 'grade_docs', pos: [1.6, 1.8, -0.4], kind: 'router' },
      { id: 'rewrite', label: 'rewrite_query', pos: [0.2, -1.4, 0.6], kind: 'llm' },
      { id: 'generate', pos: [4.4, 0.4, 0], kind: 'llm' },
      E(6.8, 0),
    ],
    edges: [
      { from: '__start__', to: 'agent' },
      { from: 'agent', to: 'retrieve', conditional: true, label: 'needs docs' },
      { from: 'retrieve', to: 'grade' },
      { from: 'grade', to: 'generate', conditional: true, label: 'relevant' },
      { from: 'grade', to: 'rewrite', conditional: true, label: 'irrelevant' },
      { from: 'rewrite', to: 'agent' },
      { from: 'generate', to: '__end__' },
      { from: 'agent', to: '__end__', conditional: true },
    ],
    camera: [0, 0, 12.5],
  },
  subgraph: {
    nodes: [
      S(-6, 0),
      { id: 'parent_a', label: 'prepare', pos: [-3, 0, 0], kind: 'default' },
      { id: 'sub_in', label: '⧉ sub: fetch', pos: [0, 1.4, 0.3], kind: 'tool' },
      { id: 'sub_out', label: '⧉ sub: summarize', pos: [0, -1.4, -0.3], kind: 'llm' },
      { id: 'parent_b', label: 'finalize', pos: [3, 0, 0], kind: 'default' },
      E(6, 0),
    ],
    edges: [
      { from: '__start__', to: 'parent_a' },
      { from: 'parent_a', to: 'sub_in' },
      { from: 'sub_in', to: 'sub_out' },
      { from: 'sub_out', to: 'parent_b' },
      { from: 'parent_b', to: '__end__' },
    ],
  },
  parallel: {
    nodes: [
      S(-6, 0),
      { id: 'a', pos: [-3, 0, 0], kind: 'default' },
      { id: 'b', pos: [0, 1.8, 0.5], kind: 'tool' },
      { id: 'c', pos: [0, -1.8, -0.5], kind: 'tool' },
      { id: 'd', label: 'd (fan-in)', pos: [3, 0, 0], kind: 'data' },
      E(6, 0),
    ],
    edges: [
      { from: '__start__', to: 'a' },
      { from: 'a', to: 'b' },
      { from: 'a', to: 'c' },
      { from: 'b', to: 'd' },
      { from: 'c', to: 'd' },
      { from: 'd', to: '__end__' },
    ],
  },
  memory: {
    nodes: [
      S(-6, 0),
      { id: 'recall', label: 'recall_memories', pos: [-2.8, 0, 0], kind: 'data' },
      { id: 'chat', label: 'chat (LLM)', pos: [0.4, 0, 0.5], kind: 'llm' },
      { id: 'write', label: 'write_memories', pos: [3.4, 0, -0.3], kind: 'data' },
      E(6.2, 0),
    ],
    edges: [
      { from: '__start__', to: 'recall' },
      { from: 'recall', to: 'chat' },
      { from: 'chat', to: 'write' },
      { from: 'write', to: '__end__' },
    ],
  },
}

/** Big decorative constellation for the hero. */
export function heroConstellation(): GraphPreset {
  const kinds = ['llm', 'tool', 'agent', 'router', 'data', 'human'] as const
  const nodes: GNode[] = []
  const N = 22
  for (let i = 0; i < N; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / N)
    const theta = Math.PI * (1 + Math.sqrt(5)) * i
    const r = 4.4
    nodes.push({
      id: `n${i}`,
      pos: [r * Math.cos(theta) * Math.sin(phi) * 1.35, r * Math.cos(phi) * 0.85, r * Math.sin(theta) * Math.sin(phi)],
      kind: i === 0 ? 'start' : i === N - 1 ? 'end' : kinds[i % kinds.length],
    })
  }
  const edges: GEdge[] = []
  for (let i = 0; i < N - 1; i++) {
    edges.push({ from: `n${i}`, to: `n${i + 1}`, conditional: i % 4 === 3 })
    if (i % 3 === 0 && i + 5 < N) edges.push({ from: `n${i}`, to: `n${i + 5}`, conditional: true })
  }
  return { nodes, edges }
}
