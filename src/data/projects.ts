import type { CodeSample } from '../components/CodeBlock'

export interface Project {
  id: string
  title: string
  icon: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  time: string
  graph: string
  summary: string
  concepts: string[]
  steps: string[]
  install: string
  code: CodeSample
  extend: string[]
}

export const PROJECTS: Project[] = [
  {
    id: 'support-bot',
    title: 'Customer Support Router',
    icon: 'Headphones',
    level: 'Beginner',
    time: '30 min',
    graph: 'conditional',
    summary: 'Classify incoming messages with structured output and route them to specialized handlers, with conversation memory per customer.',
    concepts: ['StateGraph', 'Structured output', 'Conditional edges', 'Checkpointer'],
    install: 'pip install -U langgraph langchain langchain-anthropic',
    steps: [
      'Define a chat state with an extra `category` key.',
      'Create a classifier with `with_structured_output` and a `Literal` schema.',
      'Write one node per category with its own system prompt.',
      'Route with a conditional edge; compile with a checkpointer keyed by customer id.',
    ],
    code: {
      python: `from typing import Literal
from pydantic import BaseModel
from langchain.chat_models import init_chat_model
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.memory import InMemorySaver

fast = init_chat_model("anthropic:claude-haiku-4-5", temperature=0)
smart = init_chat_model("anthropic:claude-sonnet-4-5")

class State(MessagesState):
    category: str

class Classification(BaseModel):
    category: Literal["billing", "technical", "general"]

def classify(state: State):
    result = fast.with_structured_output(Classification).invoke(
        [("system", "Classify the customer's latest message.")] + state["messages"][-3:])
    return {"category": result.category}

def specialist(system_prompt: str):
    def node(state: State):
        reply = smart.invoke([("system", system_prompt)] + state["messages"])
        return {"messages": [reply]}
    return node

builder = StateGraph(State)
builder.add_node("classify", classify)
builder.add_node("billing", specialist("You are a billing expert. Be precise about refunds and invoices."))
builder.add_node("technical", specialist("You are a senior support engineer. Give step-by-step fixes."))
builder.add_node("general", specialist("You are a friendly concierge."))
builder.add_edge(START, "classify")
builder.add_conditional_edges("classify", lambda s: s["category"], ["billing", "technical", "general"])
for n in ["billing", "technical", "general"]:
    builder.add_edge(n, END)

app = builder.compile(checkpointer=InMemorySaver())

cfg = {"configurable": {"thread_id": "customer-1042"}}
print(app.invoke({"messages": [("user", "I was charged twice this month")]}, cfg)["messages"][-1].content)
print(app.invoke({"messages": [("user", "Also my app crashes on login")]}, cfg)["messages"][-1].content)`,
    },
    extend: ['Add an escalation node with interrupt() for angry customers', 'Log categories to LangSmith for analytics', 'Give the technical node a docs-search tool'],
  },
  {
    id: 'research-assistant',
    title: 'Parallel Research Assistant',
    icon: 'Microscope',
    level: 'Intermediate',
    time: '1 hour',
    graph: 'mapReduce',
    summary: 'Plan sub-questions, research them in parallel with Send, then synthesize a cited report — a classic orchestrator-workers system.',
    concepts: ['Send API', 'Reducers', 'Structured output', 'Map-reduce', 'max_concurrency'],
    install: 'pip install -U langgraph langchain langchain-anthropic langchain-tavily',
    steps: [
      'Planner produces 3–5 sub-questions with structured output.',
      'A conditional edge returns one `Send` per sub-question.',
      'Each worker searches the web and writes a short finding (appended via `operator.add`).',
      'A writer node synthesizes the final report with citations.',
    ],
    code: {
      python: `import operator
from typing import Annotated, TypedDict
from pydantic import BaseModel, Field
from langchain.chat_models import init_chat_model
from langchain_tavily import TavilySearch
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send

llm = init_chat_model("anthropic:claude-sonnet-4-5")
search = TavilySearch(max_results=3)

class Plan(BaseModel):
    questions: list[str] = Field(description="3-5 focused sub-questions")

class State(TypedDict):
    topic: str
    questions: list[str]
    findings: Annotated[list[dict], operator.add]
    report: str

class WorkerInput(TypedDict):
    question: str

def plan(state: State):
    p = llm.with_structured_output(Plan).invoke(f"Break this research topic into sub-questions: {state['topic']}")
    return {"questions": p.questions}

def dispatch(state: State):
    return [Send("research", {"question": q}) for q in state["questions"]]

def research(item: WorkerInput):
    results = search.invoke({"query": item["question"]})["results"]
    sources = "\\n".join(f"[{r['url']}] {r['content'][:500]}" for r in results)
    answer = llm.invoke(f"Answer briefly using only these sources, cite URLs:\\n{sources}\\n\\nQ: {item['question']}")
    return {"findings": [{"question": item["question"], "answer": answer.content}]}

def write(state: State):
    notes = "\\n\\n".join(f"## {f['question']}\\n{f['answer']}" for f in state["findings"])
    report = llm.invoke(f"Write a well-structured report on '{state['topic']}' from these notes. Keep citations.\\n\\n{notes}")
    return {"report": report.content}

g = StateGraph(State)
g.add_node("plan", plan)
g.add_node("research", research)
g.add_node("write", write)
g.add_edge(START, "plan")
g.add_conditional_edges("plan", dispatch, ["research"])
g.add_edge("research", "write")
g.add_edge("write", END)
app = g.compile()

out = app.invoke({"topic": "State of solid-state batteries"}, {"max_concurrency": 4})
print(out["report"])`,
    },
    extend: ['Add a reflection loop that critiques the report', 'Stream progress with get_stream_writer()', 'Cache the research node with CachePolicy'],
  },
  {
    id: 'sql-agent',
    title: 'SQL Analyst Agent',
    icon: 'Database',
    level: 'Intermediate',
    time: '1 hour',
    graph: 'react',
    summary: 'A tool-calling agent that inspects a database schema, writes SQL, checks it, runs it and explains the result — with a safety guard on writes.',
    concepts: ['Tools', 'ToolNode', 'ReAct loop', 'Guardrails', 'Recursion limit'],
    install: 'pip install -U langgraph langchain langchain-anthropic',
    steps: [
      'Create tools: list tables, describe a table, run a read-only query.',
      'Block any non-SELECT statement inside the query tool.',
      'Bind tools to the model; wire agent ⇄ tools with tools_condition.',
      'Ask natural-language questions about your data.',
    ],
    code: {
      python: `import sqlite3
from langchain_core.tools import tool
from langchain.chat_models import init_chat_model
from langgraph.graph import StateGraph, MessagesState, START
from langgraph.prebuilt import ToolNode, tools_condition

conn = sqlite3.connect("shop.db", check_same_thread=False)

@tool
def list_tables() -> list[str]:
    """List all tables in the database."""
    return [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")]

@tool
def describe_table(table: str) -> list[tuple]:
    """Return column names and types for a table."""
    return conn.execute(f"PRAGMA table_info({table})").fetchall()

@tool
def run_query(sql: str) -> list[tuple] | str:
    """Run a read-only SQL SELECT query and return up to 50 rows."""
    if not sql.strip().lower().startswith("select"):
        return "Error: only SELECT queries are allowed."
    try:
        return conn.execute(sql).fetchmany(50)
    except Exception as e:
        return f"SQL error: {e}. Fix the query and try again."

tools = [list_tables, describe_table, run_query]
llm = init_chat_model("anthropic:claude-sonnet-4-5").bind_tools(tools)

SYSTEM = ("You are a data analyst. Always inspect the schema before querying. "
          "Write SQLite SQL, then explain the answer in plain English.")

def agent(state: MessagesState):
    return {"messages": [llm.invoke([("system", SYSTEM)] + state["messages"])]}

g = StateGraph(MessagesState)
g.add_node("agent", agent)
g.add_node("tools", ToolNode(tools))
g.add_edge(START, "agent")
g.add_conditional_edges("agent", tools_condition)
g.add_edge("tools", "agent")
app = g.compile()

q = "Which 3 products had the highest revenue last month?"
for step in app.stream({"messages": [("user", q)]}, {"recursion_limit": 20}, stream_mode="updates"):
    print(step)`,
    },
    extend: ['Add a query-checker node that reviews SQL before running it', 'Use HITL approval for expensive queries', 'Return a chart spec with structured output'],
  },
  {
    id: 'rag-chatbot',
    title: 'Docs Chatbot with Memory',
    icon: 'BookOpen',
    level: 'Intermediate',
    time: '1.5 hours',
    graph: 'agenticRag',
    summary: 'Agentic RAG over your documentation with relevance grading, query rewriting, per-user conversation memory and long-term preferences.',
    concepts: ['Retriever tool', 'Grading', 'Checkpointer', 'Store', 'Runtime context'],
    install: 'pip install -U langgraph langchain langchain-anthropic langchain-openai langchain-text-splitters',
    steps: [
      'Index docs: load, split, embed into a vector store.',
      'Wrap the retriever as a tool the agent can call.',
      'Grade retrieved docs; rewrite the question if irrelevant.',
      'Store user preferences (e.g. “answer briefly”) in the Store and inject them into the prompt.',
    ],
    code: {
      python: `from dataclasses import dataclass
from typing import Literal
from pydantic import BaseModel
from langchain.chat_models import init_chat_model
from langchain_openai import OpenAIEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_core.tools import create_retriever_tool
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.store.memory import InMemoryStore
from langgraph.runtime import Runtime

# 1) Index
chunks = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100).create_documents(DOCS)
vs = InMemoryVectorStore.from_documents(chunks, OpenAIEmbeddings())
retrieve_tool = create_retriever_tool(vs.as_retriever(k=4), "search_docs", "Search product documentation.")

llm = init_chat_model("anthropic:claude-sonnet-4-5")

@dataclass
class Ctx:
    user_id: str

def agent(state: MessagesState, runtime: Runtime[Ctx]):
    prefs = runtime.store.get(("prefs", runtime.context.user_id), "style")
    style = prefs.value["style"] if prefs else "normal length"
    system = f"Answer questions about our product. Preferred style: {style}. Search docs when needed."
    return {"messages": [llm.bind_tools([retrieve_tool]).invoke([("system", system)] + state["messages"])]}

class Grade(BaseModel):
    relevant: Literal["yes", "no"]

def grade(state: MessagesState) -> Literal["generate", "rewrite"]:
    q = next(m for m in reversed(state["messages"]) if m.type == "human").content
    g = llm.with_structured_output(Grade).invoke(f"Q: {q}\\nDocs: {state['messages'][-1].content}\\nRelevant?")
    return "generate" if g.relevant == "yes" else "rewrite"

def rewrite(state: MessagesState):
    q = next(m for m in reversed(state["messages"]) if m.type == "human").content
    return {"messages": [("user", llm.invoke(f"Rephrase for documentation search: {q}").content)]}

def generate(state: MessagesState):
    return {"messages": [llm.invoke(state["messages"] + [("user", "Answer from the docs above, citing sections.")])]}

g = StateGraph(MessagesState, context_schema=Ctx)
g.add_node("agent", agent); g.add_node("retrieve", ToolNode([retrieve_tool]))
g.add_node("rewrite", rewrite); g.add_node("generate", generate)
g.add_edge(START, "agent")
g.add_conditional_edges("agent", tools_condition, {"tools": "retrieve", END: END})
g.add_conditional_edges("retrieve", grade)
g.add_edge("rewrite", "agent"); g.add_edge("generate", END)

store = InMemoryStore()
store.put(("prefs", "ada"), "style", {"style": "short bullet points"})
app = g.compile(checkpointer=InMemorySaver(), store=store)

cfg = {"configurable": {"thread_id": "ada-chat-1"}}
app.invoke({"messages": [("user", "How do I rotate API keys?")]}, cfg, context={"user_id": "ada"})`,
    },
    extend: ['Cap rewrite attempts with a counter', 'Add a groundedness check before answering', 'Let users save preferences via a tool'],
  },
  {
    id: 'email-assistant',
    title: 'Email Assistant with Approval',
    icon: 'Mail',
    level: 'Advanced',
    time: '2 hours',
    graph: 'hitl',
    summary: 'Triage incoming email, draft replies, and require a human to approve, edit or reject before anything is sent.',
    concepts: ['interrupt()', 'Command', 'Edit-state pattern', 'Durable execution', 'Threads'],
    install: 'pip install -U langgraph langchain langchain-anthropic',
    steps: [
      'Triage: ignore, notify, or respond (structured output).',
      'Draft a reply with the model.',
      'Interrupt with the draft; the human returns accept / edit / reject.',
      'Send on accept/edit; loop back with feedback on reject.',
    ],
    code: {
      python: `from typing import Literal, TypedDict
from pydantic import BaseModel
from langchain.chat_models import init_chat_model
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt, Command
from langgraph.checkpoint.memory import InMemorySaver

llm = init_chat_model("anthropic:claude-sonnet-4-5")

class State(TypedDict, total=False):
    email: dict
    decision: str
    draft: str
    feedback: str
    sent: bool

class Triage(BaseModel):
    decision: Literal["ignore", "notify", "respond"]

def triage(state: State) -> Command[Literal["draft", "__end__"]]:
    t = llm.with_structured_output(Triage).invoke(f"Triage this email:\\n{state['email']}")
    return Command(goto="draft" if t.decision == "respond" else END, update={"decision": t.decision})

def draft(state: State):
    extra = f"\\nRevise using this feedback: {state['feedback']}" if state.get("feedback") else ""
    reply = llm.invoke(f"Draft a concise, polite reply to:\\n{state['email']}{extra}")
    return {"draft": reply.content}

def review(state: State) -> Command[Literal["send", "draft"]]:
    response = interrupt({"action": "review_email", "to": state["email"]["from"], "draft": state["draft"]})
    if response["type"] == "accept":
        return Command(goto="send")
    if response["type"] == "edit":
        return Command(goto="send", update={"draft": response["draft"]})
    return Command(goto="draft", update={"feedback": response.get("feedback", "")})

def send(state: State):
    smtp_send(to=state["email"]["from"], body=state["draft"])   # side effect AFTER approval
    return {"sent": True}

g = StateGraph(State)
for name, fn in [("triage", triage), ("draft", draft), ("review", review), ("send", send)]:
    g.add_node(name, fn)
g.add_edge(START, "triage")
g.add_edge("draft", "review")
g.add_edge("send", END)
app = g.compile(checkpointer=InMemorySaver())

cfg = {"configurable": {"thread_id": "email-7781"}}
out = app.invoke({"email": {"from": "ceo@client.com", "body": "Can we move our call to Friday?"}}, cfg)
print(out["__interrupt__"][0].value["draft"])
app.invoke(Command(resume={"type": "edit", "draft": "Friday 2pm works — see you then!"}), cfg)`,
    },
    extend: ['Use a Postgres checkpointer so approvals survive restarts', 'Remember writing style in the Store', 'Expose via LangGraph Server and approve from Agent Chat UI'],
  },
  {
    id: 'content-team',
    title: 'Multi-Agent Content Team',
    icon: 'Users',
    level: 'Advanced',
    time: '2 hours',
    graph: 'supervisor',
    summary: 'A supervisor coordinates a researcher, a writer and an editor agent to produce a polished article.',
    concepts: ['Supervisor', 'Prebuilt agents', 'Handoffs', 'Subgraphs', 'Streaming subgraphs'],
    install: 'pip install -U langgraph langgraph-supervisor langchain langchain-anthropic langchain-tavily',
    steps: [
      'Build three specialist agents with focused tools and prompts.',
      'Create a supervisor that decides who works next.',
      'Compile with a checkpointer and stream with subgraphs=True to watch hand-offs.',
    ],
    code: {
      python: `from langchain.chat_models import init_chat_model
from langchain_tavily import TavilySearch
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor
from langgraph.checkpoint.memory import InMemorySaver

llm = init_chat_model("anthropic:claude-sonnet-4-5")

researcher = create_react_agent(llm, tools=[TavilySearch(max_results=4)], name="researcher",
    prompt="Find accurate, recent facts with sources. Return bullet notes only.")
writer = create_react_agent(llm, tools=[], name="writer",
    prompt="Turn research notes into an engaging 600-word article with headings.")
editor = create_react_agent(llm, tools=[], name="editor",
    prompt="Tighten prose, fix errors, check every claim has a source. Return the final article.")

team = create_supervisor(
    [researcher, writer, editor],
    model=llm,
    prompt=("You lead a content team. Order of work: researcher -> writer -> editor. "
            "Send work back if quality is lacking. Finish when the editor approves."),
).compile(checkpointer=InMemorySaver())

cfg = {"configurable": {"thread_id": "article-1"}}
for ns, chunk in team.stream({"messages": [("user", "Write an article on home heat pumps in 2026")]},
                             cfg, stream_mode="updates", subgraphs=True):
    print(ns, list(chunk.keys()))`,
    },
    extend: ['Swap the supervisor for a swarm with handoff tools', 'Add an illustrator agent that returns image prompts', 'Evaluate articles with an LLM-as-judge dataset in LangSmith'],
  },
]
