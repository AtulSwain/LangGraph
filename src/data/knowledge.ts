// ───────────────────────── MODEL PROVIDERS ─────────────────────────
export interface Provider {
  name: string
  pkg: string
  init: string
  families: string
  strengths: string
  notes: string
}

export const PROVIDERS: Provider[] = [
  { name: 'Anthropic', pkg: 'langchain-anthropic', init: 'anthropic:claude-sonnet-4-5', families: 'Claude Opus · Sonnet · Haiku', strengths: 'Strong tool use, long context, careful instruction following, extended thinking', notes: 'Prompt caching for long stable prompts; great default for agents.' },
  { name: 'OpenAI', pkg: 'langchain-openai', init: 'openai:gpt-4.1', families: 'GPT series · o-series reasoning models', strengths: 'Broad ecosystem, structured outputs, reasoning models', notes: 'Responses API support; built-in tools via the provider.' },
  { name: 'Google', pkg: 'langchain-google-genai', init: 'google_genai:gemini-2.5-flash', families: 'Gemini Pro · Flash', strengths: 'Very long context, multimodal (video/audio), fast Flash tier', notes: 'Use langchain-google-vertexai for Vertex AI on GCP.' },
  { name: 'AWS Bedrock', pkg: 'langchain-aws', init: 'bedrock_converse:<model-id>', families: 'Claude, Llama, Mistral, Nova, …', strengths: 'Enterprise governance, VPC, IAM, many vendors behind one API', notes: 'Use the Converse API integration for tool calling.' },
  { name: 'Azure OpenAI', pkg: 'langchain-openai', init: 'azure_openai:<deployment>', families: 'OpenAI models on Azure', strengths: 'Enterprise compliance & regional data residency', notes: 'Configure endpoint, API version and deployment name.' },
  { name: 'Mistral', pkg: 'langchain-mistralai', init: 'mistralai:mistral-large-latest', families: 'Mistral Large · Medium · Small · Codestral', strengths: 'European provider, efficient models, open weights options', notes: 'Good price/performance for many tasks.' },
  { name: 'Meta Llama (open)', pkg: 'via Ollama / Groq / Together / Fireworks / Bedrock', init: 'groq:llama-3.3-70b-versatile', families: 'Llama 3.x / 4', strengths: 'Open weights, self-hostable, fine-tunable', notes: 'Check tool-calling quality per host and size.' },
  { name: 'DeepSeek', pkg: 'langchain-deepseek', init: 'deepseek:deepseek-chat', families: 'DeepSeek chat · reasoner', strengths: 'Low cost, strong reasoning & coding', notes: 'Reasoning variants may not support all tool features.' },
  { name: 'xAI', pkg: 'langchain-xai', init: 'xai:<grok-model>', families: 'Grok', strengths: 'Large context, real-time oriented models', notes: 'OpenAI-compatible API.' },
  { name: 'Cohere', pkg: 'langchain-cohere', init: 'cohere:command-r-plus', families: 'Command · Embed · Rerank', strengths: 'RAG-focused, excellent rerankers and embeddings', notes: 'Rerank is a cheap quality boost for retrieval.' },
  { name: 'Ollama (local)', pkg: 'langchain-ollama', init: 'ollama:llama3.1', families: 'Any GGUF model: Llama, Qwen, Mistral, Gemma, …', strengths: 'Private, offline, free to run', notes: 'Smaller models struggle with complex tool loops — keep graphs simple.' },
  { name: 'Groq / Fireworks / Together', pkg: 'langchain-groq · langchain-fireworks · langchain-together', init: 'groq:<model>', families: 'Hosted open models', strengths: 'Very fast inference of open models', notes: 'Great for low-latency routers and classifiers.' },
]

export const ROLES = [
  { role: 'Router / classifier', icon: 'Route', need: 'Speed, low cost, reliable structured output', pick: 'Small/fast tier (Haiku-, Flash-, mini-class) at temperature 0' },
  { role: 'Planner / orchestrator', icon: 'Map', need: 'Deep reasoning, long-horizon thinking', pick: 'Frontier model; consider reasoning / extended-thinking modes' },
  { role: 'Tool-using executor', icon: 'Wrench', need: 'Accurate tool calls, parallel calls, recovery from errors', pick: 'Strong mid/frontier model with proven tool-calling' },
  { role: 'Summarizer / compressor', icon: 'Filter', need: 'Cheap, long context', pick: 'Fast tier with large context window' },
  { role: 'Grader / LLM-as-judge', icon: 'Scale', need: 'Consistency, calibrated judgements', pick: 'Different model family than the generator to reduce self-bias' },
  { role: 'Embeddings', icon: 'Atom', need: 'Retrieval quality, cost per token', pick: 'Dedicated embedding model; add a reranker for precision' },
  { role: 'Vision / multimodal', icon: 'Eye', need: 'Image, PDF, audio or video understanding', pick: 'Multimodal frontier model' },
  { role: 'Local / private', icon: 'Lock', need: 'Data never leaves your infra', pick: 'Open-weight model via Ollama / vLLM; keep flows deterministic' },
]

