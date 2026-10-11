export interface Question {
  q: string
  options: string[]
  answer: number
  explain: string
  topic: string
}

export const QUIZ: Question[] = [
  {
    topic: 'Foundations',
    q: 'What are the three core building blocks of a LangGraph StateGraph?',
    options: ['Prompts, Chains, Parsers', 'State, Nodes, Edges', 'Agents, Tools, Memory', 'Threads, Runs, Assistants'],
    answer: 1,
    explain: 'A graph is defined by a shared State schema, Nodes that do work, and Edges that decide what runs next.',
  },
  {
    topic: 'Foundations',
    q: 'What does a node function return?',
    options: ['The entire new state object', 'A partial update (dict) to merge into state', 'The name of the next node', 'Nothing — it mutates state in place'],
    answer: 1,
    explain: 'Nodes return only the keys they change. Reducers merge those updates into the existing state.',
  },
  {
    topic: 'Reducers',
    q: 'Two parallel nodes both write to the key `results` in the same super-step. What do you need?',
    options: ['A recursion limit', 'A reducer such as operator.add on that key', 'A checkpointer', 'Nothing, the last write wins silently'],
    answer: 1,
    explain: 'With the default overwrite reducer, concurrent writes conflict (InvalidUpdateError). An appending reducer like operator.add merges them.',
  },
  {
    topic: 'Reducers',
    q: 'What is special about the add_messages reducer?',
    options: ['It sorts messages by time', 'It appends, but updates messages with an existing id and supports RemoveMessage', 'It summarizes old messages automatically', 'It only keeps the last message'],
    answer: 1,
    explain: 'add_messages appends new messages, replaces ones with matching ids, coerces dicts into message objects and handles RemoveMessage deletions.',
  },
  {
    topic: 'Runtime',
    q: 'LangGraph’s execution model is inspired by…',
    options: ['MapReduce by Hadoop', 'Pregel / Bulk Synchronous Parallel', 'The actor model in Erlang', 'Unix pipes'],
    answer: 1,
    explain: 'Execution proceeds in super-steps (plan → execute in parallel → update channels), as in Google’s Pregel.',
  },
  {
    topic: 'Control flow',
    q: 'Which API lets you spawn a dynamic number of parallel tasks, each with its own payload?',
    options: ['Command', 'interrupt', 'Send', 'RetryPolicy'],
    answer: 2,
    explain: 'Return a list of Send("node", payload) from a conditional edge to fan out dynamically (map-reduce).',
  },
  {
    topic: 'Control flow',
    q: 'What does returning Command(update={...}, goto="b") from a node do?',
    options: ['Updates state and routes to node b in one step', 'Interrupts the graph', 'Creates a new thread', 'Runs node b in a subgraph'],
    answer: 0,
    explain: 'Command combines a state update with dynamic routing — no separate router function required.',
  },
  {
    topic: 'Multi-agent',
    q: 'How does an agent inside a subgraph hand off to a sibling agent in the parent graph?',
    options: ['Raise an exception', 'Command(goto="sibling", graph=Command.PARENT)', 'Send("sibling", state)', 'interrupt("sibling")'],
    answer: 1,
    explain: 'graph=Command.PARENT tells LangGraph to navigate in the parent graph — the mechanism behind handoffs.',
  },
  {
    topic: 'Persistence',
    q: 'What must you pass in config when invoking a graph compiled with a checkpointer?',
    options: ['api_key', 'thread_id inside "configurable"', 'recursion_limit', 'stream_mode'],
    answer: 1,
    explain: 'config={"configurable": {"thread_id": "..."}} identifies which sequence of checkpoints (thread) to load and save.',
  },
  {
    topic: 'Persistence',
    q: 'When is a checkpoint saved?',
    options: ['Only at the end of a run', 'After every super-step', 'Every 10 seconds', 'Only when interrupt() is called'],
    answer: 1,
    explain: 'Checkpointers persist a StateSnapshot after each super-step, enabling resume, HITL and time travel.',
  },
  {
    topic: 'Memory',
    q: 'Which component stores memories that are shared ACROSS threads (e.g. user preferences)?',
    options: ['Checkpointer', 'Store (e.g. InMemoryStore / PostgresStore)', 'MessagesState', 'ToolNode'],
    answer: 1,
    explain: 'The Store holds long-term, namespaced JSON documents with optional semantic search; checkpointers hold per-thread state.',
  },
  {
    topic: 'HITL',
    q: 'After calling interrupt() in a node, how do you continue the run?',
    options: ['graph.resume()', 'graph.invoke(Command(resume=value), config) with the same thread_id', 'Start a new thread', 'graph.update_state(None)'],
    answer: 1,
    explain: 'Command(resume=...) supplies the value that interrupt() returns when the node re-executes.',
  },
  {
    topic: 'HITL',
    q: 'When a run resumes after an interrupt, where does execution restart?',
    options: ['At the exact line after interrupt()', 'At the beginning of the interrupted node', 'At START', 'At the next node'],
    answer: 1,
    explain: 'The node re-runs from its start; interrupt() then returns the resume value. Keep side effects after the interrupt or idempotent.',
  },
  {
    topic: 'Time travel',
    q: 'How do you FORK a thread from a past checkpoint with modified state?',
    options: ['graph.fork()', 'graph.update_state(old_checkpoint.config, values) then invoke(None, new_config)', 'Delete newer checkpoints', 'Create a new graph'],
    answer: 1,
    explain: 'update_state on an old checkpoint creates a new branch; invoking with None continues from it.',
  },
  {
    topic: 'Streaming',
    q: 'Which stream_mode gives you LLM tokens as they are generated?',
    options: ['values', 'updates', 'messages', 'debug'],
    answer: 2,
    explain: 'stream_mode="messages" yields (message_chunk, metadata) tuples from LLM calls anywhere in the graph.',
  },
  {
    topic: 'Streaming',
    q: 'How do you emit custom progress events from inside a node?',
    options: ['print()', 'get_stream_writer() and stream_mode="custom"', 'Raise a ProgressEvent', 'Return {"__progress__": ...}'],
    answer: 1,
    explain: 'writer = get_stream_writer(); writer({...}) — consumers receive it with stream_mode="custom".',
  },
  {
    topic: 'Functional API',
    q: 'In the Functional API, what happens to completed @task results when a workflow resumes?',
    options: ['They are re-executed', 'They are reused from the checkpoint', 'They are discarded', 'They raise an error'],
    answer: 1,
    explain: 'Task results are checkpointed, so resumed workflows do not repeat completed work.',
  },
  {
    topic: 'Agents',
    q: 'What does the prebuilt tools_condition do?',
    options: ['Validates tool schemas', 'Routes to "tools" if the last AI message has tool calls, else END', 'Executes tools in parallel', 'Retries failing tools'],
    answer: 1,
    explain: 'It is a ready-made router for the agent ⇄ tools loop.',
  },
  {
    topic: 'Ecosystem',
    q: 'Which product is primarily for tracing, debugging and evaluating LLM apps?',
    options: ['LangGraph', 'LangChain Core', 'LangSmith', 'LCEL'],
    answer: 2,
    explain: 'LangSmith provides observability, datasets, evaluations and monitoring — for any framework.',
  },
  {
    topic: 'Ecosystem',
    q: 'Which file configures a LangGraph Server / Platform deployment?',
    options: ['langgraph.yaml', 'langgraph.json', 'graph.toml', 'pyproject.toml only'],
    answer: 1,
    explain: 'langgraph.json declares dependencies, graphs (path:variable) and env for the CLI and Platform.',
  },
  {
    topic: 'Runtime',
    q: 'What protects a looping graph from running forever?',
    options: ['The checkpointer', 'The recursion limit (GraphRecursionError)', 'The Store', 'Streaming'],
    answer: 1,
    explain: 'recursion_limit caps the number of super-steps per run; you can also track iterations in state.',
  },
  {
    topic: 'Design',
    q: 'Best practice for what to keep in state?',
    options: ['Pre-formatted prompts', 'Raw, minimal, serializable data', 'Model client objects', 'Everything, just in case'],
    answer: 1,
    explain: 'Keep raw data in state and format prompts inside nodes; state must be serializable to be checkpointed.',
  },
]
