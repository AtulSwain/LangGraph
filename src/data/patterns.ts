import type { CodeSample } from '../components/CodeBlock'

export interface Pattern {
  id: string
  name: string
  icon: string
  category: 'Workflow' | 'Agent' | 'Multi-Agent' | 'Retrieval' | 'Oversight'
  graph: string
  summary: string
  how: string[]
  useWhen: string[]
  pros: string[]
  cons: string[]
  code: CodeSample
  /** ordered list of node ids to animate as a sample execution path */
  path: string[]
}

export const PATTERNS: Pattern[] = [
  {
    id: 'chain',
    name: 'Prompt Chaining',
    icon: '⛓️',
    category: 'Workflow',
    graph: 'sequence',
    summary: 'Break a task into a fixed sequence of LLM calls, each processing the previous output.',
    how: ['Each node handles one sub-task (outline → draft → polish).', 'Optional “gate” checks between steps can stop early.', 'Fully deterministic flow — easiest to test.'],
    useWhen: ['The task decomposes cleanly into fixed steps', 'You want maximum predictability and low latency variance'],
    pros: ['Simple to reason about', 'Each step gets a focused prompt', 'Cheap to evaluate'],
    cons: ['No adaptivity', 'Errors propagate down the chain'],
    path: ['__start__', 'step_1', 'step_2', '__end__'],
    code: {
      python: `class State(TypedDict):
    topic: str
    outline: str
    essay: str

def outline(state: State):
    return {"outline": llm.invoke(f"Outline an essay on {state['topic']}").content}

def write(state: State):
    return {"essay": llm.invoke(f"Write the essay from this outline:\\n{state['outline']}").content}

builder = StateGraph(State)
builder.add_sequence([outline, write])
builder.add_edge(START, "outline")
graph = builder.compile()`,
    },
  },
  {
    id: 'router',
    name: 'Routing',
    icon: '🔀',
    category: 'Workflow',
    graph: 'conditional',
    summary: 'Classify the input and send it to a specialized handler.',
    how: ['A router node (LLM with structured output or rules) labels the input.', 'A conditional edge maps label → specialist node.', 'Each specialist has its own prompt, tools and maybe model.'],
    useWhen: ['Inputs fall into distinct categories', 'Different categories need different prompts/tools/models (e.g. cheap model for small talk)'],
    pros: ['Separation of concerns', 'Cost optimization per route', 'Each route is testable'],
    cons: ['Misclassification sends users down the wrong path', 'Needs a fallback route'],
    path: ['__start__', 'classify', 'tech_support', '__end__'],
    code: {
      python: `class Route(BaseModel):
    step: Literal["billing", "tech_support", "small_talk"]

router = llm.with_structured_output(Route)

def classify(state: State):
    return {"route": router.invoke(state["input"]).step}

builder.add_node("classify", classify)
builder.add_conditional_edges("classify", lambda s: s["route"],
                              ["billing", "tech_support", "small_talk"])`,
    },
  },
  {
    id: 'parallel',
    name: 'Parallelization',
    icon: '⚡',
    category: 'Workflow',
    graph: 'parallel',
    summary: 'Run independent sub-tasks simultaneously and aggregate the results.',
    how: ['Fan-out with multiple edges from one node.', 'Branches run in the same super-step.', 'A fan-in node aggregates; use reducers on shared keys.'],
    useWhen: ['Sub-tasks are independent (sectioning)', 'You want multiple opinions to vote on (voting / guardrail checks)'],
    pros: ['Lower latency', 'Diverse perspectives', 'Natural fit for guardrails running beside the main task'],
    cons: ['Higher token usage', 'Needs careful reducers to avoid conflicts'],
    path: ['__start__', 'a', 'b', 'c', 'd', '__end__'],
    code: {
      python: `class State(TypedDict):
    topic: str
    results: Annotated[list[str], operator.add]

builder.add_edge(START, "a")
builder.add_edge("a", "b")       # b and c in parallel
builder.add_edge("a", "c")
builder.add_edge(["b", "c"], "d")  # aggregator waits for both
builder.add_edge("d", END)`,
    },
  },
  {
    id: 'react',
    name: 'ReAct Tool-Calling Agent',
    icon: '🤖',
    category: 'Agent',
    graph: 'react',
    summary: 'The LLM reasons, calls tools, observes results and repeats until it can answer.',
    how: ['agent node calls an LLM bound to tools.', 'If the response has tool calls → ToolNode executes them.', 'Results go back to the agent; loop until no tool calls.'],
    useWhen: ['Open-ended tasks where the number of steps is unknown', 'The model must choose among many tools'],
    pros: ['Flexible and general', 'Prebuilt available', 'Easy to extend with more tools'],
    cons: ['Less predictable', 'Can loop or over-call tools', 'Harder to evaluate'],
    path: ['__start__', 'agent', 'tools', 'agent', '__end__'],
    code: {
      python: `from langgraph.prebuilt import create_react_agent

agent = create_react_agent(
    model="anthropic:claude-sonnet-4-5",
    tools=[search, calculator],
    prompt="Use tools when helpful. Be concise.",
)
agent.invoke({"messages": [{"role": "user", "content": "Population of Japan / 7?"}]})`,
    },
  },
  {
    id: 'plan-execute',
    name: 'Plan-and-Execute',
    icon: '🗺️',
    category: 'Agent',
    graph: 'planExecute',
    summary: 'A planner writes a multi-step plan; an executor agent works through it; a replanner adjusts.',
    how: ['Planner (strong model) produces a list of steps.', 'Executor (cheaper model / ReAct agent) runs one step at a time.', 'Replanner looks at results and either updates the plan or responds.'],
    useWhen: ['Long, multi-step tasks (research, data analysis)', 'You want to use a big model for planning and small ones for execution'],
    pros: ['Explicit long-horizon planning', 'Cost-efficient', 'Plans are inspectable/editable by humans'],
    cons: ['More LLM calls', 'Plans can become stale'],
    path: ['__start__', 'planner', 'executor', 'replan', 'executor', 'replan', '__end__'],
    code: {
      python: `class PlanState(TypedDict):
    input: str
    plan: list[str]
    past_steps: Annotated[list[tuple], operator.add]
    response: str

def plan_step(state):
    return {"plan": planner.invoke(state["input"]).steps}

def execute_step(state):
    task = state["plan"][0]
    result = executor_agent.invoke({"messages": [("user", task)]})
    return {"past_steps": [(task, result["messages"][-1].content)]}

def replan_step(state):
    out = replanner.invoke(state)
    if out.response:
        return {"response": out.response}
    return {"plan": out.steps}

builder.add_conditional_edges("replan",
    lambda s: END if s.get("response") else "executor", ["executor", END])`,
    },
  },
  {
    id: 'reflection',
    name: 'Reflection / Evaluator-Optimizer',
    icon: '🪞',
    category: 'Agent',
    graph: 'reflection',
    summary: 'One LLM generates, another critiques; loop until the critique passes.',
    how: ['Generator drafts an answer.', 'Evaluator grades it (structured: pass/fail + feedback).', 'If fail → generator revises with the feedback.'],
    useWhen: ['Clear evaluation criteria exist (tests, rubric, style guide)', 'Iterative refinement measurably improves output (code, translation, writing)'],
    pros: ['Higher quality outputs', 'Feedback is explicit and traceable'],
    cons: ['Slower and more expensive', 'Needs an iteration cap'],
    path: ['__start__', 'generate', 'reflect', 'generate', '__end__'],
    code: {
      python: `class Feedback(BaseModel):
    grade: Literal["pass", "fail"]
    feedback: str

evaluator = llm.with_structured_output(Feedback)

def generate(state):
    prompt = f"Write a tweet about {state['topic']}."
    if state.get("feedback"):
        prompt += f" Improve using this feedback: {state['feedback']}"
    return {"draft": llm.invoke(prompt).content, "iterations": state.get("iterations", 0) + 1}

def reflect(state):
    fb = evaluator.invoke(f"Grade this tweet: {state['draft']}")
    return {"grade": fb.grade, "feedback": fb.feedback}

builder.add_conditional_edges("generate",
    lambda s: END if s.get("grade") == "pass" or s["iterations"] >= 3 else "reflect",
    ["reflect", END])
builder.add_edge("reflect", "generate")`,
    },
  },
  {
    id: 'map-reduce',
    name: 'Orchestrator-Workers (Map-Reduce)',
    icon: '🧩',
    category: 'Workflow',
    graph: 'mapReduce',
    summary: 'An orchestrator decides the sub-tasks at runtime and dispatches workers via Send.',
    how: ['Orchestrator plans N sections/sub-questions.', 'Send() spawns one worker per item, in parallel.', 'A reducer collects outputs; a synthesizer combines them.'],
    useWhen: ['Number of sub-tasks is only known at runtime', 'Report writing, multi-file code changes, per-document processing'],
    pros: ['Dynamic parallelism', 'Workers get focused context'],
    cons: ['Harder to bound cost', 'Synthesis step can lose detail'],
    path: ['__start__', 'plan', 'w1', 'w2', 'w3', 'reduce', '__end__'],
    code: {
      python: `def assign_workers(state):
    return [Send("write_section", {"section": s}) for s in state["sections"]]

builder.add_conditional_edges("orchestrator", assign_workers, ["write_section"])
builder.add_edge("write_section", "synthesizer")`,
    },
  },
  {
    id: 'supervisor',
    name: 'Supervisor Multi-Agent',
    icon: '🧑‍💼',
    category: 'Multi-Agent',
    graph: 'supervisor',
    summary: 'A supervisor LLM delegates to specialist agents and decides when the job is done.',
    how: ['Each worker is an agent (often a subgraph) with its own tools.', 'Supervisor chooses next worker or FINISH.', 'Workers always return control to the supervisor.'],
    useWhen: ['Several distinct skill sets (research, code, writing)', 'You want central control and auditability'],
    pros: ['Clear control flow', 'Easy to add/remove agents', 'Debuggable'],
    cons: ['Supervisor is a bottleneck', 'Extra LLM hop per handoff'],
    path: ['__start__', 'supervisor', 'researcher', 'supervisor', 'writer', 'supervisor', '__end__'],
    code: {
      python: `from langgraph_supervisor import create_supervisor

app = create_supervisor(
    [research_agent, code_agent, writer_agent],
    model=llm,
    prompt="Route work to the best agent. Reply FINISH when the user's request is complete.",
).compile(checkpointer=InMemorySaver())`,
    },
  },
  {
    id: 'swarm',
    name: 'Swarm / Network',
    icon: '🐝',
    category: 'Multi-Agent',
    graph: 'swarm',
    summary: 'Agents hand off control directly to one another; the last active agent keeps the conversation.',
    how: ['Each agent has handoff tools (transfer_to_X).', 'Handoff = Command(goto=X, graph=Command.PARENT).', 'The system remembers the active agent across turns.'],
    useWhen: ['Customer-service style flows (triage → flights → hotels)', 'Peer agents with no natural boss'],
    pros: ['Fewer hops than supervisor', 'Natural conversational handoffs'],
    cons: ['Harder to reason about globally', 'Risk of ping-pong handoffs'],
    path: ['__start__', 'triage', 'flights', 'hotels', '__end__'],
    code: {
      python: `from langgraph_swarm import create_swarm, create_handoff_tool

flights = create_react_agent(llm, [search_flights, create_handoff_tool(agent_name="hotels")], name="flights")
hotels = create_react_agent(llm, [search_hotels, create_handoff_tool(agent_name="flights")], name="hotels")

app = create_swarm([flights, hotels], default_active_agent="flights").compile(
    checkpointer=InMemorySaver())`,
    },
  },
  {
    id: 'hierarchical',
    name: 'Hierarchical Teams',
    icon: '🏛️',
    category: 'Multi-Agent',
    graph: 'hierarchical',
    summary: 'Supervisors of supervisors: each team is a subgraph with its own supervisor and workers.',
    how: ['Build each team as a compiled subgraph.', 'A top-level supervisor routes between teams.', 'Teams return summaries, not their full internal chatter.'],
    useWhen: ['Large systems with 10+ agents', 'Different teams owned by different developers'],
    pros: ['Scales organizationally', 'Encapsulation of context'],
    cons: ['Latency from many layers', 'More moving parts to evaluate'],
    path: ['__start__', 'top', 'research_team', 'search', 'research_team', 'top', 'writing_team', 'author', 'writing_team', 'top', '__end__'],
    code: {
      python: `research_team = create_supervisor([search_agent, scraper_agent], model=llm,
                                  supervisor_name="research_supervisor").compile(name="research_team")
writing_team = create_supervisor([author_agent, editor_agent], model=llm,
                                 supervisor_name="writing_supervisor").compile(name="writing_team")

top = create_supervisor([research_team, writing_team], model=llm).compile()`,
    },
  },
  {
    id: 'agentic-rag',
    name: 'Agentic / Corrective RAG',
    icon: '📚',
    category: 'Retrieval',
    graph: 'agenticRag',
    summary: 'The agent decides when to retrieve, grades documents, rewrites bad queries, then answers.',
    how: ['Agent decides whether retrieval is needed (retriever as a tool).', 'Grader checks relevance of retrieved docs.', 'Irrelevant → rewrite the question and retry; relevant → generate the answer.'],
    useWhen: ['Knowledge-base Q&A where naive RAG misses', 'Questions that may or may not need retrieval'],
    pros: ['Fewer hallucinations', 'Self-correcting retrieval'],
    cons: ['Extra latency for grading', 'Needs good grader prompts'],
    path: ['__start__', 'agent', 'retrieve', 'grade', 'rewrite', 'agent', 'retrieve', 'grade', 'generate', '__end__'],
    code: {
      python: `retriever_tool = create_retriever_tool(retriever, "search_docs", "Search the LangGraph docs.")

class Grade(BaseModel):
    relevant: Literal["yes", "no"]

def grade_documents(state) -> Literal["generate", "rewrite"]:
    question = state["messages"][0].content
    docs = state["messages"][-1].content
    g = llm.with_structured_output(Grade).invoke(f"Q: {question}\\nDocs: {docs}\\nRelevant?")
    return "generate" if g.relevant == "yes" else "rewrite"

builder.add_conditional_edges("agent", tools_condition, {"tools": "retrieve", END: END})
builder.add_conditional_edges("retrieve", grade_documents)
builder.add_edge("rewrite", "agent")
builder.add_edge("generate", END)`,
    },
  },
  {
    id: 'hitl',
    name: 'Human Approval Gate',
    icon: '✋',
    category: 'Oversight',
    graph: 'hitl',
    summary: 'Pause before irreversible actions; a human approves, edits or rejects.',
    how: ['Draft the action (email, payment, SQL).', 'interrupt() with the draft as payload.', 'Resume with Command(resume=decision) → execute or revise.'],
    useWhen: ['Money, data deletion, external communication', 'Regulated domains (finance, health, legal)'],
    pros: ['Safety and trust', 'Humans can correct the agent mid-flight'],
    cons: ['Requires a UI and a checkpointer', 'Adds latency waiting for humans'],
    path: ['__start__', 'draft', 'approval', 'revise', 'draft', 'approval', 'execute', '__end__'],
    code: {
      python: `def approval(state) -> Command[Literal["execute", "revise"]]:
    answer = interrupt({"draft": state["draft"], "question": "Send this email?"})
    return Command(goto="execute" if answer == "yes" else "revise")

graph = builder.compile(checkpointer=InMemorySaver())
graph.invoke({"task": "email the client"}, config)       # pauses
graph.invoke(Command(resume="yes"), config)              # continues`,
    },
  },
]