// ───────────────────────── FRAMEWORK COMPARISON ─────────────────────────
export interface Framework {
  name: string
  by: string
  langs: string
  model: string
  persistence: string
  hitl: string
  bestFor: string
  tradeoff: string
}

export const FRAMEWORKS: Framework[] = [
  { name: 'LangGraph', by: 'LangChain', langs: 'Python, TypeScript', model: 'Explicit state graph (Pregel runtime) or functional workflows', persistence: 'Built-in checkpointers, time travel, durable execution', hitl: 'First-class interrupt() / Command(resume)', bestFor: 'Production agents needing control, reliability and long-running state', tradeoff: 'Lower-level: more code than role-based frameworks' },
  { name: 'LangChain create_agent', by: 'LangChain', langs: 'Python, TypeScript', model: 'Prebuilt agent loop + middleware (runs on LangGraph)', persistence: 'Via LangGraph checkpointers', hitl: 'HITL middleware', bestFor: 'Fast start with standard tool-calling agents', tradeoff: 'Less flexible than a custom graph' },
  { name: 'CrewAI', by: 'CrewAI', langs: 'Python', model: 'Role-based “crews” of agents with tasks; Flows for event-driven orchestration', persistence: 'Memory modules; Flows state', hitl: 'Human input on tasks', bestFor: 'Quickly prototyping role-playing multi-agent teams', tradeoff: 'Higher-level abstractions, less fine-grained control' },
  { name: 'AutoGen / Microsoft Agent Framework', by: 'Microsoft', langs: 'Python, .NET', model: 'Conversational multi-agent (actor model); Microsoft is converging AutoGen & Semantic Kernel into Agent Framework', persistence: 'State save/load; workflow checkpoints in Agent Framework', hitl: 'User-proxy agents, approvals', bestFor: 'Research on agent conversations; Microsoft/Azure stacks', tradeoff: 'API changes across generations' },
  { name: 'OpenAI Agents SDK', by: 'OpenAI', langs: 'Python, TypeScript', model: 'Lightweight agents with handoffs, guardrails and sessions', persistence: 'Sessions for conversation history', hitl: 'Via tool approval patterns', bestFor: 'Simple multi-agent apps centered on OpenAI models', tradeoff: 'Less control over orchestration and durability' },
  { name: 'LlamaIndex Workflows', by: 'LlamaIndex', langs: 'Python, TypeScript', model: 'Event-driven steps', persistence: 'Context serialization', hitl: 'Human-in-the-loop events', bestFor: 'Document-heavy / RAG-centric agents', tradeoff: 'Smaller orchestration ecosystem' },
  { name: 'Pydantic AI', by: 'Pydantic', langs: 'Python', model: 'Type-safe agents + pydantic-graph state machines', persistence: 'Graph state persistence', hitl: 'Deferred tools / approvals', bestFor: 'Type-safety-first Python teams', tradeoff: 'Younger ecosystem' },
  { name: 'Google ADK', by: 'Google', langs: 'Python, Java', model: 'Agents + workflow agents (sequential, parallel, loop)', persistence: 'Session & memory services', hitl: 'Tool confirmation', bestFor: 'Gemini / Google Cloud deployments', tradeoff: 'Best experience inside Google Cloud' },
  { name: 'Mastra', by: 'Mastra', langs: 'TypeScript', model: 'Agents + graph-based workflows', persistence: 'Workflow snapshots', hitl: 'Suspend / resume', bestFor: 'TypeScript-first product teams', tradeoff: 'TypeScript only' },
]

