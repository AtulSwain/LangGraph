export interface Term {
  term: string
  def: string
  cat: 'Core' | 'Control' | 'Persistence' | 'HITL' | 'Runtime' | 'Ecosystem' | 'LangChain'
  code?: string
}

export const GLOSSARY: Term[] = [
  { term: 'StateGraph', cat: 'Core', def: 'The main graph builder class. Parameterized by a state schema; you add nodes and edges, then compile().', code: 'StateGraph(State)' },
  { term: 'State', cat: 'Core', def: 'Shared data structure (TypedDict, dataclass, Pydantic, or Annotation.Root in JS) passed to every node.' },
  { term: 'Channel', cat: 'Core', def: 'Internal storage for one state key. Channels have a type and a reducer (LastValue, BinaryOperatorAggregate, Topic, …).' },
  { term: 'Reducer', cat: 'Core', def: 'Function (current, update) → new that defines how node updates merge into a state key.', code: 'Annotated[list, operator.add]' },
  { term: 'add_messages', cat: 'Core', def: 'Reducer for chat history: append, update-by-id, and delete via RemoveMessage.' },
  { term: 'MessagesState', cat: 'Core', def: 'Prebuilt schema with a messages key using add_messages. JS: MessagesAnnotation.' },
  { term: 'Node', cat: 'Core', def: 'A function (sync/async) or runnable that receives state and returns a partial update.' },
  { term: 'Edge', cat: 'Core', def: 'Fixed transition between nodes. Multiple outgoing edges run targets in parallel.' },
  { term: 'Conditional edge', cat: 'Control', def: 'Routing function that chooses the next node(s) at runtime based on state.', code: 'add_conditional_edges("a", route, ["b", "c"])' },
  { term: 'START / END', cat: 'Core', def: 'Virtual entry and exit nodes of every graph.' },
  { term: 'compile()', cat: 'Core', def: 'Validates the graph and returns a runnable CompiledStateGraph; attaches checkpointer, store, breakpoints.' },
  { term: 'Super-step', cat: 'Runtime', def: 'One Pregel tick: plan which nodes run, execute them in parallel, apply their writes. A checkpoint follows each super-step.' },
  { term: 'Pregel', cat: 'Runtime', def: 'Google’s graph-processing model (Bulk Synchronous Parallel) that LangGraph’s runtime is based on.' },
  { term: 'Recursion limit', cat: 'Runtime', def: 'Maximum super-steps per run; exceeding raises GraphRecursionError.', code: '{"recursion_limit": 50}' },
  { term: 'Command', cat: 'Control', def: 'Return value combining state update + goto routing; also used to resume interrupts and for parent-graph handoffs.', code: 'Command(update={...}, goto="node")' },
  { term: 'Send', cat: 'Control', def: 'Dispatches a node invocation with a custom payload — enables dynamic map-reduce fan-out.', code: 'Send("worker", {"item": x})' },
  { term: 'Subgraph', cat: 'Control', def: 'A compiled graph used as a node inside another graph.' },
  { term: 'Handoff', cat: 'Control', def: 'Transfer of control between agents, implemented with Command(goto=..., graph=Command.PARENT).' },
  { term: 'Checkpointer', cat: 'Persistence', def: 'Saves a StateSnapshot after every super-step. InMemorySaver, SqliteSaver, PostgresSaver, …' },
  { term: 'Thread', cat: 'Persistence', def: 'A sequence of checkpoints identified by thread_id — e.g. one conversation.', code: '{"configurable": {"thread_id": "1"}}' },
  { term: 'StateSnapshot', cat: 'Persistence', def: 'A checkpoint: values, next, config, metadata, created_at, parent_config, tasks.' },
  { term: 'get_state_history', cat: 'Persistence', def: 'Lists all checkpoints of a thread (newest first) — the basis of time travel.' },
  { term: 'update_state', cat: 'Persistence', def: 'Writes values to a thread as if a node produced them; on a past checkpoint, creates a fork.' },
  { term: 'Store', cat: 'Persistence', def: 'Long-term, cross-thread memory: namespaced JSON docs with optional semantic search.', code: 'store.put(("memories", uid), key, value)' },
  { term: 'Time travel', cat: 'Persistence', def: 'Replaying or forking execution from any past checkpoint.' },
  { term: 'Durability mode', cat: 'Persistence', def: 'When checkpoints are written: "exit", "async" or "sync".' },
  { term: 'interrupt()', cat: 'HITL', def: 'Pauses a run inside a node and surfaces a payload under __interrupt__; resume with Command(resume=...).' },
  { term: 'Breakpoint', cat: 'HITL', def: 'Static pause before/after nodes via compile(interrupt_before=[...]) — mostly for debugging.' },
  { term: 'Stream modes', cat: 'Runtime', def: 'values, updates, messages, custom, debug — choose what the stream yields.' },
  { term: 'get_stream_writer', cat: 'Runtime', def: 'Returns a writer for emitting custom stream events from nodes/tools.' },
  { term: 'Runtime context', cat: 'Runtime', def: 'Static per-run inputs declared with context_schema and read via runtime.context.' },
  { term: '@entrypoint / @task', cat: 'Runtime', def: 'Functional API: write workflows as plain functions with checkpointed tasks.' },
  { term: 'RetryPolicy', cat: 'Runtime', def: 'Per-node retry configuration for transient errors.' },
  { term: 'ToolNode', cat: 'Ecosystem', def: 'Prebuilt node that executes tool calls from the last AI message and returns ToolMessages.' },
  { term: 'tools_condition', cat: 'Ecosystem', def: 'Prebuilt router: "tools" if tool calls exist, else END.' },
  { term: 'create_react_agent', cat: 'Ecosystem', def: 'Prebuilt tool-calling agent graph in langgraph.prebuilt. LangChain v1 adds create_agent with middleware.' },
  { term: 'LangGraph Server', cat: 'Ecosystem', def: 'API server for graphs: assistants, threads, runs, crons, store, streaming, double-texting handling.' },
  { term: 'LangGraph Studio', cat: 'Ecosystem', def: 'Visual IDE for running, debugging and time-traveling graphs.' },
  { term: 'langgraph.json', cat: 'Ecosystem', def: 'Deployment config: dependencies, graphs, env.' },
  { term: 'LangSmith', cat: 'Ecosystem', def: 'Observability, evaluation, prompt management and deployment platform for LLM apps.' },
  { term: 'Runnable', cat: 'LangChain', def: 'LangChain’s universal interface: invoke, batch, stream (+ async). Models, prompts, retrievers and graphs are runnables.' },
  { term: 'LCEL', cat: 'LangChain', def: 'LangChain Expression Language: compose runnables with the pipe operator.', code: 'prompt | model | parser' },
  { term: 'ChatModel', cat: 'LangChain', def: 'Unified interface to LLM providers; supports bind_tools and with_structured_output.', code: 'init_chat_model("anthropic:claude-sonnet-4-5")' },
  { term: '@tool', cat: 'LangChain', def: 'Decorator turning a function into a tool with a JSON schema derived from type hints and docstring.' },
  { term: 'Retriever', cat: 'LangChain', def: 'Runnable that returns documents for a query — usually backed by a vector store.' },
  { term: 'Structured output', cat: 'LangChain', def: 'Force the model to return data matching a Pydantic/Zod/JSON schema.', code: 'llm.with_structured_output(Model)' },
]

