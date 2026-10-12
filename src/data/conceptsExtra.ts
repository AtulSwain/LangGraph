import type { Concept } from './concepts'

/**
 * Additional lessons. Merged into CONCEPTS (ordered by module) in concepts.ts.
 */
export const EXTRA_CONCEPTS: Concept[] = [
  // ───────────────────────── FOUNDATIONS ─────────────────────────
  {
    id: 'graph-vs-functional',
    module: 'foundations',
    title: 'Graph API vs Functional API',
    icon: 'Scale',
    level: 'Beginner',
    tagline: 'Two ways to write the same runtime — pick the one that matches the shape of your logic.',
    why: 'Choosing the right API up front keeps your code readable as the agent grows.',
    body: [
      'The **Graph API** (`StateGraph`) makes structure explicit: nodes, edges, and a shared state schema. You can render it as a diagram, inspect it in Studio, and reason about every transition.',
      'The **Functional API** (`@entrypoint` + `@task`) lets you write ordinary Python/TypeScript with `if`, `for` and `while`. State is just local variables; durability comes from checkpointing each task’s result.',
      'Both compile to the same Pregel runtime, so they share persistence, streaming, interrupts, memory and deployment. You can call a graph from a task, or use an entrypoint as a node.',
      'Rule of thumb: if you would naturally draw it on a whiteboard (routers, loops, multiple agents), use the Graph API. If it reads like a script (step 1, then step 2, maybe retry), use the Functional API.',
    ],
    analogy: 'The Graph API is a subway map — great when there are many lines and transfers. The Functional API is a recipe card — great when you just follow steps in order.',
    code: {
      python: `# ---- Graph API ----
builder = StateGraph(State)
builder.add_node("draft", draft)
builder.add_node("review", review)
builder.add_edge(START, "draft")
builder.add_conditional_edges("review", lambda s: END if s["ok"] else "draft", ["draft", END])
builder.add_edge("draft", "review")
graph = builder.compile(checkpointer=InMemorySaver())

# ---- Functional API: same logic as plain code ----
@task
def draft_task(topic: str, feedback: str | None) -> str: ...

@task
def review_task(text: str) -> tuple[bool, str]: ...

@entrypoint(checkpointer=InMemorySaver())
def workflow(topic: str) -> str:
    feedback = None
    for _ in range(3):
        text = draft_task(topic, feedback).result()
        ok, feedback = review_task(text).result()
        if ok:
            break
    return text`,
    },
    codeTitle: 'The same loop, two styles',
    takeaways: [
      'Graph API = explicit structure, visualizable, best for complex branching.',
      'Functional API = normal control flow, minimal boilerplate.',
      'Same runtime underneath: persistence, streaming, HITL work in both.',
      'Mix them freely in one application.',
    ],
    diagram: 'reflection',
  },
  {
    id: 'multiple-schemas',
    module: 'foundations',
    title: 'Private State & Multiple Schemas',
    icon: 'Lock',
    level: 'Intermediate',
    tagline: 'Give nodes their own private channels while keeping a clean public interface.',
    why: 'Large graphs accumulate scratch data. Private channels stop internal details from leaking to callers or other nodes.',
    body: [
      'A node can declare an input type that differs from the graph’s overall state. LangGraph reads only the keys that type declares.',
      'A node can also **write to channels that aren’t in the overall schema**, as long as some other node declares them in its input type. These become private channels between those nodes.',
      'Combine this with `input_schema` / `output_schema` on the builder to control exactly what callers send and receive.',
      'Pydantic and dataclass schemas work the same way; Pydantic adds runtime validation of inputs.',
    ],
    code: {
      python: `class InputState(TypedDict):
    user_input: str

class OutputState(TypedDict):
    graph_output: str

class OverallState(TypedDict):
    foo: str
    user_input: str
    graph_output: str

class PrivateState(TypedDict):
    bar: str                      # never visible to callers

def node_1(state: InputState) -> OverallState:
    return {"foo": state["user_input"] + " name"}

def node_2(state: OverallState) -> PrivateState:
    return {"bar": state["foo"] + " is"}          # writes a private channel

def node_3(state: PrivateState) -> OutputState:
    return {"graph_output": state["bar"] + " Lance"}

builder = StateGraph(OverallState, input_schema=InputState, output_schema=OutputState)
builder.add_node("node_1", node_1)
builder.add_node("node_2", node_2)
builder.add_node("node_3", node_3)
builder.add_edge(START, "node_1")
builder.add_edge("node_1", "node_2")
builder.add_edge("node_2", "node_3")
builder.add_edge("node_3", END)
builder.compile().invoke({"user_input": "My"})
# {'graph_output': 'My name is Lance'}`,
    },
    codeTitle: 'Private channels between nodes',
    takeaways: [
      'Node input types select which keys a node reads.',
      'Nodes can write private channels not in the overall schema.',
      'Use input/output schemas for a clean public API.',
      'Keeps large graphs tidy and secure.',
    ],
  },

  // ───────────────────────── MODELS & MESSAGES ─────────────────────────
  {
    id: 'chat-models',
    module: 'models',
    title: 'Chat Models & Providers',
    icon: 'Cpu',
    level: 'Beginner',
    tagline: 'One interface for every LLM provider — and how to pick the right model for each node.',
    why: 'Your graph is only as good as the models inside it. Choosing per-node models is the biggest lever on quality, speed and cost.',
    body: [
      '`init_chat_model("provider:model")` returns a chat model with a uniform interface: `invoke`, `stream`, `batch`, `bind_tools`, `with_structured_output`. Supported providers include Anthropic, OpenAI, Azure OpenAI, Google (Gemini / Vertex AI), AWS Bedrock, Mistral, Cohere, Groq, Fireworks, Together, DeepSeek, xAI, Ollama (local) and more via `langchain-<provider>` packages.',
      'Common parameters: `temperature`, `max_tokens`, `timeout`, `max_retries`, plus provider-specific options. Use a `rate_limiter` to stay under provider limits during batch jobs.',
      '**Per-node model choice** is a LangGraph superpower: a small, fast model for routing/classification; a strong reasoning model for planning; a cheap model for summarization; a vision model for image nodes.',
      'Requirements for agents: reliable **tool calling** and **structured output**. Most frontier models from major providers support both; check provider docs for smaller/open models.',
      'Make the model configurable at runtime (via context or configurable fields) so you can A/B test models without code changes.',
    ],
    code: {
      python: `from langchain.chat_models import init_chat_model
from langchain_core.rate_limiters import InMemoryRateLimiter

router_llm  = init_chat_model("anthropic:claude-haiku-4-5", temperature=0)
planner_llm = init_chat_model("anthropic:claude-sonnet-4-5", max_tokens=4096)
local_llm   = init_chat_model("ollama:llama3.1")              # runs on your machine

limiter = InMemoryRateLimiter(requests_per_second=2)
batch_llm = init_chat_model("openai:gpt-4.1-mini", rate_limiter=limiter, max_retries=3)

msg = planner_llm.invoke("Plan a 3-step research task about solar storage.")
print(msg.content)
print(msg.usage_metadata)   # {'input_tokens': ..., 'output_tokens': ..., 'total_tokens': ...}

# Stream tokens
for chunk in planner_llm.stream("Explain super-steps in one paragraph"):
    print(chunk.content, end="", flush=True)`,
      js: `import { initChatModel } from "langchain/chat_models/universal";

const routerLlm = await initChatModel("anthropic:claude-haiku-4-5", { temperature: 0 });
const plannerLlm = await initChatModel("anthropic:claude-sonnet-4-5");

const msg = await plannerLlm.invoke("Plan a 3-step research task about solar storage.");
console.log(msg.content, msg.usage_metadata);`,
    },
    codeTitle: 'Different models for different jobs',
    takeaways: [
      '`init_chat_model("provider:model")` gives a uniform API across providers.',
      'Pick models per node: small for routing, strong for planning.',
      'Tool calling + structured output are must-haves for agents.',
      'Rate limiters, retries and timeouts belong in production configs.',
    ],
    pitfalls: ['Hard-coding one expensive model everywhere — routers and graders rarely need your biggest model.', 'Assuming every open model supports parallel tool calls or JSON schema output — test it.'],
  },
  {
    id: 'messages',
    module: 'models',
    title: 'Messages, Tool Calls & Content Blocks',
    icon: 'MessageSquare',
    level: 'Beginner',
    tagline: 'The universal currency of chat agents: typed messages that carry text, tool calls, results and metadata.',
    why: 'Almost every LangGraph agent stores a list of messages in state. Knowing their shape makes routing, trimming and debugging easy.',
    body: [
      '**SystemMessage** — instructions/persona. **HumanMessage** — user input (text, images, files). **AIMessage** — model output: `content`, `tool_calls`, `usage_metadata`, `response_metadata`. **ToolMessage** — the result of a tool call, linked by `tool_call_id`.',
      'Every message has an `id`, which is how `add_messages` updates or removes it. You can also pass plain dicts like `{"role": "user", "content": "hi"}` or tuples `("user", "hi")` — they are converted automatically.',
      'An AIMessage’s `tool_calls` is a list of `{"name", "args", "id"}`. Every tool call must eventually be answered by a ToolMessage with the matching `tool_call_id`, or most providers will reject the next request.',
      'LangChain v1 adds a standard `content_blocks` view across providers (text, reasoning, tool calls, images, citations…), so your code can read multimodal and reasoning output without provider-specific parsing.',
      'Streaming produces `AIMessageChunk`s that can be added together (`chunk1 + chunk2`) to rebuild the full message.',
    ],
    code: {
      python: `from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage

history = [
    SystemMessage("You are a weather bot."),
    HumanMessage("Weather in Oslo?"),
    AIMessage(content="", tool_calls=[{"name": "get_weather", "args": {"city": "Oslo"}, "id": "call_1"}]),
    ToolMessage(content="-3°C, snow", tool_call_id="call_1"),
]
reply = llm.invoke(history)           # model sees the tool result and answers
print(reply.content)

# Multimodal input (image + text)
HumanMessage(content=[
    {"type": "text", "text": "What's in this picture?"},
    {"type": "image", "url": "https://example.com/cat.png"},
])

# Provider-agnostic view of the output (LangChain v1)
for block in reply.content_blocks:
    print(block["type"])               # e.g. "text", "reasoning", "tool_call"`,
    },
    codeTitle: 'A complete tool-call round trip',
    takeaways: [
      'Four core types: System, Human, AI, Tool.',
      'Every tool call needs a matching ToolMessage.',
      'Message ids power update/delete with add_messages.',
      '`content_blocks` normalizes multimodal & reasoning output.',
    ],
    pitfalls: ['Trimming history so that a ToolMessage remains without its AIMessage (or vice versa) — providers will error. Use `trim_messages` which respects pairs.'],
  },
  {
    id: 'structured-output',
    module: 'models',
    title: 'Structured Output in Graphs',
    icon: 'Braces',
    level: 'Intermediate',
    tagline: 'Turn free-form LLM text into typed, validated data that your edges can route on.',
    why: 'Routers, graders, planners and extractors all need machine-readable answers. Structured output makes LLM decisions reliable.',
    body: [
      '`llm.with_structured_output(Schema)` returns a runnable that outputs an instance of your Pydantic model / TypedDict / JSON schema (Zod in JS).',
      'Methods: `function_calling` (via tool calling — widely supported), `json_schema` (provider-native constrained decoding where available), `json_mode`. Use `include_raw=True` to also get the raw message and any parsing error.',
      'For prebuilt agents, `create_agent(..., response_format=Schema)` makes the final answer structured; it’s returned in `result["structured_response"]`. In LangChain v1 you can choose `ToolStrategy` or `ProviderStrategy` explicitly.',
      'Keep schemas small with clear field descriptions — descriptions are part of the prompt.',
    ],
    code: {
      python: `from typing import Literal
from pydantic import BaseModel, Field

class Plan(BaseModel):
    """A step-by-step research plan."""
    steps: list[str] = Field(description="3-6 concrete, ordered steps")
    needs_web: bool = Field(description="True if any step requires web search")

class Grade(BaseModel):
    score: int = Field(ge=1, le=10)
    verdict: Literal["pass", "revise"]
    feedback: str

planner = llm.with_structured_output(Plan)
grader  = llm.with_structured_output(Grade, method="json_schema", include_raw=True)

def plan_node(state):
    plan = planner.invoke(state["question"])
    return {"steps": plan.steps, "needs_web": plan.needs_web}

def grade_node(state):
    out = grader.invoke(f"Grade this answer:\\n{state['answer']}")
    if out["parsing_error"]:
        return {"verdict": "revise", "feedback": "unparseable grade"}
    g = out["parsed"]
    return {"verdict": g.verdict, "feedback": g.feedback}

# Prebuilt agent with a structured final answer
from langchain.agents import create_agent
agent = create_agent("anthropic:claude-sonnet-4-5", tools=[search], response_format=Plan)
agent.invoke({"messages": [("user", "Plan research on fusion")]})["structured_response"]`,
    },
    codeTitle: 'Planners and graders with schemas',
    takeaways: [
      '`with_structured_output` = typed LLM output.',
      'Choose function_calling / json_schema / json_mode per provider.',
      '`include_raw=True` to handle parse failures gracefully.',
      '`response_format` for structured final answers from agents.',
    ],
  },
  {
    id: 'context-engineering',
    module: 'models',
    title: 'Context Engineering',
    icon: 'Filter',
    level: 'Advanced',
    tagline: 'The #1 job of an agent engineer: put exactly the right information in front of the model at each step.',
    why: 'Most agent failures aren’t model failures — the model simply didn’t have the right context, or had too much of the wrong context.',
    body: [
      'Context = system prompt + message history + tool descriptions + retrieved documents + memories + state summaries. Every token competes for the model’s attention.',
      '**Write** context outside the window: scratchpads in state, files, the Store. **Select** what to bring back: retrieval, memory search, relevant tool subsets. **Compress**: summarize or trim history, condense tool results. **Isolate**: give sub-agents their own clean context and return only summaries.',
      'LangGraph gives you fine-grained control: each node builds its own prompt from state, so the router can see only the last message while the writer sees the full research notes.',
      'Large tool outputs (web pages, logs, CSVs) should be stored in state or a file and summarized, not dumped into history.',
      'Dynamic system prompts: build the prompt per call from runtime context (user profile, date, permissions).',
    ],
    analogy: 'A great executive assistant doesn’t hand the CEO the whole filing cabinet — they hand over a one-page brief with exactly the facts needed for this decision.',
    code: {
      python: `def writer(state: State, runtime: Runtime[Context]):
    # SELECT: only the notes relevant to this section
    notes = [n for n in state["notes"] if n["section"] == state["current_section"]]
    # COMPRESS: summaries instead of raw pages
    brief = "\\n".join(f"- {n['summary']}" for n in notes[:8])
    # DYNAMIC SYSTEM PROMPT from runtime context
    system = (f"You write for {runtime.context.audience}. Today is {date.today()}.\\n"
              f"Use ONLY these facts:\\n{brief}")
    out = llm.invoke([{"role": "system", "content": system},
                      {"role": "user", "content": f"Write section: {state['current_section']}"}])
    return {"sections": [out.content]}

def researcher(state: State):
    page = fetch(state["url"])
    # WRITE big artifacts outside the message history
    summary = cheap_llm.invoke(f"Summarize key facts:\\n{page[:20000]}").content
    return {"notes": [{"section": state["current_section"], "summary": summary}]}`,
    },
    codeTitle: 'Write · Select · Compress · Isolate',
    takeaways: [
      'Write, Select, Compress, Isolate — the four context strategies.',
      'Each node should build a minimal, purpose-built prompt.',
      'Keep big tool outputs out of message history.',
      'Sub-agents isolate context and return summaries.',
    ],
  },

  // ───────────────────────── CONTROL ─────────────────────────
  {
    id: 'caching-defer',
    module: 'control',
    title: 'Node Caching & Deferred Nodes',
    icon: 'Timer',
    level: 'Advanced',
    tagline: 'Skip repeated expensive work, and wait for uneven branches before aggregating.',
    why: 'Caching cuts cost and latency during development and for repeated inputs; deferred nodes make fan-in correct when branches have different lengths.',
    body: [
      '**Node caching**: add `cache_policy=CachePolicy(ttl=...)` to a node and compile with a cache backend (e.g. `InMemoryCache`). If the node is called again with the same input within the TTL, the cached result is returned instantly.',
      'By default the cache key is derived from the node’s input; you can provide a custom `key_func`.',
      '**Deferred nodes**: `add_node("aggregate", fn, defer=True)` delays execution until all other pending tasks are done. Ideal for map-reduce or multi-branch flows where one branch takes extra steps.',
    ],
    code: {
      python: `from langgraph.types import CachePolicy
from langgraph.cache.memory import InMemoryCache

def expensive_research(state):
    return {"notes": [slow_web_search(state["query"])]}

builder.add_node("research", expensive_research, cache_policy=CachePolicy(ttl=600))
graph = builder.compile(cache=InMemoryCache())

graph.invoke({"query": "fusion energy"})   # slow
graph.invoke({"query": "fusion energy"})   # instant: served from cache

# Branch b has two steps, branch c has one — wait for both before aggregating
builder.add_node("aggregate", aggregate, defer=True)
builder.add_edge("b_2", "aggregate")
builder.add_edge("c", "aggregate")`,
    },
    codeTitle: 'Cache policies and defer=True',
    takeaways: [
      '`CachePolicy(ttl=...)` + `compile(cache=...)` caches node results.',
      'Great for expensive, deterministic nodes and fast dev iterations.',
      '`defer=True` waits for all pending branches before running.',
    ],
    diagram: 'parallel',
  },
  {
    id: 'errors',
    module: 'control',
    title: 'Error Handling, Retries & Fallbacks',
    icon: 'Bug',
    level: 'Intermediate',
    tagline: 'Expect failure: rate limits, flaky APIs, malformed tool calls and model outages.',
    why: 'A 20-step agent with a 99% per-step success rate fails ~18% of the time. Resilience must be designed in.',
    body: [
      '**Retry transient errors** with a node `retry_policy=RetryPolicy(max_attempts=..., initial_interval=..., backoff_factor=..., retry_on=...)`.',
      '**Model fallbacks**: `primary.with_fallbacks([backup])` switches provider/model when the primary errors. In LangChain v1 agents, `ModelFallbackMiddleware` does the same.',
      '**Tool errors**: `ToolNode` catches exceptions and returns them to the model as a ToolMessage (configurable via `handle_tool_errors`) so the model can correct its arguments.',
      '**Errors as state**: catch domain errors in a node, store them in state, and route to a recovery node instead of crashing.',
      '**Durable recovery**: with a checkpointer, a crashed run can be resumed with `invoke(None, config)` — completed steps aren’t repeated.',
    ],
    code: {
      python: `from langgraph.types import RetryPolicy
from langgraph.prebuilt import ToolNode

primary = init_chat_model("anthropic:claude-sonnet-4-5")
backup  = init_chat_model("openai:gpt-4.1")
llm = primary.with_fallbacks([backup])

builder.add_node("agent", agent,
    retry_policy=RetryPolicy(max_attempts=4, initial_interval=1.0, backoff_factor=2.0))

tools_node = ToolNode(tools, handle_tool_errors=lambda e: f"Tool failed: {e}. Fix the arguments and retry.")

def call_api(state):
    try:
        return {"data": external_api(state["query"]), "error": None}
    except QuotaExceeded as e:
        return {"error": str(e)}

builder.add_conditional_edges("call_api",
    lambda s: "fallback_source" if s["error"] else "analyze",
    ["fallback_source", "analyze"])`,
    },
    codeTitle: 'Four layers of resilience',
    takeaways: [
      'RetryPolicy for transient failures.',
      '`with_fallbacks` for model/provider outages.',
      'ToolNode feeds tool errors back so the model can self-correct.',
      'Route on error state; resume crashed runs from checkpoints.',
    ],
  },
  {
    id: 'async',
    module: 'control',
    title: 'Async, Concurrency & Batching',
    icon: 'Zap',
    level: 'Intermediate',
    tagline: 'Run I/O-bound work concurrently and serve many users efficiently.',
    why: 'LLM apps spend most of their time waiting on networks. Async turns waiting time into throughput.',
    body: [
      'Define nodes with `async def` and call `ainvoke` / `astream` on models and tools. Parallel nodes in the same super-step then run concurrently on the event loop.',
      'Limit parallelism with `config={"max_concurrency": N}` — essential for big `Send` fan-outs that could hit rate limits.',
      '`graph.batch([...])` / `abatch` runs many independent inputs at once (each can have its own thread_id).',
      'In web servers (FastAPI, Express), always use the async APIs to avoid blocking the event loop.',
    ],
    code: {
      python: `import asyncio

async def fetch_a(state):
    return {"results": [await http_get_async("https://api.a.com")]}

async def fetch_b(state):
    return {"results": [await http_get_async("https://api.b.com")]}

async def summarize(state):
    msg = await llm.ainvoke(f"Summarize: {state['results']}")
    return {"summary": msg.content}

# a and b run concurrently in one super-step
result = await graph.ainvoke({"results": []}, {"max_concurrency": 10})

# Many users at once
configs = [{"configurable": {"thread_id": f"user-{i}"}} for i in range(50)]
inputs  = [{"messages": [("user", q)]} for q in questions]
answers = await graph.abatch(inputs, configs)`,
    },
    codeTitle: 'Async nodes and throttled fan-out',
    takeaways: [
      '`async def` nodes + `ainvoke` = concurrent I/O.',
      '`max_concurrency` throttles large fan-outs.',
      '`batch`/`abatch` for many independent runs.',
      'Use async APIs inside web servers.',
    ],
  },

  // ───────────────────────── AGENTS ─────────────────────────
  {
    id: 'middleware',
    module: 'agents',
    title: 'Agent Middleware (LangChain v1)',
    icon: 'Layers',
    level: 'Intermediate',
    tagline: 'Hook into every model and tool call of a prebuilt agent — without rewriting the loop.',
    why: 'Middleware gives you the control of a custom graph with the convenience of a prebuilt agent: summarization, approvals, PII redaction, limits, fallbacks.',
    body: [
      '`create_agent(model, tools, middleware=[...])` runs on the LangGraph runtime. Middleware wraps the agent loop at well-defined points.',
      '**Node-style hooks** run at fixed points and can return state updates: `before_agent`, `before_model`, `after_model`, `after_agent`. Great for logging, validation, trimming, guardrails.',
      '**Wrap-style hooks** surround a call and decide whether/how often to call the handler: `wrap_model_call` (retry, switch models, modify the request) and `wrap_tool_call` (block, cache, or retry tools).',
      'Built-ins include: **Summarization**, **Human-in-the-loop** (approve / edit / reject tool calls), **PII** detection & redaction, **Model call limit**, **Tool call limit**, **Model fallback**, **Model/Tool retry**, **To-do list** (planning), **LLM tool selector** (pick relevant tools), and **context editing**.',
      'Decorators (`@before_model`, `@wrap_tool_call`, …) let you write small middleware as functions; subclass `AgentMiddleware` for reusable ones.',
    ],
    code: {
      python: `from langchain.agents import create_agent
from langchain.agents.middleware import (
    SummarizationMiddleware, HumanInTheLoopMiddleware, PIIMiddleware,
    before_model, wrap_tool_call, AgentState,
)
from langchain_core.messages import ToolMessage
from langgraph.checkpoint.memory import InMemorySaver

@before_model
def log_size(state: AgentState, runtime) -> dict | None:
    print(f"about to call the model with {len(state['messages'])} messages")
    return None                                   # no state change

@wrap_tool_call
def block_dangerous(request, handler):
    if request.tool_call["name"] == "drop_table":
        return ToolMessage("Blocked by policy.", tool_call_id=request.tool_call["id"])
    return handler(request)                       # run the tool normally

agent = create_agent(
    model="anthropic:claude-sonnet-4-5",
    tools=[search_orders, issue_refund, drop_table],
    system_prompt="You are a careful support agent.",
    middleware=[
        log_size,
        block_dangerous,
        PIIMiddleware("email", strategy="redact"),
        SummarizationMiddleware(model="anthropic:claude-haiku-4-5", trigger=("tokens", 4000)),
        HumanInTheLoopMiddleware(interrupt_on={"issue_refund": True}),
    ],
    checkpointer=InMemorySaver(),                 # required for HITL
)`,
      js: `import { createAgent, summarizationMiddleware, humanInTheLoopMiddleware } from "langchain";

const agent = createAgent({
  model: "anthropic:claude-sonnet-4-5",
  tools: [searchOrders, issueRefund],
  middleware: [
    summarizationMiddleware({ model: "anthropic:claude-haiku-4-5", trigger: { tokens: 4000 } }),
    humanInTheLoopMiddleware({ interruptOn: { issue_refund: true } }),
  ],
});`,
    },
    codeTitle: 'Built-in + custom middleware',
    takeaways: [
      'Middleware wraps the agent loop at before/after/wrap points.',
      'Node-style hooks update state; wrap-style hooks control calls.',
      'Built-ins cover summarization, HITL, PII, limits, fallbacks, retries.',
      'Middleware runs on LangGraph — persistence & streaming still apply.',
    ],
    pitfalls: ['Middleware parameter names evolve between minor versions — check the reference for your installed version.'],
    diagram: 'react',
  },
  {
    id: 'deep-agents',
    module: 'agents',
    title: 'Deep Agents',
    icon: 'Telescope',
    level: 'Advanced',
    tagline: 'Long-horizon agents that plan, use a virtual filesystem and spawn sub-agents — built on LangGraph.',
    why: 'Simple tool loops are “shallow”: they lose track on tasks that need dozens of steps. Deep agents add planning, memory and delegation.',
    body: [
      'The open-source `deepagents` package (`create_deep_agent`) packages the techniques used by coding and research agents into a reusable harness.',
      '**Planning**: a built-in `write_todos` tool lets the agent write and update a task list — keeping it on track over many steps.',
      '**Filesystem**: `ls`, `read_file`, `write_file`, `edit_file` tools let the agent offload large content (notes, drafts, tool results) out of its context window. Backends can be in-state, local disk or the Store.',
      '**Sub-agents**: a `task` tool spawns specialized sub-agents with isolated context (e.g. a “researcher” or “critic”) and returns only their final result.',
      '**Detailed system prompt**: deep agents rely on long, carefully written instructions. The result is a compiled LangGraph graph, so streaming, checkpointing, HITL and deployment work unchanged.',
    ],
    code: {
      python: `# pip install deepagents
from deepagents import create_deep_agent

def internet_search(query: str, max_results: int = 5) -> list[dict]:
    """Search the web and return results."""
    return tavily.search(query, max_results=max_results)["results"]

critic = {
    "name": "critic",
    "description": "Reviews a draft report and lists concrete improvements.",
    "system_prompt": "You are a tough editor. Be specific.",
}

agent = create_deep_agent(
    model="anthropic:claude-sonnet-4-5",
    tools=[internet_search],
    system_prompt="You are an expert researcher. Plan with todos, save notes to files, "
                  "write the final report to report.md, and ask the critic to review it.",
    subagents=[critic],
)

result = agent.invoke({"messages": [("user", "Write a report on sodium-ion batteries")]})
print(result["files"]["report.md"])`,
    },
    codeTitle: 'A research deep agent',
    takeaways: [
      'Deep agents = planning + filesystem + sub-agents + great prompts.',
      '`create_deep_agent` returns a LangGraph graph.',
      'Filesystem tools keep huge artifacts out of the context window.',
      'Sub-agents provide context isolation for focused work.',
    ],
    diagram: 'hierarchical',
  },
  {
    id: 'rag',
    module: 'agents',
    title: 'RAG with LangGraph',
    icon: 'Library',
    level: 'Intermediate',
    tagline: 'From naive retrieve-then-answer to agentic, self-correcting retrieval.',
    why: 'Grounding answers in your own documents is the most common production LLM use case — and graphs make it far more robust.',
    body: [
      '**Indexing** (offline): load → split → embed → store in a vector store (pgvector, Pinecone, Chroma, Weaviate, Elasticsearch, …).',
      '**2-step RAG**: `retrieve` node → `generate` node. Fast and predictable, but always retrieves, even for “hello”.',
      '**Agentic RAG**: expose the retriever as a tool; the model decides when/what to search, can search multiple times, and can rephrase queries.',
      '**Corrective / Self-RAG**: add a grader node that checks document relevance (and optionally answer groundedness), routing to query rewriting or web search when retrieval is poor.',
      'Add conversation memory with a checkpointer, and cite sources by keeping document metadata in state.',
    ],
    code: {
      python: `from langchain_core.tools import create_retriever_tool
from langgraph.prebuilt import ToolNode, tools_condition

retriever = vector_store.as_retriever(search_kwargs={"k": 4})
search_docs = create_retriever_tool(retriever, "search_docs",
                                    "Search the company handbook. Use for policy questions.")

def agent(state: MessagesState):
    return {"messages": [llm.bind_tools([search_docs]).invoke(state["messages"])]}

class Relevance(BaseModel):
    relevant: Literal["yes", "no"]

def grade(state: MessagesState) -> Literal["answer", "rewrite"]:
    question, docs = state["messages"][0].content, state["messages"][-1].content
    r = llm.with_structured_output(Relevance).invoke(
        f"Question: {question}\\nDocuments: {docs}\\nAre the documents relevant?")
    return "answer" if r.relevant == "yes" else "rewrite"

def rewrite(state: MessagesState):
    better = llm.invoke(f"Rewrite this question for better search: {state['messages'][0].content}")
    return {"messages": [("user", better.content)]}

def answer(state: MessagesState):
    return {"messages": [llm.invoke(state["messages"] + [("user", "Answer using the documents; cite them.")])]}

b = StateGraph(MessagesState)
b.add_node("agent", agent); b.add_node("retrieve", ToolNode([search_docs]))
b.add_node("rewrite", rewrite); b.add_node("answer", answer)
b.add_edge(START, "agent")
b.add_conditional_edges("agent", tools_condition, {"tools": "retrieve", END: END})
b.add_conditional_edges("retrieve", grade)
b.add_edge("rewrite", "agent"); b.add_edge("answer", END)
rag = b.compile(checkpointer=InMemorySaver())`,
    },
    codeTitle: 'Agentic, self-correcting RAG',
    takeaways: [
      'Index offline; retrieve at query time.',
      '2-step RAG is simple; agentic RAG is flexible.',
      'Grade relevance and rewrite queries to self-correct.',
      'Checkpointer adds conversational memory.',
    ],
    diagram: 'agenticRag',
  },

  // ───────────────────────── INTEGRATIONS ─────────────────────────
  {
    id: 'mcp',
    module: 'integrations',
    title: 'MCP: Model Context Protocol Tools',
    icon: 'Plug',
    level: 'Intermediate',
    tagline: 'Plug any MCP server — GitHub, databases, browsers, your own APIs — into a LangGraph agent.',
    why: 'MCP is an open standard for exposing tools and data to LLMs. Instead of writing wrappers, connect once and reuse a growing ecosystem of servers.',
    body: [
      'The `langchain-mcp-adapters` package converts MCP tools into LangChain tools that work with `ToolNode`, `create_agent`, and any LangGraph node.',
      '`MultiServerMCPClient` connects to several servers at once over different transports: **stdio** (local subprocess) and **streamable HTTP** (remote servers), with optional headers for auth.',
      'Call `await client.get_tools()` and pass the list to your agent. Tools are discovered dynamically — when the server adds a tool, your agent gets it.',
      'You can also expose your own LangGraph deployment as an MCP server so other MCP clients (IDEs, desktop apps) can call your agent.',
    ],
    code: {
      python: `# pip install langchain-mcp-adapters
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.agents import create_agent

client = MultiServerMCPClient({
    "math": {
        "command": "python",
        "args": ["/abs/path/math_server.py"],
        "transport": "stdio",
    },
    "weather": {
        "url": "http://localhost:8000/mcp",
        "transport": "streamable_http",
        "headers": {"Authorization": "Bearer <token>"},
    },
})

tools = await client.get_tools()
agent = create_agent("anthropic:claude-sonnet-4-5", tools)
await agent.ainvoke({"messages": [("user", "What's (3 + 5) x 12, and the weather in NYC?")]})

# Or in a custom graph:
# builder.add_node("tools", ToolNode(tools))`,
    },
    codeTitle: 'Connecting MCP servers',
    takeaways: [
      'MCP = open standard for tools and context.',
      '`MultiServerMCPClient` supports stdio and HTTP transports.',
      '`get_tools()` returns LangChain-compatible tools.',
      'Works with ToolNode, create_agent and custom graphs.',
    ],
    diagram: 'react',
  },
  {
    id: 'frontend',
    module: 'integrations',
    title: 'Frontends: useStream & Agent Chat UI',
    icon: 'Monitor',
    level: 'Intermediate',
    tagline: 'Build real-time agent UIs: streaming tokens, tool progress, interrupts and branching chats.',
    why: 'An agent is only as good as its UX. Users need to see progress, approve actions and edit past messages.',
    body: [
      'The `useStream` React hook (`@langchain/langgraph-sdk/react`) connects to a LangGraph server and gives you `messages`, `isLoading`, `submit`, `stop`, the current `interrupt`, and thread history/branching.',
      'It handles streaming, reconnection, optimistic updates and thread persistence. Resume interrupts with `submit(undefined, { command: { resume: value } })`.',
      '**Agent Chat UI** is an open-source Next.js app that talks to any LangGraph deployment: chat, tool-call rendering, interrupt approval, time travel. Great for demos and internal tools.',
      '**Generative UI**: nodes can push custom UI components alongside messages so the frontend renders charts, forms or cards produced by the agent.',
    ],
    code: {
      js: `import { useStream } from "@langchain/langgraph-sdk/react";

export default function Chat() {
  const thread = useStream({
    apiUrl: "http://localhost:2024",
    assistantId: "agent",
    messagesKey: "messages",
  });

  return (
    <div>
      {thread.messages.map((m) => (
        <p key={m.id}><b>{m.type}:</b> {String(m.content)}</p>
      ))}

      {thread.interrupt && (
        <button onClick={() => thread.submit(undefined, { command: { resume: "approve" } })}>
          Approve: {JSON.stringify(thread.interrupt.value)}
        </button>
      )}

      <form onSubmit={(e) => {
        e.preventDefault();
        const text = new FormData(e.currentTarget).get("q") as string;
        thread.submit({ messages: [{ type: "human", content: text }] });
      }}>
        <input name="q" />
        {thread.isLoading ? <button onClick={() => thread.stop()}>Stop</button> : <button>Send</button>}
      </form>
    </div>
  );
}`,
    },
    codeTitle: 'A streaming chat UI in ~30 lines',
    takeaways: [
      '`useStream` = streaming, interrupts and history in one hook.',
      'Resume interrupts from the UI with a command.',
      'Agent Chat UI gives you a ready-made frontend.',
      'Generative UI lets agents render rich components.',
    ],
  },
  {
    id: 'platform-api',
    module: 'integrations',
    title: 'Assistants, Threads, Runs & Crons',
    icon: 'Server',
    level: 'Intermediate',
    tagline: 'The core resources of a deployed LangGraph server — and how to use them.',
    why: 'Once deployed, you talk to your agent through these primitives. Understanding them unlocks background jobs, schedules and multi-tenant configs.',
    body: [
      '**Assistant**: a graph + a configuration (prompt, model, tools). Many assistants can share one graph — e.g. one per customer — and are versioned.',
      '**Thread**: a persistent conversation/state container (backed by checkpoints). **Run**: one invocation of an assistant on a thread — streaming, background (`runs.create`) or blocking (`runs.wait`).',
      '**Cron**: a scheduled run (`crons.create(..., schedule="0 9 * * *")`) for daily reports, monitoring, follow-ups. **Webhooks**: get notified when a background run finishes.',
      '**Double-texting** (`multitask_strategy`): what happens if a new message arrives while a run is in progress — `reject`, `enqueue`, `interrupt`, or `rollback`.',
      '**Store API**: read/write long-term memory over HTTP, shared across threads.',
    ],
    code: {
      python: `from langgraph_sdk import get_client
client = get_client(url="https://my-deployment.example.com")

# One graph, many configured assistants
pirate = await client.assistants.create("agent", config={"configurable": {"persona": "pirate"}},
                                        name="Pirate support bot")

thread = await client.threads.create(metadata={"user_id": "u-42"})

# Background run + webhook
run = await client.runs.create(thread["thread_id"], pirate["assistant_id"],
    input={"messages": [{"role": "user", "content": "Summarize my tickets"}]},
    webhook="https://my-app.example.com/hooks/run-done",
    multitask_strategy="enqueue")

# Block until done
final_state = await client.runs.join(thread["thread_id"], run["run_id"])

# Daily report at 9:00 UTC
await client.crons.create(pirate["assistant_id"], schedule="0 9 * * *",
                          input={"messages": [{"role": "user", "content": "Daily digest"}]})`,
    },
    codeTitle: 'The LangGraph SDK',
    takeaways: [
      'Assistant = graph + config; Thread = state; Run = invocation.',
      'Background runs + webhooks for long jobs.',
      'Crons for scheduled agents.',
      'Choose a double-texting strategy deliberately.',
    ],
  },
  {
    id: 'langgraph-js',
    module: 'integrations',
    title: 'LangGraph.js (TypeScript)',
    icon: 'Braces',
    level: 'Beginner',
    tagline: 'Everything you learned, in TypeScript — with Annotations or Zod schemas.',
    why: 'Many agent products live in Node.js/edge runtimes. LangGraph.js is a first-class port with the same concepts.',
    body: [
      'Install `@langchain/langgraph` and `@langchain/core`. Concepts map 1:1: `StateGraph`, `START`, `END`, `Command`, `Send`, `interrupt`, `MemorySaver`, `InMemoryStore`, `entrypoint`/`task`.',
      'State is defined with `Annotation.Root({...})` (with optional `reducer` and `default`) or with Zod schemas. `MessagesAnnotation` is the chat preset.',
      'Methods are camelCase (`addNode`, `addEdge`, `addConditionalEdges`, `getState`, `updateState`) and options are camelCase (`streamMode`, `recursionLimit`).',
      'Runs on Node.js, Deno, Bun, Cloudflare Workers and Vercel (where supported). Postgres/SQLite checkpointers are available as separate packages.',
    ],
    code: {
      js: `import { z } from "zod";
import { StateGraph, START, END, MemorySaver, interrupt, Command } from "@langchain/langgraph";

const State = z.object({
  question: z.string(),
  draft: z.string().optional(),
  approved: z.boolean().optional(),
});

const graph = new StateGraph(State)
  .addNode("draft", async (s) => ({ draft: "Answer to: " + s.question }))
  .addNode("review", async (s) => {
    const ok = interrupt({ draft: s.draft }) as boolean;
    return { approved: ok };
  })
  .addEdge(START, "draft")
  .addEdge("draft", "review")
  .addEdge("review", END)
  .compile({ checkpointer: new MemorySaver() });

const config = { configurable: { thread_id: "t1" } };
await graph.invoke({ question: "What is LangGraph?" }, config);   // pauses
await graph.invoke(new Command({ resume: true }), config);        // resumes`,
    },
    codeTitle: 'Zod state + interrupt in TypeScript',
    takeaways: [
      'Same concepts, camelCase APIs.',
      'State via Annotation.Root or Zod.',
      'Runs across Node and edge runtimes.',
      'Checkpointers & stores available as packages.',
    ],
  },

  // ───────────────────────── PRODUCTION ─────────────────────────
  {
    id: 'security',
    module: 'production',
    title: 'Security, Guardrails & Auth',
    icon: 'ShieldCheck',
    level: 'Advanced',
    tagline: 'Agents act in the world. Treat them like untrusted code with credentials.',
    why: 'Prompt injection, data leaks and runaway tool use are real risks. Defense in depth keeps agents safe.',
    body: [
      '**Least privilege**: give each agent only the tools and scopes it needs. Read-only by default; write tools behind approvals.',
      '**Prompt injection**: treat retrieved web pages, emails and tool outputs as untrusted data — never as instructions. Separate data from instructions in prompts, and gate sensitive actions with HITL.',
      '**Guardrails**: validate inputs/outputs (schemas, allow-lists, PII redaction middleware), cap model and tool calls, and set recursion limits.',
      '**Auth & multi-tenancy**: on a LangGraph server, add custom authentication (`Auth` handlers) and authorization rules so users only see their own threads, assistants and store namespaces.',
      '**Secrets** stay out of state and prompts; inject clients via context/config. Log and trace everything for audit.',
    ],
    code: {
      python: `# src/security/auth.py   — referenced from langgraph.json: "auth": {"path": "src/security/auth.py:auth"}
from langgraph_sdk import Auth

auth = Auth()

@auth.authenticate
async def authenticate(authorization: str | None) -> Auth.types.MinimalUserDict:
    user = await verify_jwt(authorization)          # your identity provider
    if not user:
        raise Auth.exceptions.HTTPException(status_code=401, detail="Invalid token")
    return {"identity": user["sub"]}

@auth.on
async def owner_only(ctx: Auth.types.AuthContext, value: dict):
    # tag new resources with the owner and filter reads to the owner
    value.setdefault("metadata", {})["owner"] = ctx.user.identity
    return {"owner": ctx.user.identity}`,
    },
    codeTitle: 'Per-user isolation on LangGraph Server',
    takeaways: [
      'Least privilege tools; approvals for irreversible actions.',
      'Treat external content as data, never instructions.',
      'Limits, schemas and PII redaction as guardrails.',
      'Custom auth + owner filters for multi-tenant deployments.',
    ],
  },
  {
    id: 'performance',
    module: 'production',
    title: 'Cost, Latency & Performance',
    icon: 'Gauge',
    level: 'Advanced',
    tagline: 'Make agents fast and affordable without losing quality.',
    why: 'Agents multiply LLM calls. Small inefficiencies per step become big bills and slow UX.',
    body: [
      '**Right-size models** per node; reserve the biggest model for planning/hard reasoning.',
      '**Parallelize** independent work (fan-out, `Send`, async) and **stream** so users see progress immediately.',
      '**Cache**: node caching for repeated work, provider prompt caching for long, stable system prompts and documents.',
      '**Shrink context**: trim/summarize history, condense tool outputs, select only relevant tools.',
      '**Cut steps**: deterministic edges instead of LLM routing where possible; combine small LLM calls; set call limits.',
      '**Durability mode**: `"exit"` or `"async"` reduce checkpoint overhead for short runs.',
      'Measure with LangSmith: latency per node, tokens per run, cost per user — then optimize the biggest bar.',
    ],
    code: {
      python: `# Cheap router + strong worker
router = init_chat_model("anthropic:claude-haiku-4-5", temperature=0)
worker = init_chat_model("anthropic:claude-sonnet-4-5")

# Throttle a big fan-out, persist lazily for speed
graph.invoke(inputs, {"max_concurrency": 8}, durability="async")

# Tag runs so LangSmith can break down cost by feature/user
graph.invoke(inputs, {"tags": ["feature:summaries"], "metadata": {"user_id": "u-42"}})`,
    },
    codeTitle: 'Practical optimizations',
    takeaways: [
      'Model per node is the biggest cost lever.',
      'Parallelize + stream for perceived speed.',
      'Cache and shrink context aggressively.',
      'Measure first, then optimize the slowest/most expensive node.',
    ],
  },
  {
    id: 'debugging',
    module: 'production',
    title: 'Visualizing & Debugging Graphs',
    icon: 'Eye',
    level: 'Beginner',
    tagline: 'See your graph, step through runs, and find the exact step where things went wrong.',
    why: 'Agents fail in surprising places. Good visibility turns hours of guessing into minutes of reading.',
    body: [
      '`graph.get_graph().draw_mermaid()` prints a Mermaid diagram; `draw_mermaid_png()` renders an image (in notebooks). Use `get_graph(xray=True)` to expand subgraphs.',
      '`stream_mode="debug"` emits detailed task/checkpoint events; `stream_mode="updates"` shows exactly what each node returned.',
      '**LangSmith Studio** (formerly LangGraph Studio) runs your graph locally via `langgraph dev`: visualize, chat, edit state, add breakpoints, replay and fork threads.',
      '**LangSmith tracing** shows the full tree of every run: inputs, outputs, prompts, tokens, latency and errors for each node and LLM call.',
      'Reproduce bugs with time travel: fetch the failing checkpoint, `update_state` a fix, and re-run from there.',
    ],
    code: {
      python: `print(graph.get_graph(xray=True).draw_mermaid())

# In a notebook:
from IPython.display import Image, display
display(Image(graph.get_graph().draw_mermaid_png()))

# Watch every step
for event in graph.stream(inputs, config, stream_mode="debug"):
    print(event["type"], event.get("payload", {}).get("name"))

# Inspect the state where it failed, patch it, continue
snap = graph.get_state(config)
print(snap.next, snap.tasks)
graph.update_state(config, {"query": "corrected query"})
graph.invoke(None, config)`,
      bash: `pip install -U "langgraph-cli[inmem]"
langgraph dev   # opens LangSmith Studio connected to your local graph`,
    },
    codeTitle: 'Diagrams, debug streams and Studio',
    takeaways: [
      'draw_mermaid (xray for subgraphs) to see structure.',
      'debug/updates stream modes to see behaviour.',
      'Studio for interactive debugging and time travel.',
      'LangSmith traces for production forensics.',
    ],
  },
  {
    id: 'whats-new',
    module: 'production',
    title: 'Versions, Migration & What’s New',
    icon: 'Newspaper',
    level: 'Beginner',
    tagline: 'LangGraph 1.0, LangChain 1.0, renamed products, and how to migrate older code.',
    why: 'Tutorials on the internet span several API generations. Knowing what changed saves hours of confusion.',
    body: [
      '**October 2025 — LangGraph 1.0 & LangChain 1.0.** LangGraph 1.0 was a stability release focused on durable execution, with no breaking changes to core graph APIs. LangChain 1.0 rebuilt agents on the LangGraph runtime: `create_agent` + middleware, standard content blocks, and structured output strategies. Legacy chains moved to `langchain-classic`.',
      '**Prebuilt agents**: `langgraph.prebuilt.create_react_agent` is superseded by `langchain.agents.create_agent` (which adds middleware). `ToolNode`, `tools_condition` and the rest of the Graph API are unchanged.',
      '**Renames**: LangGraph Platform → **LangSmith Deployment**; LangGraph Studio → **LangSmith Studio** (October 2025). APIs and existing deployments kept working.',
      '**Older code you may meet**: `AgentExecutor` and `initialize_agent` (pre-LangGraph agents) → migrate to `create_agent` or a custom graph. `MemorySaver` is an alias of `InMemorySaver`. `config_schema` → `context_schema` with the `Runtime` object. `StateGraph(..., input=..., output=...)` → `input_schema`/`output_schema`.',
      '**2026**: LangGraph 1.1 introduced opt-in, type-safe streaming (a v2 stream format with typed parts), with further streaming and deployment-CLI improvements in later releases. Always check the official changelog for your version.',
    ],
    code: {
      python: `# BEFORE (legacy, pre-LangGraph)
from langchain.agents import AgentExecutor, create_tool_calling_agent
agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)
executor.invoke({"input": "hi"})

# AFTER (LangChain v1 — runs on LangGraph)
from langchain.agents import create_agent
agent = create_agent("anthropic:claude-sonnet-4-5", tools=tools,
                     system_prompt="You are helpful.")
agent.invoke({"messages": [{"role": "user", "content": "hi"}]})`,
    },
    codeTitle: 'Migrating a legacy agent',
    takeaways: [
      '1.0 releases (Oct 2025) are stable foundations.',
      '`create_agent` replaces `create_react_agent` and `AgentExecutor`.',
      'Platform → LangSmith Deployment; Studio → LangSmith Studio.',
      'Check dates on tutorials; prefer official docs.',
    ],
  },
]