// ───────────────────────── INTERVIEW PREP ─────────────────────────
export const INTERVIEW: { q: string; a: string; tag: string }[] = [
  { tag: 'Basics', q: 'What is LangGraph and why use it instead of a simple chain?', a: 'LangGraph is a low-level orchestration framework that models an LLM app as a stateful graph (State, Nodes, Edges). Unlike linear chains it supports cycles, branching and parallelism, and it provides production primitives — checkpoint-based persistence, durable execution, human-in-the-loop interrupts, streaming and memory — that agents need.' },
  { tag: 'Basics', q: 'Explain State, Nodes and Edges.', a: 'State is the shared, typed data structure for a run. Nodes are functions that read state and return partial updates. Edges decide the next node: normal edges are fixed transitions, conditional edges choose at runtime, and START/END mark entry and exit.' },
  { tag: 'Basics', q: 'What is a reducer and when do you need one?', a: 'A reducer defines how an update merges into an existing key (default: overwrite). You need one when multiple nodes write the same key — especially in parallel — e.g. operator.add for lists, add_messages for chat history.' },
  { tag: 'Basics', q: 'What does add_messages do differently from operator.add?', a: 'It appends new messages but replaces messages that have an existing id, supports deletion via RemoveMessage, and coerces dicts/tuples into message objects.' },
  { tag: 'Runtime', q: 'Describe LangGraph’s execution model.', a: 'It follows Pregel / Bulk Synchronous Parallel. Execution proceeds in super-steps: plan which nodes are triggered by updated channels, execute them in parallel (writes isolated), then apply all writes via reducers. A checkpoint is saved after each super-step; the run halts when no node is triggered.' },
  { tag: 'Runtime', q: 'How do you prevent infinite loops?', a: 'Explicit exit conditions in routers, iteration counters in state, the recursion_limit (counts super-steps, raises GraphRecursionError), RemainingSteps for graceful wrap-up, and call-limit middleware for prebuilt agents.' },
  { tag: 'Control', q: 'When would you use Command instead of a conditional edge?', a: 'When a node needs to update state and choose the next node together (e.g. a triage decision plus the reason), and for multi-agent handoffs — Command(goto=..., graph=Command.PARENT) navigates from a subgraph to its parent.' },
  { tag: 'Control', q: 'What is the Send API?', a: 'Send(node, payload) returned from a conditional edge creates dynamic parallel tasks, each with its own input. It enables map-reduce when the number of items is only known at runtime; results merge back via a reducer.' },
  { tag: 'Control', q: 'How do subgraphs communicate with the parent graph?', a: 'If schemas share keys, add the compiled subgraph as a node and shared keys flow automatically. Otherwise call the subgraph inside a wrapper node that maps parent state to child input and back. Checkpointers propagate to subgraphs.' },
  { tag: 'Persistence', q: 'What is a checkpointer and what does it enable?', a: 'A component that saves a StateSnapshot after every super-step, keyed by thread_id. It enables conversational memory, human-in-the-loop pauses, fault-tolerant resume, and time travel (replay/fork). Production options: Postgres, SQLite, Redis and others; InMemorySaver for dev.' },
  { tag: 'Persistence', q: 'Short-term vs long-term memory?', a: 'Short-term memory is thread-scoped state (message history) persisted by the checkpointer. Long-term memory lives in a Store, shared across threads, organized by namespaces, optionally with semantic search — for user preferences, facts and learned instructions.' },
  { tag: 'Persistence', q: 'How does time travel work?', a: 'get_state_history lists checkpoints. Invoking with a past checkpoint config replays from that point (earlier steps aren’t re-executed). update_state on a past checkpoint creates a fork; invoking with None continues the alternate branch. History is append-only.' },
  { tag: 'HITL', q: 'How does interrupt() work, and what is a common pitfall?', a: 'interrupt(payload) saves state and pauses, surfacing the payload as __interrupt__. You resume with Command(resume=value) on the same thread. Pitfall: the node re-executes from its beginning on resume, so side effects before the interrupt run twice — keep them after or make them idempotent.' },
  { tag: 'HITL', q: 'Static breakpoints vs dynamic interrupts?', a: 'Static breakpoints (interrupt_before/after at compile time) pause at node boundaries and are mostly for debugging. Dynamic interrupt() can be called conditionally anywhere inside a node with a custom payload — the recommended approach for real approvals.' },
  { tag: 'Streaming', q: 'Name the streaming modes.', a: 'values (full state each step), updates (per-node deltas), messages (LLM tokens + metadata), custom (your own events via get_stream_writer), debug (detailed events). Combine modes with a list; add subgraphs=True for nested graphs.' },
  { tag: 'Agents', q: 'How would you build a ReAct agent from scratch?', a: 'MessagesState; an agent node calling llm.bind_tools(tools); a ToolNode(tools); START → agent; conditional edge with tools_condition to tools or END; edge tools → agent. Add a checkpointer for memory.' },
  { tag: 'Agents', q: 'Supervisor vs swarm architectures?', a: 'Supervisor: a central LLM routes work to specialists who report back — clear control and auditability, but an extra hop per step. Swarm: agents hand off directly via handoff tools and the active agent persists — fewer hops, more autonomy, harder to reason about globally.' },
  { tag: 'Agents', q: 'What is middleware in LangChain v1 agents?', a: 'Hooks around the agent loop: before/after agent and model (can update state) and wrap_model_call / wrap_tool_call (control execution, e.g. retries, blocking). Built-ins include summarization, HITL, PII redaction, call limits, fallbacks and retries.' },
  { tag: 'Agents', q: 'What makes a “deep agent”?', a: 'Planning (a todo tool), a filesystem for offloading context, sub-agents for context isolation, and a detailed system prompt — packaged by the deepagents library on top of LangGraph.' },
  { tag: 'Design', q: 'How do you decide between a workflow and an agent?', a: 'Use deterministic workflows (chains, routing, parallelization) when steps are known; they are cheaper, faster and testable. Use agents when the path is open-ended. Often the best system is a workflow with agentic sub-steps.' },
  { tag: 'Design', q: 'What belongs in state vs runtime context?', a: 'State: data that changes during the run (messages, intermediate results). Context: static per-run inputs (user id, model choice, credentials, feature flags) passed via context_schema and read with Runtime.' },
  { tag: 'Design', q: 'What is context engineering?', a: 'Deliberately managing what enters the context window at each step: write context outside the window (state, files, store), select what’s relevant (retrieval, memory), compress (summaries, trimming), and isolate (sub-agents).' },
  { tag: 'Production', q: 'How do you make an agent production-ready?', a: 'Durable checkpointer (Postgres), retries and fallbacks, recursion/call limits, HITL on risky actions, streaming UX, auth & per-user isolation, tracing + evaluation datasets in LangSmith, and deployment with a task queue (LangGraph Server / LangSmith Deployment or your own).' },
  { tag: 'Production', q: 'How do you evaluate agents?', a: 'Datasets of inputs and references; final-response evaluators (exact, heuristic, LLM-as-judge); trajectory evaluators that check tool-call sequences; single-step tests for routers; online evaluation of production traces; regression runs on every change.' },
  { tag: 'Production', q: 'What is double-texting and how is it handled?', a: 'A user sends a new message while a run is in progress. LangGraph Server strategies: reject the new one, enqueue it, interrupt the current run (keeping progress), or rollback the current run and start the new one.' },
  { tag: 'Production', q: 'How do you reduce cost and latency?', a: 'Per-node model sizing, parallel fan-out, streaming, node and prompt caching, context trimming/summarization, fewer LLM routing hops, and measuring per-node cost in LangSmith.' },
  { tag: 'Ecosystem', q: 'LangChain vs LangGraph vs LangSmith?', a: 'LangChain: integrations and high-level agents (create_agent). LangGraph: low-level orchestration runtime. LangSmith: observability, evaluation and deployment (LangSmith Deployment, formerly LangGraph Platform).' },
  { tag: 'Ecosystem', q: 'What is MCP and how does LangGraph use it?', a: 'Model Context Protocol is an open standard for exposing tools/data to LLMs. langchain-mcp-adapters’ MultiServerMCPClient loads MCP server tools as LangChain tools for ToolNode or create_agent.' },
  { tag: 'Ecosystem', q: 'Graph API vs Functional API?', a: 'Graph API: explicit nodes/edges/state, visualizable, best for complex branching. Functional API: @entrypoint/@task with normal control flow; tasks are checkpointed so resumes skip completed work. Same runtime and features.' },
  { tag: 'Ecosystem', q: 'What changed in the 1.0 releases?', a: 'October 2025: LangGraph 1.0 (stability, durable execution, no breaking changes) and LangChain 1.0 (create_agent built on LangGraph with middleware, standard content blocks, structured-output strategies; legacy moved to langchain-classic). LangGraph Platform became LangSmith Deployment.' },
]