export const CHEATSHEET: { title: string; code: string }[] = [
  {
    title: 'Build & run',
    code: `builder = StateGraph(State)
builder.add_node("a", fn_a)
builder.add_edge(START, "a")
builder.add_edge("a", END)
graph = builder.compile()
graph.invoke({"x": 1})`,
  },
  {
    title: 'Reducers',
    code: `class State(TypedDict):
    items: Annotated[list, operator.add]
    messages: Annotated[list, add_messages]`,
  },
  {
    title: 'Conditional routing',
    code: `def route(s) -> Literal["b", "c"]:
    return "b" if s["ok"] else "c"
builder.add_conditional_edges("a", route)`,
  },
  {
    title: 'Command',
    code: `def node(s) -> Command[Literal["b"]]:
    return Command(update={"k": 1}, goto="b")`,
  },
  {
    title: 'Send (map-reduce)',
    code: `builder.add_conditional_edges("plan",
    lambda s: [Send("work", {"i": i}) for i in s["items"]],
    ["work"])`,
  },
  {
    title: 'Persistence',
    code: `graph = builder.compile(checkpointer=InMemorySaver())
cfg = {"configurable": {"thread_id": "1"}}
graph.invoke(inp, cfg)
graph.get_state(cfg)`,
  },
  {
    title: 'Human-in-the-loop',
    code: `ans = interrupt({"question": "ok?"})
# caller:
graph.invoke(Command(resume="yes"), cfg)`,
  },
  {
    title: 'Streaming',
    code: `for chunk, meta in graph.stream(inp, cfg,
        stream_mode="messages"):
    print(chunk.content, end="")`,
  },
  {
    title: 'Time travel',
    code: `h = list(graph.get_state_history(cfg))
fork = graph.update_state(h[2].config, {"k": 9})
graph.invoke(None, fork)`,
  },
  {
    title: 'Long-term store',
    code: `graph = builder.compile(store=InMemoryStore())
runtime.store.put(("mem", uid), "k", {"v": 1})
runtime.store.search(("mem", uid), query="v")`,
  },
  {
    title: 'Prebuilt agent',
    code: `agent = create_react_agent(
    model="anthropic:claude-sonnet-4-5",
    tools=[search], prompt="Be helpful")`,
  },
  {
    title: 'Functional API',
    code: `@task
def step(x): ...
@entrypoint(checkpointer=InMemorySaver())
def wf(x): return step(x).result()`,
  },
]
