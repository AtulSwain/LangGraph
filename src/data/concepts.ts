import type { CodeSample } from '../components/CodeBlock'

export interface Concept {
  id: string
  module: string
  title: string
  icon: string
  tagline: string
  why: string
  body: string[]
  analogy?: string
  code?: CodeSample
  codeTitle?: string
  more?: { title: string; text?: string; code: CodeSample }[]
  takeaways: string[]
  pitfalls?: string[]
  diagram?: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
}

export const MODULES = [
  { id: 'foundations', title: 'Foundations', color: '#22d3ee' },
  { id: 'control', title: 'Control Flow', color: '#60a5fa' },
  { id: 'agents', title: 'Tools & Agents', color: '#a78bfa' },
  { id: 'persistence', title: 'Persistence & Memory', color: '#2dd4bf' },
  { id: 'hitl', title: 'Human-in-the-Loop', color: '#f472b6' },
  { id: 'runtime', title: 'Streaming & Runtime', color: '#fbbf24' },
  { id: 'production', title: 'Production', color: '#34d399' },
]

export const CONCEPTS: Concept[] = [
  // ───────────────────────── FOUNDATIONS ─────────────────────────
  {
    id: 'intro',
    module: 'foundations',
    title: 'What is LangGraph?',
    icon: '🌌',
    level: 'Beginner',
    tagline: 'A low-level orchestration framework for building stateful, long-running, controllable AI agents as graphs.',
    why: 'Real agents loop, branch, pause for humans, recover from crashes and remember things. Linear chains can’t express that cleanly — graphs can.',
    body: [
      'LangGraph is an open-source library from the LangChain team (Python: `langgraph`, JavaScript/TypeScript: `@langchain/langgraph`). You describe your application as a **graph**: a shared **State** object, a set of **Nodes** (functions that read the state and return updates), and **Edges** (rules that decide which node runs next).',
      'Unlike a simple “prompt → LLM → answer” chain, a graph can contain **cycles**. Cycles are what make agents possible: an LLM decides to call a tool, the tool runs, the result flows back to the LLM, and the LLM decides again — until it is done.',
      'LangGraph is deliberately **low-level**: it doesn’t hide your prompts or force a cognitive architecture on you. Instead it gives you infrastructure primitives that agents need in production: **persistence** (checkpointers), **durable execution**, **human-in-the-loop** interrupts, **streaming**, **memory**, and **time travel**.',
      'It is inspired by Google’s **Pregel** and Apache Beam: under the hood, nodes run in discrete “super-steps” and communicate through channels. You rarely touch that layer directly, but it explains why parallel branches and checkpoints behave the way they do.',
      'LangGraph does not require LangChain. Your nodes can call any SDK (Anthropic, OpenAI, local models, plain HTTP). Many people still pair it with LangChain for model/tool integrations and with LangSmith for tracing.',
    ],
    analogy:
      'If LangChain components are LEGO bricks, LangGraph is the instruction manual *plus* a save-game system: it says which brick goes next, lets you loop back, and remembers exactly where you were if you stop halfway.',
    code: {
      python: `# pip install -U langgraph
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    text: str

def shout(state: State) -> dict:
    return {"text": state["text"].upper() + "!"}

builder = StateGraph(State)
builder.add_node("shout", shout)
builder.add_edge(START, "shout")
builder.add_edge("shout", END)

graph = builder.compile()
print(graph.invoke({"text": "hello graph"}))
# {'text': 'HELLO GRAPH!'}`,
      js: `// npm install @langchain/langgraph @langchain/core
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

const State = Annotation.Root({
  text: Annotation<string>,
});

const graph = new StateGraph(State)
  .addNode("shout", (state) => ({ text: state.text.toUpperCase() + "!" }))
  .addEdge(START, "shout")
  .addEdge("shout", END)
  .compile();

console.log(await graph.invoke({ text: "hello graph" }));
// { text: 'HELLO GRAPH!' }`,
    },
    codeTitle: 'Your first graph — hello_graph',
    takeaways: [
      'A LangGraph app = State + Nodes + Edges, compiled into a runnable graph.',
      'Cycles make agent loops (think → act → observe → think) first-class.',
      'Built-in production primitives: persistence, interrupts, streaming, memory, time travel.',
      'Works with or without LangChain; available in Python and TypeScript.',
    ],
    diagram: 'sequence',
  },
  {
    id: 'state',
    module: 'foundations',
    title: 'State & Schemas',
    icon: '🧠',
    level: 'Beginner',
    tagline: 'The single shared data structure every node reads from and writes to.',
    why: 'State is the “memory of the run”. Designing it well is the most important decision in a LangGraph app.',
    body: [
      'The first argument to `StateGraph(...)` is the **state schema**. In Python it is usually a `TypedDict`, but `dataclass` and Pydantic `BaseModel` are supported too (Pydantic adds runtime validation at the cost of some speed). In TypeScript you define it with `Annotation.Root({...})` or a Zod schema.',
      'Each key of the state is a **channel**. Nodes receive the full current state and return a **partial update** — only the keys they want to change. LangGraph merges that update into the state using each key’s **reducer** (next lesson). By default, the new value simply overwrites the old.',
      'You can declare separate **input** and **output** schemas so callers only send/receive what they need, while the graph keeps private internal keys: `StateGraph(OverallState, input_schema=InputState, output_schema=OutputState)`.',
      'Keep state **minimal and serializable**: store raw data (messages, ids, documents) rather than formatted prompts. Prompts should be built inside nodes. Serializable state is what allows checkpointing to a database.',
    ],
    analogy: 'State is a shared whiteboard in a meeting room. Each expert (node) walks in, reads the whiteboard, writes their contribution in their section, and leaves.',
    code: {
      python: `from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class InputState(TypedDict):
    question: str

class OutputState(TypedDict):
    answer: str

class OverallState(InputState, OutputState):
    notes: list[str]          # private, internal-only key

def research(state: InputState) -> dict:
    return {"notes": [f"looked up: {state['question']}"]}

def respond(state: OverallState) -> dict:
    return {"answer": f"Based on {len(state['notes'])} note(s): 42"}

builder = StateGraph(OverallState, input_schema=InputState, output_schema=OutputState)
builder.add_node("research", research)
builder.add_node("respond", respond)
builder.add_edge(START, "research")
builder.add_edge("research", "respond")
builder.add_edge("respond", END)

graph = builder.compile()
graph.invoke({"question": "meaning of life?"})
# -> {'answer': 'Based on 1 note(s): 42'}   (notes are hidden from the output)`,
      js: `import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

const State = Annotation.Root({
  question: Annotation<string>,
  notes: Annotation<string[]>,
  answer: Annotation<string>,
});

const graph = new StateGraph(State)
  .addNode("research", (s) => ({ notes: ["looked up: " + s.question] }))
  .addNode("respond", (s) => ({ answer: "Based on " + s.notes.length + " note(s): 42" }))
  .addEdge(START, "research")
  .addEdge("research", "respond")
  .addEdge("respond", END)
  .compile();`,
    },
    codeTitle: 'Input, output and private state',
    takeaways: [
      'State schema = the shape of shared data; each key is a channel.',
      'Nodes return partial updates, never the whole state.',
      'Use input/output schemas to hide internal keys from callers.',
      'Keep state raw & serializable — format prompts inside nodes.',
    ],
    pitfalls: ['Mutating `state` in place inside a node instead of returning an update — the change won’t be recorded reliably.', 'Stuffing huge blobs (PDFs, images) into state; store references instead.'],
  },
  {
    id: 'reducers',
    module: 'foundations',
    title: 'Reducers, Messages & add_messages',
    icon: '🧮',
    level: 'Beginner',
    tagline: 'Reducers decide HOW a node’s update is merged into the existing state.',
    why: 'Without reducers, two parallel nodes writing the same key would clobber each other, and chat history would be overwritten every turn.',
    body: [
      'Every state key has a reducer: a function `(current, update) -> new`. The default reducer is “overwrite”. You attach a custom reducer with `Annotated[type, reducer]` in Python or `{ reducer, default }` in TypeScript.',
      '`operator.add` is the classic list reducer: updates are **appended**. It is essential for fan-in, where several parallel nodes write to the same key in one super-step.',
      'For chat apps use the prebuilt `add_messages` reducer. It appends new messages, but **updates in place** any message whose `id` already exists, and it deletes messages when you return `RemoveMessage(id=...)`. It also coerces dicts like `{"role": "user", "content": "hi"}` into proper message objects.',
      '`MessagesState` is a ready-made schema with a single `messages` key that uses `add_messages`. Subclass it to add your own keys. In JS the equivalent is `MessagesAnnotation`.',
    ],
    analogy: 'A reducer is the rule for a shared notebook: “overwrite the page” (default) vs “add a new line at the bottom” (operator.add) vs “edit a line if it has the same number, otherwise append” (add_messages).',
    code: {
      python: `import operator
from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage
from langgraph.graph import MessagesState
from langgraph.graph.message import add_messages

class State(TypedDict):
    counter: int                                      # overwrite
    logs: Annotated[list[str], operator.add]          # append
    messages: Annotated[list[AnyMessage], add_messages]  # smart chat merge

# Equivalent shortcut for chat apps:
class ChatState(MessagesState):
    user_name: str

def node(state: State) -> dict:
    return {
        "counter": state["counter"] + 1,
        "logs": ["node ran"],                      # appended, not replaced
        "messages": [{"role": "ai", "content": "hi!"}],  # coerced to AIMessage
    }

# A custom reducer is just a function:
def keep_max(current: int, new: int) -> int:
    return max(current, new)

class Scores(TypedDict):
    best: Annotated[int, keep_max]`,
      js: `import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

const State = Annotation.Root({
  ...MessagesAnnotation.spec,                 // messages with smart merge
  counter: Annotation<number>,                // overwrite
  logs: Annotation<string[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),
  best: Annotation<number>({
    reducer: (a, b) => Math.max(a, b),
    default: () => 0,
  }),
});`,
    },
    codeTitle: 'Three kinds of reducers',
    more: [
      {
        title: 'Deleting old messages with RemoveMessage',
        code: {
          python: `from langchain_core.messages import RemoveMessage

def delete_old(state: MessagesState) -> dict:
    # keep only the 4 most recent messages
    return {"messages": [RemoveMessage(id=m.id) for m in state["messages"][:-4]]}`,
        },
      },
    ],
    takeaways: [
      'Default reducer overwrites; `Annotated[..., reducer]` customizes merging.',
      '`operator.add` appends — required when parallel branches write the same key.',
      '`add_messages` appends, updates by id, and supports `RemoveMessage`.',
      '`MessagesState` / `MessagesAnnotation` are the go-to chat schemas.',
    ],
    pitfalls: ['Two parallel nodes writing a key with the default reducer raises an `InvalidUpdateError` — add a reducer.'],
  },
  {
    id: 'nodes',
    module: 'foundations',
    title: 'Nodes',
    icon: '⚙️',
    level: 'Beginner',
    tagline: 'Nodes are plain functions (or runnables) that do the work: call an LLM, run a tool, transform data.',
    why: 'Nodes are where your business logic lives. LangGraph only cares about their inputs and outputs.',
    body: [
      'A node is any Python function / coroutine (or TS function / async function) that takes the **state** and returns a **dict of updates**. Register it with `builder.add_node("name", fn)`; if you omit the name, the function name is used.',
      'Nodes may optionally accept a second argument: `config` (a `RunnableConfig` with `thread_id`, tags, etc.) or the newer `runtime` object that exposes static **context**, the long-term **store** and a **stream writer**.',
      'Nodes can be sync or async. Async nodes let LangGraph run I/O-heavy branches concurrently inside a super-step.',
      'Production-grade options: `retry_policy=RetryPolicy(max_attempts=3)` retries flaky nodes (e.g. rate-limited APIs); `cache_policy` caches results of expensive deterministic nodes; `defer=True` delays a node until all other pending work finishes (useful for fan-in with uneven branch lengths).',
      'Two virtual nodes always exist: `START` (entry point where user input arrives) and `END` (terminal node).',
    ],
    code: {
      python: `from langgraph.graph import StateGraph, MessagesState, START
from langgraph.types import RetryPolicy
from langchain.chat_models import init_chat_model

llm = init_chat_model("anthropic:claude-sonnet-4-5")

def call_model(state: MessagesState) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

async def fetch_weather(state: MessagesState) -> dict:   # async is fine too
    return {"messages": [{"role": "user", "content": "It is 21°C in Paris."}]}

builder = StateGraph(MessagesState)
builder.add_node("fetch_weather", fetch_weather)
builder.add_node(
    "call_model",
    call_model,
    retry_policy=RetryPolicy(max_attempts=3),   # retry flaky LLM calls
)
builder.add_edge(START, "fetch_weather")
builder.add_edge("fetch_weather", "call_model")`,
      js: `import { StateGraph, MessagesAnnotation, START } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";

const llm = new ChatAnthropic({ model: "claude-sonnet-4-5" });

const callModel = async (state: typeof MessagesAnnotation.State) => {
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
};

const builder = new StateGraph(MessagesAnnotation)
  .addNode("call_model", callModel, { retryPolicy: { maxAttempts: 3 } })
  .addEdge(START, "call_model");`,
    },
    codeTitle: 'Defining nodes',
    takeaways: [
      'Node = function(state[, config|runtime]) → partial update.',
      'Sync or async; async enables concurrent I/O within a step.',
      'Retry policies, caching and `defer` harden nodes for production.',
      '`START` and `END` are virtual nodes you connect with edges.',
    ],
    diagram: 'sequence',
  },
  {
    id: 'edges',
    module: 'foundations',
    title: 'Edges: START, END & Normal Edges',
    icon: '➡️',
    level: 'Beginner',
    tagline: 'Edges define the flow: which node runs after which.',
    why: 'Edges turn a bag of functions into a program. Getting them right is how you make flows predictable.',
    body: [
      'A **normal edge** `add_edge("a", "b")` always goes from `a` to `b`. Connect `START` to your first node and your last node(s) to `END`.',
      'If a node has **multiple outgoing edges**, all destinations run **in parallel** in the next super-step (fan-out). If several edges point into one node, that node runs once its sources have completed in the same step (fan-in).',
      'A list of sources in `add_edge(["b", "c"], "d")` creates a *join*: `d` waits until **both** `b` and `c` have finished — handy when branches have different lengths.',
      'There is a shorthand for linear pipelines: `builder.add_sequence([step_1, step_2, step_3])`.',
    ],
    code: {
      python: `builder = StateGraph(State)
builder.add_node("a", a)
builder.add_node("b", b)
builder.add_node("c", c)
builder.add_node("d", d)

builder.add_edge(START, "a")
builder.add_edge("a", "b")      # fan-out: b and c run in parallel
builder.add_edge("a", "c")
builder.add_edge(["b", "c"], "d")  # join: d waits for both
builder.add_edge("d", END)

# Linear shortcut
seq = StateGraph(State)
seq.add_sequence([step_1, step_2, step_3])
seq.add_edge(START, "step_1")`,
      js: `const graph = new StateGraph(State)
  .addNode("a", a).addNode("b", b).addNode("c", c).addNode("d", d)
  .addEdge(START, "a")
  .addEdge("a", "b")
  .addEdge("a", "c")
  .addEdge(["b", "c"], "d")
  .addEdge("d", END)
  .compile();`,
    },
    codeTitle: 'Fan-out and fan-in',
    takeaways: [
      'Normal edges are unconditional transitions.',
      'Multiple outgoing edges ⇒ parallel execution in the next super-step.',
      'Use a list of sources to wait for several branches before continuing.',
      'Every path should eventually reach `END` (or an interrupt).',
    ],
    diagram: 'parallel',
  },
  {
    id: 'conditional-edges',
    module: 'foundations',
    title: 'Conditional Edges & Routing',
    icon: '🔀',
    level: 'Beginner',
    tagline: 'Let a function — often driven by an LLM — choose the next node at runtime.',
    why: 'This is where “agentic” behavior comes from: the path through the graph is decided by data, not hard-coded.',
    body: [
      '`add_conditional_edges(source, routing_fn, path_map)` runs `routing_fn(state)` after `source` finishes. The return value is the name of the next node (or a list of names to run in parallel, or `END`).',
      'The optional **path map** (a list, or a dict mapping return values → node names) tells LangGraph which destinations are possible. That makes the graph renderable/visualizable and catches typos early. Type-hinting the router with `Literal[...]` achieves the same.',
      'A common pattern is an LLM **router**: ask the model (often with structured output) to classify the request, store the label in state, then route on it.',
      'Routers should be **pure and fast** — they shouldn’t mutate state. If you need to update state *and* route in one place, use `Command` (Control Flow module).',
    ],
    code: {
      python: `from typing import Literal, TypedDict
from pydantic import BaseModel
from langgraph.graph import StateGraph, START, END

class Route(BaseModel):
    topic: Literal["billing", "tech", "chat"]

router_llm = llm.with_structured_output(Route)

class State(TypedDict):
    question: str
    topic: str
    answer: str

def classify(state: State) -> dict:
    return {"topic": router_llm.invoke(state["question"]).topic}

def route(state: State) -> Literal["billing", "tech_support", "small_talk"]:
    return {"billing": "billing", "tech": "tech_support"}.get(state["topic"], "small_talk")

builder = StateGraph(State)
builder.add_node("classify", classify)
builder.add_node("billing", billing_agent)
builder.add_node("tech_support", tech_agent)
builder.add_node("small_talk", chat_agent)
builder.add_edge(START, "classify")
builder.add_conditional_edges("classify", route)   # Literal hint = path map
for n in ["billing", "tech_support", "small_talk"]:
    builder.add_edge(n, END)`,
      js: `const route = (state: typeof State.State) => {
  if (state.topic === "billing") return "billing";
  if (state.topic === "tech") return "tech_support";
  return "small_talk";
};

builder.addConditionalEdges("classify", route, ["billing", "tech_support", "small_talk"]);`,
    },
    codeTitle: 'An LLM-powered router',
    takeaways: [
      'Conditional edges pick the next node(s) at runtime from state.',
      'Provide a path map or `Literal` return type for safety & visualization.',
      'Return a list of node names to fan out dynamically.',
      'Structured output makes LLM routing reliable.',
    ],
    diagram: 'conditional',
  },
  {
    id: 'compile',
    module: 'foundations',
    title: 'Compile, Invoke & the Pregel Runtime',
    icon: '🚀',
    level: 'Intermediate',
    tagline: 'compile() validates your graph and turns it into a runnable powered by a Pregel-style engine.',
    why: 'Understanding super-steps explains parallelism, checkpoints and why updates appear when they do.',
    body: [
      '`builder.compile(...)` checks the structure (no orphan nodes, valid edges) and accepts runtime options: `checkpointer`, `store`, `interrupt_before` / `interrupt_after`, `cache`, and `name`. The result implements the standard Runnable interface: `invoke`, `stream`, `batch`, and async `ainvoke` / `astream`.',
      'Execution follows the **Bulk Synchronous Parallel** model from Google’s Pregel. Each **super-step** has three phases: **Plan** (which nodes are triggered by channels that changed?), **Execute** (run all those nodes in parallel; their writes are invisible to each other), **Update** (apply all writes to channels via reducers).',
      'A node is triggered when a channel it subscribes to was updated in the previous step. The run ends when no node is triggered anymore (or `END` is reached).',
      'With a checkpointer, a **checkpoint** is saved after every super-step. That’s why you can resume, replay or inspect any step.',
      'Steps are **transactional**: if any node in a parallel step fails, none of that step’s writes are applied (successful sibling writes are kept as pending writes so they won’t re-run on resume).',
      'Loops are bounded by the **recursion limit** (`config={"recursion_limit": 50}`) which counts super-steps; exceeding it raises `GraphRecursionError`.',
    ],
    analogy: 'Think of a board game played in rounds. In each round every active player moves simultaneously, then the board is updated all at once, then the game is auto-saved. Repeat until nobody can move.',
    code: {
      python: `graph = builder.compile()

# Visualize (Mermaid / PNG)
print(graph.get_graph().draw_mermaid())

# Run to completion
result = graph.invoke({"question": "hi"}, config={"recursion_limit": 50})

# Stream state updates per super-step
for update in graph.stream({"question": "hi"}, stream_mode="updates"):
    print(update)   # {'classify': {'topic': 'chat'}} ... then {'small_talk': {...}}

# Async + batch
await graph.ainvoke({"question": "hi"})
graph.batch([{"question": "a"}, {"question": "b"}])`,
      js: `const graph = builder.compile();

const result = await graph.invoke({ question: "hi" }, { recursionLimit: 50 });

for await (const update of await graph.stream({ question: "hi" }, { streamMode: "updates" })) {
  console.log(update);
}`,
    },
    codeTitle: 'Running a compiled graph',
    takeaways: [
      'compile() validates structure and attaches checkpointer/store/interrupts.',
      'Pregel super-steps: plan → execute in parallel → apply updates.',
      'A checkpoint is written after every super-step.',
      'Recursion limit counts super-steps and protects against infinite loops.',
    ],
    diagram: 'parallel',
  },

  // ───────────────────────── CONTROL FLOW ─────────────────────────
  {
    id: 'command',
    module: 'control',
    title: 'Command: Update + Go-To',
    icon: '🎮',
    level: 'Intermediate',
    tagline: 'Return a Command from a node to update state AND choose the next node in one move.',
    why: 'Removes the need for separate router functions, and powers agent hand-offs in multi-agent systems.',
    body: [
      '`Command(update={...}, goto="node_name")` combines a state update with dynamic routing. Annotate the return type `-> Command[Literal["a", "b"]]` so LangGraph knows the possible destinations (for rendering and validation).',
      'Use `Command` when the routing decision and the data change belong together — e.g. a node that decides to “transfer to billing” and records the reason.',
      'Inside a **subgraph** node, `Command(goto="other_agent", graph=Command.PARENT)` navigates to a node in the parent graph. This is the mechanism behind **handoffs** between agents.',
      '`Command(resume=...)` is also how you resume after an `interrupt()` (see Human-in-the-Loop).',
      'Note: a node returning `Command` still respects static edges you added from it — prefer one mechanism per node to keep flows obvious.',
    ],
    code: {
      python: `from typing import Literal
from langgraph.types import Command

def triage(state: State) -> Command[Literal["billing", "tech_support"]]:
    if "invoice" in state["question"].lower():
        return Command(update={"topic": "billing", "reason": "mentions invoice"}, goto="billing")
    return Command(update={"topic": "tech"}, goto="tech_support")

builder.add_node("triage", triage)    # no conditional edge needed!
builder.add_edge(START, "triage")

# Handoff from inside a sub-agent to a sibling agent in the parent graph
def transfer_to_sales(state):
    return Command(goto="sales_agent", update={"handoff": True}, graph=Command.PARENT)`,
      js: `import { Command } from "@langchain/langgraph";

const triage = (state: typeof State.State) => {
  if (state.question.toLowerCase().includes("invoice")) {
    return new Command({ update: { topic: "billing" }, goto: "billing" });
  }
  return new Command({ update: { topic: "tech" }, goto: "tech_support" });
};

builder.addNode("triage", triage, { ends: ["billing", "tech_support"] });`,
    },
    codeTitle: 'Routing with Command',
    takeaways: [
      '`Command(update=..., goto=...)` = state update + routing in one return value.',
      'Type-hint `Command[Literal[...]]` (Python) or pass `ends` (JS).',
      '`graph=Command.PARENT` jumps from a subgraph to a parent node — the basis of handoffs.',
      '`Command(resume=...)` resumes interrupted runs.',
    ],
    diagram: 'conditional',
  },
  {
    id: 'send',
    module: 'control',
    title: 'Send API & Map-Reduce',
    icon: '📨',
    level: 'Intermediate',
    tagline: 'Spawn a dynamic number of parallel node invocations, each with its own private input.',
    why: 'When you don’t know ahead of time how many items you’ll process (docs, subtopics, files), Send gives you dynamic fan-out.',
    body: [
      'Normal edges fan out to a fixed set of nodes. With `Send(node_name, payload)` returned from a conditional edge, you can create **N parallel tasks** — one per item — where each task receives a custom payload instead of the full state.',
      'The results come back into the shared state through a **reducer** (typically `operator.add`) — the “reduce” half of map-reduce.',
      'Typical uses: summarize each document chunk, research each sub-question, grade each retrieved document, generate several candidate answers.',
      'Sends are executed in the next super-step concurrently; combine with `max_concurrency` in config to throttle.',
    ],
    analogy: 'A head chef (the planning node) writes one ticket per dish and hands each to a line cook (Send). All cooks work at once; the plates come back to the pass (the reducer) to be assembled.',
    code: {
      python: `import operator
from typing import Annotated, TypedDict
from langgraph.types import Send
from langgraph.graph import StateGraph, START, END

class Overall(TypedDict):
    topic: str
    subjects: list[str]
    jokes: Annotated[list[str], operator.add]   # reduce: append results
    best: str

class JokeInput(TypedDict):
    subject: str

def plan(state: Overall):
    return {"subjects": ["cats", "coffee", "compilers"]}

def fan_out(state: Overall):
    return [Send("write_joke", {"subject": s}) for s in state["subjects"]]

def write_joke(item: JokeInput):            # receives its private payload
    return {"jokes": [f"A joke about {item['subject']}"]}

def pick_best(state: Overall):
    return {"best": max(state["jokes"], key=len)}

b = StateGraph(Overall)
b.add_node("plan", plan)
b.add_node("write_joke", write_joke)
b.add_node("pick_best", pick_best)
b.add_edge(START, "plan")
b.add_conditional_edges("plan", fan_out, ["write_joke"])
b.add_edge("write_joke", "pick_best")
b.add_edge("pick_best", END)
graph = b.compile()`,
      js: `import { Send } from "@langchain/langgraph";

const fanOut = (state: typeof Overall.State) =>
  state.subjects.map((subject) => new Send("write_joke", { subject }));

builder.addConditionalEdges("plan", fanOut, ["write_joke"]);`,
    },
    codeTitle: 'Map-reduce with Send',
    takeaways: [
      '`Send(node, payload)` creates dynamic parallel tasks.',
      'Each task gets its own input, not the whole state.',
      'Results merge back via a reducer such as `operator.add`.',
      'Perfect for per-document / per-subtask processing.',
    ],
    diagram: 'mapReduce',
  },
  {
    id: 'subgraphs',
    module: 'control',
    title: 'Subgraphs',
    icon: '🪆',
    level: 'Intermediate',
    tagline: 'Use a compiled graph as a node inside another graph — composition for big systems.',
    why: 'Subgraphs let teams build agents independently, reuse them, and give each its own private state.',
    body: [
      '**Shared-schema subgraph**: if parent and child share state keys (e.g. both use `messages`), add the compiled child directly: `parent.add_node("research", research_graph)`. Shared keys flow in and out automatically.',
      '**Different-schema subgraph**: wrap the call in a node function that transforms parent state → child input, invokes the child, and maps the output back.',
      'Persistence propagates: compile the parent with a checkpointer and subgraphs inherit it. Interrupts inside subgraphs work, and you can inspect subgraph state with `graph.get_state(config, subgraphs=True)`.',
      'Stream from inside subgraphs with `graph.stream(..., subgraphs=True)` — events are tagged with a namespace tuple showing where they came from.',
    ],
    code: {
      python: `# ---- child graph with its own private keys ----
class ChildState(TypedDict):
    query: str
    docs: list[str]
    summary: str

child = StateGraph(ChildState)
child.add_node("fetch", lambda s: {"docs": [f"doc about {s['query']}"]})
child.add_node("summarize", lambda s: {"summary": " | ".join(s["docs"])})
child.add_edge(START, "fetch")
child.add_edge("fetch", "summarize")
research_graph = child.compile()

# ---- parent graph with a different schema ----
class ParentState(TypedDict):
    question: str
    report: str

def call_research(state: ParentState) -> dict:
    out = research_graph.invoke({"query": state["question"]})   # map in
    return {"report": out["summary"]}                            # map out

parent = StateGraph(ParentState)
parent.add_node("research", call_research)
parent.add_edge(START, "research")
graph = parent.compile(checkpointer=InMemorySaver())  # child inherits it

for ns, chunk in graph.stream({"question": "LangGraph"}, config, subgraphs=True):
    print(ns, chunk)`,
    },
    codeTitle: 'Composing graphs',
    takeaways: [
      'A compiled graph can be a node.',
      'Shared keys → add directly; different schemas → wrap in a function.',
      'Checkpointers propagate; inspect with `subgraphs=True`.',
      'Subgraphs are the building block of multi-agent and team architectures.',
    ],
    diagram: 'subgraph',
  },
  {
    id: 'loops',
    module: 'control',
    title: 'Loops, Cycles & Recursion Limits',
    icon: '🔁',
    level: 'Intermediate',
    tagline: 'Cycles are LangGraph’s superpower — and they need guard rails.',
    why: 'Self-correcting agents (generate → critique → regenerate) are loops. Unbounded loops burn tokens and money.',
    body: [
      'Create a loop by routing back to an earlier node via a normal or conditional edge. Always define a **termination condition** that routes to `END` — e.g. “no more tool calls”, “quality score ≥ 8”, or “max 3 iterations”.',
      'Store an iteration counter in state for explicit control. As a safety net, the **recursion limit** caps the number of super-steps per run; when exceeded, `GraphRecursionError` is raised.',
      'You can read the remaining budget at runtime (`RemainingSteps` managed value) to wrap up gracefully before the limit, instead of crashing.',
    ],
    code: {
      python: `from typing import Annotated, TypedDict
from langgraph.managed import RemainingSteps
from langgraph.errors import GraphRecursionError

class State(TypedDict):
    draft: str
    score: int
    iterations: int
    remaining_steps: RemainingSteps     # injected by LangGraph

def should_continue(state: State):
    if state["score"] >= 8 or state["iterations"] >= 3:
        return END
    if state["remaining_steps"] <= 2:   # graceful stop near the limit
        return END
    return "improve"

builder.add_conditional_edges("critique", should_continue, ["improve", END])
builder.add_edge("improve", "critique")      # <- the cycle

try:
    graph.invoke(inputs, {"recursion_limit": 12})
except GraphRecursionError:
    print("Loop ran too long!")`,
    },
    codeTitle: 'A bounded refinement loop',
    takeaways: [
      'Loops = edges that point backwards.',
      'Always have an explicit exit condition.',
      'Recursion limit = safety net counting super-steps.',
      '`RemainingSteps` lets nodes finish gracefully.',
    ],
    diagram: 'reflection',
  },

  // ───────────────────────── TOOLS & AGENTS ─────────────────────────
  {
    id: 'tools',
    module: 'agents',
    title: 'Tool Calling & ToolNode',
    icon: '🛠️',
    level: 'Beginner',
    tagline: 'Give the LLM functions it can call — and a node that executes them.',
    why: 'Tools let agents act in the world: search, query databases, call APIs, run code.',
    body: [
      'Define tools with LangChain’s `@tool` decorator (the docstring and type hints become the schema the model sees). Bind them to the model with `llm.bind_tools(tools)` so the model can emit **tool calls**.',
      'The prebuilt `ToolNode(tools)` reads the last AI message, executes every requested tool call (in parallel), and returns `ToolMessage`s with the results. It also catches tool errors and reports them back to the model by default.',
      'The prebuilt `tools_condition` router sends the flow to the `"tools"` node if the last AI message contains tool calls, otherwise to `END`.',
      'Wiring `agent → tools → agent` gives you the classic **ReAct loop**: reason, act, observe, repeat.',
    ],
    code: {
      python: `from langchain_core.tools import tool
from langgraph.graph import StateGraph, MessagesState, START
from langgraph.prebuilt import ToolNode, tools_condition

@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    return f"It's always sunny in {city}!"

@tool
def multiply(a: int, b: int) -> int:
    """Multiply two integers."""
    return a * b

tools = [get_weather, multiply]
llm_with_tools = llm.bind_tools(tools)

def agent(state: MessagesState):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

builder = StateGraph(MessagesState)
builder.add_node("agent", agent)
builder.add_node("tools", ToolNode(tools))
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", tools_condition)  # -> "tools" or END
builder.add_edge("tools", "agent")                        # loop back
graph = builder.compile()

graph.invoke({"messages": [{"role": "user", "content": "Weather in Paris? Also 6*7"}]})`,
      js: `import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { StateGraph, MessagesAnnotation, START } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

const getWeather = tool(async ({ city }) => "It's always sunny in " + city + "!", {
  name: "get_weather",
  description: "Get the current weather for a city.",
  schema: z.object({ city: z.string() }),
});

const tools = [getWeather];
const model = llm.bindTools(tools);

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", async (s) => ({ messages: [await model.invoke(s.messages)] }))
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "agent")
  .addConditionalEdges("agent", toolsCondition)
  .addEdge("tools", "agent")
  .compile();`,
    },
    codeTitle: 'A ReAct agent from scratch',
    takeaways: [
      '`@tool` + `bind_tools` let the model request tool calls.',
      '`ToolNode` executes calls and returns `ToolMessage`s.',
      '`tools_condition` routes to tools or END.',
      'agent ⇄ tools is the canonical agent loop.',
    ],
    diagram: 'react',
  },
  {
    id: 'prebuilt-agents',
    module: 'agents',
    title: 'Prebuilt Agents',
    icon: '🤖',
    level: 'Beginner',
    tagline: 'Get a production-ready tool-calling agent in a few lines — built on LangGraph.',
    why: 'Most projects start with a standard agent loop. Prebuilts give you that instantly, with persistence, streaming and HITL included.',
    body: [
      'LangGraph ships `create_react_agent` in `langgraph.prebuilt`. It builds exactly the agent ⇄ tools loop from the previous lesson, and accepts a model (object or `"provider:model"` string), tools, a `prompt`, an optional `response_format` for structured final answers, a `checkpointer` and a `store`.',
      'In LangChain v1, the recommended high-level entry point is `langchain.agents.create_agent`, which runs on the LangGraph runtime and adds **middleware** hooks (e.g. summarization, human-in-the-loop approval, PII redaction) around model and tool calls.',
      'Because the result is a compiled LangGraph graph, everything you learn here — streaming modes, checkpointers, interrupts, time travel, deployment — works with prebuilt agents too.',
      'Start with a prebuilt; drop down to a custom `StateGraph` when you need custom state, routing or multi-step workflows.',
    ],
    code: {
      python: `from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import InMemorySaver

agent = create_react_agent(
    model="anthropic:claude-sonnet-4-5",
    tools=[get_weather, multiply],
    prompt="You are a concise, helpful assistant.",
    checkpointer=InMemorySaver(),
)

config = {"configurable": {"thread_id": "user-42"}}
agent.invoke({"messages": [{"role": "user", "content": "Weather in Tokyo?"}]}, config)
agent.invoke({"messages": [{"role": "user", "content": "And what did I just ask?"}]}, config)

# LangChain v1 high-level API (runs on LangGraph)
from langchain.agents import create_agent
agent2 = create_agent(model="anthropic:claude-sonnet-4-5", tools=[get_weather],
                      system_prompt="You are a helpful assistant.")`,
      js: `import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";

const agent = createReactAgent({
  llm,
  tools: [getWeather],
  checkpointSaver: new MemorySaver(),
});

await agent.invoke(
  { messages: [{ role: "user", content: "Weather in Tokyo?" }] },
  { configurable: { thread_id: "user-42" } },
);`,
    },
    codeTitle: 'One-liner agents',
    takeaways: [
      '`create_react_agent` (LangGraph) / `create_agent` (LangChain v1) = instant agent loop.',
      'The output is a normal compiled graph — all LangGraph features apply.',
      'Use `response_format` for structured final outputs.',
      'Graduate to custom graphs when your flow needs it.',
    ],
    diagram: 'react',
  },
  {
    id: 'multi-agent',
    module: 'agents',
    title: 'Multi-Agent Systems & Handoffs',
    icon: '👥',
    level: 'Advanced',
    tagline: 'Split a complex job across specialized agents that collaborate.',
    why: 'One giant agent with 40 tools gets confused. Several focused agents with clear responsibilities are easier to prompt, test and scale.',
    body: [
      '**Supervisor**: a central router agent decides which worker acts next; workers report back. Clear control, easy to debug. (`langgraph-supervisor` package provides `create_supervisor`.)',
      '**Swarm / Network**: agents hand off directly to each other using handoff tools; the system remembers which agent was last active. Fewer hops, more autonomy. (`langgraph-swarm` provides `create_swarm`.)',
      '**Hierarchical**: supervisors of supervisors — each team is a subgraph.',
      '**Handoffs** are implemented with `Command(goto=agent_name, update=..., graph=Command.PARENT)` — typically returned from a tool the LLM calls (e.g. `transfer_to_billing`).',
      'Decide what context each agent sees: full shared message history (simple, can get noisy) vs. only its own scratchpad plus a final summary (cleaner, cheaper).',
    ],
    code: {
      python: `# pip install langgraph-supervisor
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor

researcher = create_react_agent(model=llm, tools=[web_search], name="researcher",
                                prompt="You find facts. Do not do math.")
mathematician = create_react_agent(model=llm, tools=[add, multiply], name="math_expert",
                                   prompt="You only do math.")

workflow = create_supervisor(
    [researcher, mathematician],
    model=llm,
    prompt="You manage a researcher and a math expert. Delegate appropriately.",
)
app = workflow.compile()

app.invoke({"messages": [{"role": "user",
    "content": "What's the combined headcount of the FAANG companies in 2024?"}]})`,
      js: `import { createSupervisor } from "@langchain/langgraph-supervisor";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const researcher = createReactAgent({ llm, tools: [webSearch], name: "researcher" });
const mathematician = createReactAgent({ llm, tools: [add, multiply], name: "math_expert" });

const app = createSupervisor({ agents: [researcher, mathematician], llm }).compile();`,
    },
    codeTitle: 'Supervisor in 15 lines',
    more: [
      {
        title: 'A handoff tool (custom swarm-style)',
        code: {
          python: `from typing import Annotated
from langchain_core.tools import tool, InjectedToolCallId
from langgraph.prebuilt import InjectedState
from langgraph.types import Command

def make_handoff(agent_name: str):
    @tool(f"transfer_to_{agent_name}")
    def handoff(state: Annotated[dict, InjectedState],
                tool_call_id: Annotated[str, InjectedToolCallId]):
        """Transfer the conversation to another agent."""
        msg = {"role": "tool", "content": f"Transferred to {agent_name}",
               "name": f"transfer_to_{agent_name}", "tool_call_id": tool_call_id}
        return Command(goto=agent_name, graph=Command.PARENT,
                       update={"messages": state["messages"] + [msg]})
    return handoff`,
        },
      },
    ],
    takeaways: [
      'Supervisor = central control; Swarm = peer-to-peer handoffs; Hierarchical = teams of teams.',
      'Handoffs are `Command(goto=..., graph=Command.PARENT)`.',
      'Specialized agents with few tools outperform one mega-agent.',
      'Design context sharing deliberately.',
    ],
    diagram: 'supervisor',
  },

  // ───────────────────────── PERSISTENCE ─────────────────────────
  {
    id: 'checkpointers',
    module: 'persistence',
    title: 'Checkpointers & Threads',
    icon: '💾',
    level: 'Intermediate',
    tagline: 'Persist the graph state after every super-step so runs can pause, resume and remember.',
    why: 'Persistence unlocks conversational memory, human-in-the-loop, fault tolerance and time travel — all at once.',
    body: [
      'Pass a checkpointer to `compile(checkpointer=...)`. Available savers: `InMemorySaver` (dev/testing), `SqliteSaver` (`langgraph-checkpoint-sqlite`), `PostgresSaver` (`langgraph-checkpoint-postgres`), plus community/partner savers (Redis, MongoDB, …). LangGraph Platform manages persistence for you.',
      'Every invocation must include a **thread id**: `config = {"configurable": {"thread_id": "abc"}}`. A **thread** is a sequence of checkpoints — think “one conversation” or “one ticket”.',
      'A **checkpoint** is a `StateSnapshot`: `values` (the state), `next` (nodes to run next), `config` (incl. `checkpoint_id`), `metadata` (step number, source, writes), `created_at`, `parent_config` and pending `tasks` (incl. interrupts).',
      'Read with `graph.get_state(config)` and `graph.get_state_history(config)`. Modify with `graph.update_state(config, values, as_node=...)` — the update goes through reducers just like a node’s output.',
      'Re-invoking a thread continues from its latest checkpoint — that’s how short-term chat memory works for free.',
    ],
    analogy: 'Checkpoints are save points in a video game. The thread is your save slot. You can load any previous save, or keep playing from the latest one.',
    code: {
      python: `from langgraph.checkpoint.memory import InMemorySaver
# from langgraph.checkpoint.postgres import PostgresSaver   # production

graph = builder.compile(checkpointer=InMemorySaver())
config = {"configurable": {"thread_id": "conversation-1"}}

graph.invoke({"messages": [{"role": "user", "content": "Hi, I'm Ada"}]}, config)
graph.invoke({"messages": [{"role": "user", "content": "What's my name?"}]}, config)
# -> the model answers "Ada" because the thread remembers

snapshot = graph.get_state(config)
print(snapshot.values["messages"][-1].content)
print(snapshot.next)                  # () when the run finished
for cp in graph.get_state_history(config):
    print(cp.metadata["step"], cp.next)

# Postgres in production
# with PostgresSaver.from_conn_string(DB_URI) as saver:
#     saver.setup()
#     graph = builder.compile(checkpointer=saver)`,
      js: `import { MemorySaver } from "@langchain/langgraph";

const graph = builder.compile({ checkpointer: new MemorySaver() });
const config = { configurable: { thread_id: "conversation-1" } };

await graph.invoke({ messages: [{ role: "user", content: "Hi, I'm Ada" }] }, config);
const snapshot = await graph.getState(config);`,
    },
    codeTitle: 'Threads & state snapshots',
    takeaways: [
      'Checkpointer + `thread_id` = persistent, resumable runs.',
      'One checkpoint per super-step, stored as a `StateSnapshot`.',
      '`get_state`, `get_state_history`, `update_state` let you inspect & edit.',
      'Use Postgres/SQLite (or the Platform) in production; InMemory only for dev.',
    ],
    pitfalls: ['Forgetting `thread_id` in the config — persistent graphs require it.', 'Using `InMemorySaver` in production: everything is lost on restart.'],
  },
  {
    id: 'short-memory',
    module: 'persistence',
    title: 'Short-Term Memory: Managing Context',
    icon: '📝',
    level: 'Intermediate',
    tagline: 'Thread-scoped memory is the message history — keep it within the context window.',
    why: 'Long conversations exceed token limits, slow models down and increase cost. You need a strategy.',
    body: [
      'Short-term memory = the state persisted on a thread (usually `messages`). It’s automatic once you have a checkpointer.',
      '**Trim**: before calling the model, cut history to the last N tokens with `trim_messages` (keeps valid message boundaries such as starting on a human message).',
      '**Delete**: permanently remove old messages from state using `RemoveMessage` with the `add_messages` reducer.',
      '**Summarize**: when history grows, ask an LLM to summarize older messages, store the summary in a `summary` key, and delete what was summarized. Prebuilt helpers like `SummarizationNode` (langmem) or summarization middleware (LangChain v1) automate this.',
      'Choose based on the task: trimming is cheap but forgetful; summarization preserves meaning at the cost of an extra LLM call.',
    ],
    code: {
      python: `from langchain_core.messages import trim_messages, RemoveMessage, SystemMessage

def call_model(state: MessagesState):
    window = trim_messages(
        state["messages"],
        strategy="last",
        token_counter=llm,        # count tokens with the model's tokenizer
        max_tokens=2_000,
        start_on="human",
        include_system=True,
    )
    return {"messages": [llm.invoke(window)]}

class State(MessagesState):
    summary: str

def summarize(state: State):
    prior = state.get("summary", "")
    prompt = f"Current summary: {prior}\\nExtend it with the new messages above."
    new_summary = llm.invoke(state["messages"] + [SystemMessage(prompt)])
    # keep the 2 newest messages, delete the rest
    deletes = [RemoveMessage(id=m.id) for m in state["messages"][:-2]]
    return {"summary": new_summary.content, "messages": deletes}`,
    },
    codeTitle: 'Trim, delete, summarize',
    takeaways: [
      'Short-term memory lives in the thread’s checkpointed state.',
      'Trim for cheap context control.',
      'Delete with `RemoveMessage`; summarize to preserve meaning.',
      'Always budget the context window.',
    ],
  },
  {
    id: 'long-memory',
    module: 'persistence',
    title: 'Long-Term Memory: The Store',
    icon: '🗄️',
    level: 'Advanced',
    tagline: 'Remember facts across threads: user preferences, learned instructions, past episodes.',
    why: 'Checkpointers remember one conversation. A Store remembers a user (or an org) forever.',
    body: [
      'A **Store** is a JSON document database organized by **namespaces** (tuples like `("memories", user_id)`) and **keys**. Pass it at compile time: `compile(checkpointer=..., store=store)`.',
      'API: `store.put(namespace, key, value)`, `store.get(namespace, key)`, `store.search(namespace, query=..., filter=..., limit=...)`, `store.delete(...)`.',
      'Enable **semantic search** by configuring an embedding index: `InMemoryStore(index={"embed": embeddings, "dims": 1536})`. Postgres-backed stores (and the Platform) support this in production.',
      'Memory types from cognitive science: **semantic** (facts: “Ada is vegetarian”), **episodic** (past experiences / few-shot examples), **procedural** (instructions — e.g. the agent rewriting its own system prompt).',
      'Write memories “in the hot path” (the agent calls a save-memory tool during the chat) or “in the background” (a separate job extracts memories after the conversation). The `langmem` library offers helpers for both.',
    ],
    code: {
      python: `from dataclasses import dataclass
from langgraph.store.memory import InMemoryStore
from langgraph.runtime import Runtime

store = InMemoryStore()   # add index={"embed": ..., "dims": ...} for semantic search

@dataclass
class Context:
    user_id: str

def recall_and_chat(state: MessagesState, runtime: Runtime[Context]):
    ns = ("memories", runtime.context.user_id)
    memories = runtime.store.search(ns, query=state["messages"][-1].content, limit=3)
    facts = "\\n".join(m.value["fact"] for m in memories)
    reply = llm.invoke([{"role": "system", "content": f"Known about user:\\n{facts}"}]
                       + state["messages"])
    return {"messages": [reply]}

def remember(state: MessagesState, runtime: Runtime[Context]):
    ns = ("memories", runtime.context.user_id)
    runtime.store.put(ns, "food", {"fact": "User loves spicy ramen"})
    return {}

builder = StateGraph(MessagesState, context_schema=Context)
builder.add_node("chat", recall_and_chat)
builder.add_node("remember", remember)
builder.add_edge(START, "chat")
builder.add_edge("chat", "remember")
graph = builder.compile(checkpointer=InMemorySaver(), store=store)

graph.invoke({"messages": [{"role": "user", "content": "Suggest dinner"}]},
             {"configurable": {"thread_id": "t1"}}, context={"user_id": "ada"})`,
      js: `import { InMemoryStore } from "@langchain/langgraph";

const store = new InMemoryStore();
await store.put(["memories", "ada"], "food", { fact: "User loves spicy ramen" });
const items = await store.search(["memories", "ada"], { query: "dinner", limit: 3 });

const graph = builder.compile({ checkpointer, store });`,
    },
    codeTitle: 'Cross-thread memory with a Store',
    takeaways: [
      'Store = long-term, cross-thread memory keyed by namespace + key.',
      'Semantic search via an embedding index.',
      'Semantic, episodic and procedural memory types.',
      'Write in the hot path or in the background.',
    ],
    diagram: 'memory',
  },
  {
    id: 'time-travel',
    module: 'persistence',
    title: 'Time Travel: Replay & Fork',
    icon: '⏳',
    level: 'Advanced',
    tagline: 'Rewind to any checkpoint, inspect it, change it, and explore an alternate timeline.',
    why: 'Debugging non-deterministic LLM apps is hard. Time travel lets you reproduce, tweak and compare runs.',
    body: [
      '**Replay**: get the history, pick a checkpoint, and invoke with its config: `graph.invoke(None, checkpoint.config)`. Steps *before* that checkpoint are replayed from saved state (not re-executed); steps after it are executed fresh.',
      '**Fork**: call `graph.update_state(checkpoint.config, {"topic": "new value"})` — this creates a *new* checkpoint branching from the old one. Then `graph.invoke(None, new_config)` runs the alternate future.',
      'The original timeline is never destroyed — history is append-only. LangGraph Studio exposes all of this visually.',
    ],
    analogy: 'It’s “undo + edit history” for your agent — like going back in a Git history, creating a branch, and changing one commit to see what would happen.',
    code: {
      python: `config = {"configurable": {"thread_id": "story-1"}}
graph.invoke({"topic": "cats"}, config)

history = list(graph.get_state_history(config))   # newest first
for cp in history:
    print(cp.config["configurable"]["checkpoint_id"], cp.next, cp.values.get("topic"))

# pick the checkpoint right before "write_joke" ran
before_joke = next(cp for cp in history if cp.next == ("write_joke",))

# 1) REPLAY from there
graph.invoke(None, before_joke.config)

# 2) FORK: change the past, then continue
fork_config = graph.update_state(before_joke.config, values={"topic": "dogs"})
graph.invoke(None, fork_config)`,
    },
    codeTitle: 'Replaying and forking',
    takeaways: [
      '`get_state_history` lists every checkpoint of a thread.',
      'Invoke with a checkpoint’s config to replay from it.',
      '`update_state` on an old checkpoint creates a fork.',
      'History is append-only — nothing is lost.',
    ],
  },

  // ───────────────────────── HITL ─────────────────────────
  {
    id: 'interrupts',
    module: 'hitl',
    title: 'interrupt() & Resuming with Command',
    icon: '✋',
    level: 'Intermediate',
    tagline: 'Pause a graph mid-node, wait (minutes or months) for a human, then continue exactly where you left off.',
    why: 'High-stakes actions — payments, emails, database writes — need human approval. Agents also need clarifications.',
    body: [
      'Call `interrupt(payload)` inside a node. The graph saves a checkpoint and stops; the payload (any JSON-serializable value) is surfaced to the caller under the `__interrupt__` key of the result / stream.',
      'Resume with `graph.invoke(Command(resume=value), config)` using the **same thread id**. The value becomes the return value of `interrupt()` inside the node.',
      'Requires a **checkpointer** — the paused state has to be stored somewhere. Because state is persisted, the human can answer days later, from another server.',
      '⚠️ On resume, the node **re-executes from the beginning** (not from the interrupt line). Keep side effects *after* the interrupt or make them idempotent. Multiple `interrupt()` calls in one node are matched to resume values by order.',
      'Static breakpoints — `compile(interrupt_before=["node"])` / `interrupt_after` — pause at node boundaries, mostly for debugging. Dynamic `interrupt()` is recommended for real HITL.',
    ],
    code: {
      python: `from typing import Literal
from langgraph.types import interrupt, Command
from langgraph.checkpoint.memory import InMemorySaver

def human_approval(state: State) -> Command[Literal["execute", "revise"]]:
    decision = interrupt({
        "question": "Approve this refund?",
        "action": state["proposed_action"],
    })
    if decision["approved"]:
        return Command(goto="execute")
    return Command(goto="revise", update={"feedback": decision.get("note", "")})

graph = builder.compile(checkpointer=InMemorySaver())
config = {"configurable": {"thread_id": "refund-981"}}

result = graph.invoke({"request": "Refund order #981"}, config)
print(result["__interrupt__"])
# [Interrupt(value={'question': 'Approve this refund?', 'action': ...})]

# ...later, after a human clicks "Approve" in your UI:
graph.invoke(Command(resume={"approved": True}), config)`,
      js: `import { interrupt, Command, MemorySaver } from "@langchain/langgraph";

const humanApproval = (state: typeof State.State) => {
  const decision = interrupt({ question: "Approve this refund?", action: state.proposedAction });
  return decision.approved
    ? new Command({ goto: "execute" })
    : new Command({ goto: "revise", update: { feedback: decision.note ?? "" } });
};

const graph = builder.compile({ checkpointer: new MemorySaver() });
const config = { configurable: { thread_id: "refund-981" } };
await graph.invoke({ request: "Refund order #981" }, config);
await graph.invoke(new Command({ resume: { approved: true } }), config);`,
    },
    codeTitle: 'Approve-or-reject with interrupt',
    takeaways: [
      '`interrupt(payload)` pauses and surfaces `__interrupt__` to the caller.',
      '`Command(resume=value)` + same thread_id continues the run.',
      'Needs a checkpointer; can wait indefinitely.',
      'The interrupted node re-runs from its start on resume — mind side effects.',
    ],
    pitfalls: ['Wrapping `interrupt()` in a bare `try/except` — it works by raising a special exception, so don’t swallow it.', 'Doing a non-idempotent API call *before* the interrupt in the same node.'],
    diagram: 'hitl',
  },
  {
    id: 'hitl-patterns',
    module: 'hitl',
    title: 'Human-in-the-Loop Design Patterns',
    icon: '🧑‍⚖️',
    level: 'Intermediate',
    tagline: 'Approve/reject, edit state, review tool calls, and ask for clarification.',
    why: 'Different products need different kinds of human oversight. These four patterns cover almost all of them.',
    body: [
      '**Approve / Reject**: pause before a critical step; route to execute or to an alternative path (previous lesson).',
      '**Edit state**: show the human a draft (an email, SQL query, plan), let them edit, and resume with the corrected value: `edited = interrupt({"draft": d}); return {"draft": edited}`.',
      '**Review tool calls**: interrupt inside a tool (or a node before ToolNode) so the human can accept, edit the arguments, or respond instead of executing. LangChain v1 offers human-in-the-loop middleware that does this for chosen tools.',
      '**Validate input / clarify**: loop `interrupt()` until the human gives a valid answer (“How many tickets? → must be a positive integer”).',
      'Your UI is responsible for rendering the interrupt payload and posting the resume value — the LangGraph Platform/SDK and Agent Chat UI make this easy.',
    ],
    code: {
      python: `# Edit-state pattern
def review_email(state: State):
    edited = interrupt({"instruction": "Edit the email if needed", "draft": state["email"]})
    return {"email": edited}

# Tool-call review pattern (interrupt inside the tool)
@tool
def book_hotel(hotel: str, nights: int) -> str:
    """Book a hotel."""
    response = interrupt({"tool": "book_hotel", "args": {"hotel": hotel, "nights": nights}})
    if response["type"] == "accept":
        pass
    elif response["type"] == "edit":
        hotel, nights = response["args"]["hotel"], response["args"]["nights"]
    else:
        return "User declined the booking."
    return f"Booked {nights} night(s) at {hotel}."

# Validation loop pattern
def ask_age(state: State):
    question = "What is your age?"
    while True:
        answer = interrupt(question)
        if isinstance(answer, int) and answer > 0:
            return {"age": answer}
        question = f"'{answer}' is not valid. Please enter a positive number."`,
    },
    codeTitle: 'Four HITL patterns',
    takeaways: [
      'Approve/reject, edit, review tool calls, validate input.',
      'Interrupt payloads are your UI contract — design them clearly.',
      'Tool-level interrupts give fine-grained control over risky actions.',
      'Combine with time travel for powerful debugging UIs.',
    ],
    diagram: 'hitl',
  },

  // ───────────────────────── RUNTIME ─────────────────────────
  {
    id: 'streaming',
    module: 'runtime',
    title: 'Streaming',
    icon: '🌊',
    level: 'Intermediate',
    tagline: 'Stream state updates, LLM tokens and custom progress events to your UI in real time.',
    why: 'Agents can take many seconds. Streaming makes apps feel instant and shows users what’s happening.',
    body: [
      '`stream_mode="values"` — the full state after each super-step.',
      '`stream_mode="updates"` — only the deltas each node returned (`{node_name: update}`).',
      '`stream_mode="messages"` — LLM tokens as `(message_chunk, metadata)` tuples, from *any* LLM call inside any node; metadata tells you which node emitted it (`langgraph_node`).',
      '`stream_mode="custom"` — arbitrary data you emit with `get_stream_writer()` (progress bars, tool status, partial results).',
      '`stream_mode="debug"` — maximum detail for troubleshooting. Pass a list to combine modes; you then receive `(mode, chunk)` tuples. Add `subgraphs=True` to include events from nested graphs.',
    ],
    code: {
      python: `from langgraph.config import get_stream_writer

def research(state):
    writer = get_stream_writer()
    writer({"status": "searching the web…", "progress": 0.3})
    docs = search(state["question"])
    writer({"status": f"found {len(docs)} docs", "progress": 0.7})
    return {"docs": docs}

# Tokens as they're generated
for chunk, meta in graph.stream(inputs, config, stream_mode="messages"):
    if meta["langgraph_node"] == "agent" and chunk.content:
        print(chunk.content, end="", flush=True)

# Several modes at once
for mode, data in graph.stream(inputs, config, stream_mode=["updates", "custom"]):
    print(mode, data)

# Async
async for event in graph.astream(inputs, config, stream_mode="updates"):
    ...`,
      js: `for await (const [chunk, meta] of await graph.stream(inputs, { ...config, streamMode: "messages" })) {
  if (meta.langgraph_node === "agent") process.stdout.write(String(chunk.content));
}

for await (const [mode, data] of await graph.stream(inputs, { streamMode: ["updates", "custom"] })) {
  console.log(mode, data);
}`,
    },
    codeTitle: 'Streaming modes',
    takeaways: [
      'values = full state; updates = deltas; messages = tokens; custom = your events; debug = everything.',
      'Combine modes with a list → `(mode, chunk)` tuples.',
      '`get_stream_writer()` emits custom events from nodes and tools.',
      '`subgraphs=True` streams nested graphs too.',
    ],
  },
  {
    id: 'runtime-context',
    module: 'runtime',
    title: 'Configuration & Runtime Context',
    icon: '🎛️',
    level: 'Intermediate',
    tagline: 'Pass run-time parameters (user id, model choice, API keys) without polluting the graph state.',
    why: 'The same graph serves many users and settings. Context keeps those knobs out of state and out of your prompts.',
    body: [
      '**State** = data that evolves during a run. **Context / config** = static inputs for this run (who is the user, which model, which tenant DB).',
      'Declare a `context_schema` on the builder and pass `context={...}` when invoking. Nodes read it via the `runtime: Runtime[Context]` parameter, which also exposes `runtime.store` and `runtime.stream_writer`.',
      'The classic `config["configurable"]` dict still carries persistence identifiers like `thread_id` and `checkpoint_id`, plus tags/metadata for tracing.',
      'Common uses: choosing a model per request, per-user system prompts, multi-tenant credentials, feature flags.',
    ],
    code: {
      python: `from dataclasses import dataclass
from langgraph.runtime import Runtime
from langchain.chat_models import init_chat_model

@dataclass
class Context:
    user_id: str
    model: str = "anthropic:claude-sonnet-4-5"
    persona: str = "friendly"

def agent(state: MessagesState, runtime: Runtime[Context]):
    llm = init_chat_model(runtime.context.model)
    system = {"role": "system", "content": f"Be {runtime.context.persona}."}
    return {"messages": [llm.invoke([system] + state["messages"])]}

builder = StateGraph(MessagesState, context_schema=Context)
builder.add_node("agent", agent)
builder.add_edge(START, "agent")
graph = builder.compile()

graph.invoke(
    {"messages": [{"role": "user", "content": "hi"}]},
    context={"user_id": "u-7", "persona": "pirate"},
)`,
    },
    codeTitle: 'Runtime context',
    takeaways: [
      'State changes during a run; context is fixed for a run.',
      '`context_schema` + `context=` + `Runtime[Context]`.',
      '`configurable.thread_id` remains the persistence key.',
      'Great for per-user models, prompts and credentials.',
    ],
  },
  {
    id: 'functional-api',
    module: 'runtime',
    title: 'The Functional API',
    icon: 'ƒ',
    level: 'Intermediate',
    tagline: 'Get persistence, HITL and streaming with plain functions — no explicit graph needed.',
    why: 'Some workflows read best as normal code with if/for/while. The Functional API adds LangGraph superpowers to that style.',
    body: [
      '`@entrypoint` marks the workflow’s main function (it can take a `checkpointer` and `store`). `@task` marks units of work — usually side-effectful or expensive calls such as LLM or API calls.',
      'Calling a task returns a **future**; call `.result()` (or `await` in async) to get the value. Launch several tasks before awaiting to run them in parallel.',
      'Task results are **checkpointed**: on resume after an interrupt or failure, completed tasks are not re-executed — their saved results are reused. This is what makes the Functional API durable.',
      'Both APIs share the same runtime: you can call a graph from a task or use an entrypoint as a node. Choose Graph API for complex branching you want to visualize; Functional API for straightforward procedural logic.',
    ],
    code: {
      python: `from langgraph.func import entrypoint, task
from langgraph.types import interrupt
from langgraph.checkpoint.memory import InMemorySaver

@task
def write_essay(topic: str) -> str:
    return llm.invoke(f"Write a short essay about {topic}").content

@task
def score(essay: str, rubric: str) -> int:
    return len(essay) % 10

@entrypoint(checkpointer=InMemorySaver())
def workflow(topic: str) -> dict:
    essay = write_essay(topic).result()
    # run two graders in parallel
    f1, f2 = score(essay, "clarity"), score(essay, "accuracy")
    approved = interrupt({"essay": essay, "scores": [f1.result(), f2.result()]})
    return {"essay": essay, "approved": approved}

config = {"configurable": {"thread_id": "essay-1"}}
for event in workflow.stream("black holes", config):
    print(event)
workflow.invoke(Command(resume=True), config)   # write_essay is NOT re-run`,
      js: `import { entrypoint, task, interrupt, MemorySaver } from "@langchain/langgraph";

const writeEssay = task("write_essay", async (topic: string) => {
  return (await llm.invoke("Write a short essay about " + topic)).content;
});

const workflow = entrypoint(
  { name: "workflow", checkpointer: new MemorySaver() },
  async (topic: string) => {
    const essay = await writeEssay(topic);
    const approved = interrupt({ essay });
    return { essay, approved };
  },
);`,
    },
    codeTitle: '@entrypoint and @task',
    takeaways: [
      '`@entrypoint` = workflow; `@task` = checkpointed unit of work.',
      'Tasks return futures → easy parallelism.',
      'Completed tasks aren’t re-run on resume.',
      'Same runtime as the Graph API — mix and match.',
    ],
  },
  {
    id: 'durable',
    module: 'runtime',
    title: 'Durable Execution',
    icon: '🛡️',
    level: 'Advanced',
    tagline: 'Survive crashes, deploys and long waits — resume from the last successful step.',
    why: 'Long-running agents (minutes to days) will meet failures. Durability means never starting from scratch.',
    body: [
      'With a checkpointer, every super-step is persisted. If the process dies, invoking the same thread again (with `None` as input) continues from the last checkpoint.',
      'Pending writes from successful parallel siblings are stored, so a failure in one branch doesn’t redo the others.',
      'Choose a **durability mode** per run: `"exit"` (persist only when the run finishes/interrupts — fastest), `"async"` (persist in the background while the next step runs — default trade-off), `"sync"` (persist before each next step — safest).',
      'Make side effects **idempotent** or wrap them in `@task`s so they’re not repeated on resume. Non-deterministic code (random numbers, timestamps) should also live in tasks so replays are consistent.',
    ],
    code: {
      python: `config = {"configurable": {"thread_id": "etl-2025-10-01"}}

try:
    graph.invoke({"files": files}, config, durability="sync")
except Exception as err:
    print("crashed:", err)

# after fixing the bug / restarting the worker, resume where we stopped:
graph.invoke(None, config)`,
    },
    codeTitle: 'Resuming after a failure',
    takeaways: [
      'Checkpointer ⇒ resume after crashes with `invoke(None, config)`.',
      'Durability modes: exit / async / sync.',
      'Idempotent side effects; wrap them in tasks.',
      'Long-running and scheduled agents depend on this.',
    ],
  },

  // ───────────────────────── PRODUCTION ─────────────────────────
  {
    id: 'deployment',
    module: 'production',
    title: 'Deployment: LangGraph Server & Platform',
    icon: '☁️',
    level: 'Intermediate',
    tagline: 'Turn your graph into a scalable API with threads, runs, cron jobs, and a visual Studio.',
    why: 'Agents need task queues, persistence, streaming endpoints and horizontal scaling. The Platform provides them out of the box.',
    body: [
      '**LangGraph Server** wraps your graphs in an HTTP API: assistants, threads, runs (background, streaming, or wait), stateful interrupts, cron jobs, webhooks and a built-in store. It handles “double-texting” (users sending new messages mid-run) with strategies like reject, enqueue, interrupt or rollback.',
      '**LangGraph CLI** (`langgraph dev`, `langgraph build`, `langgraph up`) runs the server locally with hot-reload and builds Docker images. Configuration lives in `langgraph.json`.',
      '**LangGraph Studio** is a visual IDE/debugger: see your graph, step through runs, edit state, time-travel and fork threads.',
      '**SDKs** (`langgraph-sdk` for Python, `@langchain/langgraph-sdk` for JS) and the React `useStream` hook let frontends talk to deployments.',
      'Hosting options: managed cloud (now offered within LangSmith as “LangSmith Deployment”), hybrid, or fully self-hosted. You can also just serve your graph from your own FastAPI/Express app — LangGraph the library is MIT-licensed.',
    ],
    code: {
      bash: `pip install -U "langgraph-cli[inmem]"
langgraph new my-agent --template new-langgraph-project-python
cd my-agent && pip install -e .
langgraph dev          # local server + Studio at http://127.0.0.1:2024`,
      json: `{
  "dependencies": ["."],
  "graphs": {
    "agent": "./src/agent/graph.py:graph"
  },
  "env": ".env"
}`,
      python: `from langgraph_sdk import get_client

client = get_client(url="http://127.0.0.1:2024")
thread = await client.threads.create()

async for chunk in client.runs.stream(
    thread["thread_id"],
    "agent",                          # graph id from langgraph.json
    input={"messages": [{"role": "user", "content": "Hello!"}]},
    stream_mode="updates",
):
    print(chunk.event, chunk.data)`,
    },
    codeTitle: 'CLI, langgraph.json and the SDK',
    takeaways: [
      'LangGraph Server = production API (threads, runs, crons, store, streaming).',
      '`langgraph.json` declares graphs, deps and env.',
      'Studio = visual debugger with time travel.',
      'Cloud, hybrid or self-hosted — or embed the library yourself.',
    ],
  },
  {
    id: 'observability',
    module: 'production',
    title: 'Observability & Evaluation with LangSmith',
    icon: '🔭',
    level: 'Intermediate',
    tagline: 'Trace every node, LLM call and tool call; evaluate quality with datasets.',
    why: 'You can’t improve what you can’t see. Agent bugs hide in the 7th step of the 3rd loop.',
    body: [
      'Set `LANGSMITH_TRACING=true` and `LANGSMITH_API_KEY` — LangGraph runs are traced automatically, with each node as a nested span, including token usage, latency and errors.',
      'Add `tags` and `metadata` via config to filter traces (e.g. by user, experiment, version).',
      '**Evaluate**: build datasets of inputs/expected outputs, then run evaluators — exact match, LLM-as-judge, or trajectory evaluators that check which tools the agent called and in what order.',
      'Online evaluation & monitoring: score production traces, set up alerts and dashboards; feed bad traces back into datasets.',
      'LangSmith works with any framework (not only LangChain) via the `@traceable` decorator and OpenTelemetry.',
    ],
    code: {
      bash: `export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY="lsv2_..."
export LANGSMITH_PROJECT="my-agent"`,
      python: `from langsmith import Client

client = Client()
dataset = client.create_dataset("weather-agent")
client.create_examples(dataset_id=dataset.id,
    inputs=[{"question": "Weather in Paris?"}],
    outputs=[{"must_mention": "Paris"}])

def target(inputs: dict) -> dict:
    out = graph.invoke({"messages": [{"role": "user", "content": inputs["question"]}]})
    return {"answer": out["messages"][-1].content}

def mentions_city(outputs: dict, reference_outputs: dict) -> bool:
    return reference_outputs["must_mention"] in outputs["answer"]

client.evaluate(target, data="weather-agent", evaluators=[mentions_city],
                experiment_prefix="v1")`,
    },
    codeTitle: 'Tracing & evaluation',
    takeaways: [
      'Two env vars enable full tracing.',
      'Datasets + evaluators = regression tests for agents.',
      'Trajectory evals check *how* the agent got there.',
      'Monitor production and loop failures back into datasets.',
    ],
  },
  {
    id: 'best-practices',
    module: 'production',
    title: 'Best Practices & Testing',
    icon: '🏆',
    level: 'Advanced',
    tagline: 'Hard-won lessons for building reliable agents.',
    why: 'Most agent failures are design failures: too much autonomy, too much context, too little observability.',
    body: [
      '**Start as a workflow, add agency where needed.** Deterministic edges are cheaper, faster and easier to test than LLM routing. Let the LLM decide only where judgement is required.',
      '**Design state first.** Raw, minimal, typed. Add reducers wherever several writers exist.',
      '**Small, testable nodes.** Each node does one thing; unit-test nodes as plain functions, then integration-test the compiled graph with a fake/stub model.',
      '**Test individual nodes in isolation** via `graph.nodes["name"]`, or run partial executions starting from a specific state with `update_state(..., as_node=...)`.',
      '**Guard rails**: recursion limits, max-iteration counters, timeouts, retry policies, structured outputs, and HITL on irreversible actions.',
      '**Control context**: trim/summarize, give sub-agents only what they need, store big artifacts outside state.',
      '**Observe & evaluate** from day one with LangSmith; keep a dataset of tricky cases.',
      '**Persist in a real database** and use `thread_id`s that map to your domain (conversation id, ticket id).',
    ],
    code: {
      python: `# Unit-test a node as a plain function
def test_classify_billing():
    assert route({"topic": "billing"}) == "billing"

# Integration-test the compiled graph with a fake model
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage

def test_agent_answers():
    fake = GenericFakeChatModel(messages=iter([AIMessage("Paris is sunny")]))
    graph = build_graph(llm=fake)            # inject dependencies!
    out = graph.invoke({"messages": [{"role": "user", "content": "weather?"}]})
    assert "sunny" in out["messages"][-1].content`,
    },
    codeTitle: 'Testing agents',
    takeaways: [
      'Prefer deterministic flow; add LLM decisions deliberately.',
      'Inject models/tools so tests can use fakes.',
      'Guard rails on loops and irreversible actions.',
      'Observability and evals from day one.',
    ],
  },
]

export const conceptById = (id: string) => CONCEPTS.find((c) => c.id === id)