// ───────────────────────── RESOURCES ─────────────────────────
export const RESOURCES: { group: string; items: { name: string; url: string; desc: string }[] }[] = [
  {
    group: 'Official documentation',
    items: [
      { name: 'LangGraph docs (Python)', url: 'https://docs.langchain.com/oss/python/langgraph/overview', desc: 'Concepts, how-tos and API reference.' },
      { name: 'LangGraph docs (JavaScript)', url: 'https://docs.langchain.com/oss/javascript/langgraph/overview', desc: 'The TypeScript edition.' },
      { name: 'LangChain docs', url: 'https://docs.langchain.com/oss/python/langchain/overview', desc: 'create_agent, middleware, models, tools, integrations.' },
      { name: 'LangSmith docs', url: 'https://docs.langchain.com/langsmith/home', desc: 'Observability, evaluation, deployment, Studio.' },
      { name: 'API reference', url: 'https://reference.langchain.com/python/', desc: 'Every class and function signature.' },
    ],
  },
  {
    group: 'Source code (GitHub)',
    items: [
      { name: 'langchain-ai/langgraph', url: 'https://github.com/langchain-ai/langgraph', desc: 'The Python library, examples and releases.' },
      { name: 'langchain-ai/langgraphjs', url: 'https://github.com/langchain-ai/langgraphjs', desc: 'The TypeScript library.' },
      { name: 'langchain-ai/deepagents', url: 'https://github.com/langchain-ai/deepagents', desc: 'Planning + filesystem + sub-agents harness.' },
      { name: 'langchain-ai/langchain-mcp-adapters', url: 'https://github.com/langchain-ai/langchain-mcp-adapters', desc: 'Use MCP servers as LangChain tools.' },
      { name: 'langchain-ai/langgraph-supervisor-py', url: 'https://github.com/langchain-ai/langgraph-supervisor-py', desc: 'Supervisor multi-agent helper.' },
      { name: 'langchain-ai/langgraph-swarm-py', url: 'https://github.com/langchain-ai/langgraph-swarm-py', desc: 'Swarm multi-agent helper.' },
      { name: 'langchain-ai/agent-chat-ui', url: 'https://github.com/langchain-ai/agent-chat-ui', desc: 'Next.js chat UI for any LangGraph server.' },
      { name: 'langchain-ai/open_deep_research', url: 'https://github.com/langchain-ai/open_deep_research', desc: 'Reference deep research agent.' },
    ],
  },
  {
    group: 'Learn',
    items: [
      { name: 'LangChain Academy', url: 'https://academy.langchain.com/', desc: 'Free official courses, incl. Introduction to LangGraph.' },
      { name: 'LangChain blog', url: 'https://blog.langchain.com/', desc: 'Architecture write-ups, case studies and releases.' },
      { name: 'Changelog', url: 'https://changelog.langchain.com/', desc: 'What shipped, when.' },
      { name: 'Community forum', url: 'https://forum.langchain.com/', desc: 'Ask questions, share projects.' },
    ],
  },
  {
    group: 'Products',
    items: [
      { name: 'LangSmith', url: 'https://smith.langchain.com/', desc: 'Tracing, evals, prompt hub, deployments.' },
      { name: 'LangSmith Deployment', url: 'https://www.langchain.com/langsmith/deployment', desc: 'Managed infrastructure for long-running agents.' },
    ],
  },
]

export const TIMELINE: { date: string; title: string; text: string }[] = [
  { date: 'Oct 2022', title: 'LangChain launches', text: 'Open-source library for composing LLM calls, prompts and tools.' },
  { date: '2023', title: 'LCEL & LangSmith', text: 'The Runnable protocol and pipe syntax; LangSmith for tracing and evaluation.' },
  { date: 'Jan 2024', title: 'LangGraph released', text: 'Cyclic, stateful agent graphs with checkpointing.' },
  { date: 'mid 2024', title: 'Cloud & Studio', text: 'LangGraph Cloud (later Platform) and LangGraph Studio visual IDE.' },
  { date: '2025', title: 'Functional API, Command, multi-agent libs', text: 'Command, interrupt(), Functional API, supervisor & swarm packages, MCP adapters; Platform GA.' },
  { date: 'Oct 2025', title: 'LangGraph 1.0 & LangChain 1.0', text: 'Stable releases; create_agent + middleware; Platform → LangSmith Deployment; Studio → LangSmith Studio.' },
  { date: '2026', title: 'LangGraph 1.1+ and deep agents', text: 'Opt-in type-safe streaming, deployment CLI improvements, and the growing deepagents ecosystem.' },
]
