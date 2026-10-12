import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import CodeBlock from '../components/CodeBlock'
import Callout from '../components/Callout'
import Reveal, { GlowCard, SectionHead } from '../components/Reveal'

const FAMILY = [
  { icon: '🦜', name: 'LangChain', color: '#34d399', role: 'Components & agents', text: 'Standard interfaces for 1000+ integrations (models, vector stores, tools) plus a high-level create_agent API with middleware. Fastest way to get started.' },
  { icon: '🕸️', name: 'LangGraph', color: '#a78bfa', role: 'Orchestration runtime', text: 'Low-level framework for stateful, durable, controllable agents as graphs. Persistence, HITL, streaming, memory, multi-agent.' },
  { icon: '🔭', name: 'LangSmith', color: '#fbbf24', role: 'Observability & evals', text: 'Trace, debug, evaluate and monitor any LLM app (framework-agnostic). Datasets, LLM-as-judge, prompt hub, dashboards.' },
  { icon: '☁️', name: 'Deployment', color: '#f472b6', role: 'Run at scale', text: 'LangGraph Server, Studio, CLI & SDKs (the “LangGraph Platform”, now offered within LangSmith) for long-running, stateful agents in production.' },
]

const BLOCKS = [
  {
    id: 'models',
    title: 'Chat models',
    icon: '💬',
    text: 'One interface for every provider. init_chat_model lets you switch providers with a string. All chat models are Runnables: invoke, stream, batch, plus bind_tools and with_structured_output.',
    code: {
      python: `from langchain.chat_models import init_chat_model

llm = init_chat_model("anthropic:claude-sonnet-4-5", temperature=0)
# llm = init_chat_model("openai:gpt-4.1")   # swap providers in one line

reply = llm.invoke([
    {"role": "system", "content": "You are terse."},
    {"role": "user", "content": "Define LangGraph in 8 words."},
])
print(reply.content)

for chunk in llm.stream("Count to five"):
    print(chunk.content, end="")`,
      js: `import { initChatModel } from "langchain/chat_models/universal";

const llm = await initChatModel("anthropic:claude-sonnet-4-5", { temperature: 0 });
const reply = await llm.invoke("Define LangGraph in 8 words.");
console.log(reply.content);`,
    },
  },
  {
    id: 'prompts',
    title: 'Prompts & LCEL',
    icon: '🧾',
    text: 'Prompt templates fill variables into messages. LCEL (LangChain Expression Language) pipes runnables together with | — the result is itself a runnable with streaming and batching built in.',
    code: {
      python: `from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_messages([
    ("system", "You explain {topic} to a {audience}."),
    ("human", "{question}"),
])

chain = prompt | llm | StrOutputParser()     # LCEL pipe

print(chain.invoke({
    "topic": "graphs", "audience": "10-year-old",
    "question": "What is a node?",
}))`,
      js: `import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You explain {topic} to a {audience}."],
  ["human", "{question}"],
]);
const chain = prompt.pipe(llm).pipe(new StringOutputParser());
await chain.invoke({ topic: "graphs", audience: "10-year-old", question: "What is a node?" });`,
    },
  },
  {
    id: 'structured',
    title: 'Structured output',
    icon: '🧱',
    text: 'Make the model return typed data validated against a schema. Indispensable for routers, graders and extraction nodes in LangGraph.',
    code: {
      python: `from pydantic import BaseModel, Field

class Ticket(BaseModel):
    category: str = Field(description="billing | tech | other")
    urgency: int = Field(ge=1, le=5)
    summary: str

extractor = llm.with_structured_output(Ticket)
t = extractor.invoke("My card was charged twice and I need it fixed TODAY!")
print(t.category, t.urgency)   # billing 5`,
      js: `import { z } from "zod";

const Ticket = z.object({
  category: z.enum(["billing", "tech", "other"]),
  urgency: z.number().min(1).max(5),
  summary: z.string(),
});
const t = await llm.withStructuredOutput(Ticket).invoke("Charged twice, fix it TODAY!");`,
    },
  },
  {
    id: 'tools',
    title: 'Tools',
    icon: '🛠️',
    text: 'Any function can become a tool. The schema the model sees comes from type hints and the docstring. Bind tools to a model to enable tool calling.',
    code: {
      python: `from langchain_core.tools import tool

@tool
def search_orders(customer_id: str, limit: int = 5) -> list[dict]:
    """Return the most recent orders for a customer."""
    return db.orders(customer_id)[:limit]

llm_tools = llm.bind_tools([search_orders])
msg = llm_tools.invoke("Show the last 2 orders for customer C-42")
print(msg.tool_calls)
# [{'name': 'search_orders', 'args': {'customer_id': 'C-42', 'limit': 2}, 'id': '...'}]`,
    },
  },
  {
    id: 'rag',
    title: 'Retrieval (RAG)',
    icon: '📚',
    text: 'Loaders, splitters, embeddings and vector stores turn documents into a retriever — a runnable that returns relevant chunks for a query.',
    code: {
      python: `from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import OpenAIEmbeddings

docs = WebBaseLoader("https://example.com/handbook").load()
chunks = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100).split_documents(docs)
store = InMemoryVectorStore.from_documents(chunks, OpenAIEmbeddings())
retriever = store.as_retriever(search_kwargs={"k": 4})

context = retriever.invoke("What is the refund policy?")
answer = (prompt | llm).invoke({"context": context, "question": "Refund policy?"})`,
    },
  },
  {
    id: 'agents',
    title: 'Agents & middleware',
    icon: '🤖',
    text: 'LangChain v1’s create_agent builds a tool-calling agent on the LangGraph runtime. Middleware hooks run before/after model and tool calls — e.g. summarize long histories or require human approval for risky tools.',
    code: {
      python: `from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware, HumanInTheLoopMiddleware
from langgraph.checkpoint.memory import InMemorySaver

agent = create_agent(
    model="anthropic:claude-sonnet-4-5",
    tools=[search_orders, issue_refund],
    system_prompt="You are a support agent.",
    middleware=[
        SummarizationMiddleware(model="anthropic:claude-haiku-4-5"),  # summarize long chats (see docs for trigger options)
        HumanInTheLoopMiddleware(interrupt_on={"issue_refund": True}),
    ],
    checkpointer=InMemorySaver(),   # it's a LangGraph graph underneath
)`,
    },
  },
]

const QUESTIONS = [
  { q: 'Does your app need loops (e.g. call tools until done)?', key: 'loops' },
  { q: 'Do you need fine control over each step, custom state or branching?', key: 'control' },
  { q: 'Must runs pause for humans or survive restarts?', key: 'durable' },
  { q: 'Will several specialized agents collaborate?', key: 'multi' },
] as const

function Decider() {
  const [a, setA] = useState<Record<string, boolean | undefined>>({})
  const answered = QUESTIONS.every((q) => a[q.key] !== undefined)
  let rec = { title: '', text: '', icon: '' }
  if (answered) {
    if (!a.loops && !a.control && !a.durable && !a.multi) rec = { icon: '🦜', title: 'LangChain chain (or plain code)', text: 'A single LLM call or a linear pipeline (RAG, extraction, summarization). Use LCEL or a simple function — no graph needed.' }
    else if (a.loops && !a.control && !a.multi) rec = { icon: '🤖', title: 'LangChain create_agent (prebuilt)', text: 'A standard tool-calling agent covers this. It runs on LangGraph, so checkpointers and interrupts still work. Add middleware for HITL or summarization.' }
    else if (a.multi) rec = { icon: '👥', title: 'LangGraph multi-agent', text: 'Use LangGraph subgraphs with a supervisor or swarm (langgraph-supervisor / langgraph-swarm), with Command-based handoffs.' }
    else rec = { icon: '🕸️', title: 'Custom LangGraph StateGraph', text: 'You need explicit state, routing and persistence. Build a StateGraph (or Functional API workflow) with a checkpointer.' }
  }
  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <div className="card">
        {QUESTIONS.map((q, i) => (
          <div key={q.key} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <span className="dim mono">{i + 1}.</span> {q.q}
            </div>
            <div className="row" style={{ gap: 8 }}>
              {[true, false].map((v) => (
                <button key={String(v)} className={`pill ${a[q.key] === v ? 'active' : ''}`} onClick={() => setA((s) => ({ ...s, [q.key]: v }))}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button className="btn btn-sm btn-ghost" onClick={() => setA({})}>Reset</button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={rec.title || 'none'} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="card" style={{ minHeight: 220, borderColor: answered ? 'rgba(167,139,250,0.5)' : undefined }}>
          {answered ? (
            <>
              <div style={{ fontSize: '2.6rem' }}>{rec.icon}</div>
              <span className="tag violet">Recommendation</span>
              <h3 style={{ marginTop: 12, fontSize: '1.5rem' }}>{rec.title}</h3>
              <p className="muted">{rec.text}</p>
              <Callout type="tip" title="Plus, always">Turn on LangSmith tracing from day one — it works with every option.</Callout>
            </>
          ) : (
            <div className="muted" style={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '2.6rem' }}>🧭</div>
                Answer the four questions to get a recommendation.
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function LangChain() {
  const [b, setB] = useState(BLOCKS[0].id)
  const block = BLOCKS.find((x) => x.id === b)!
  return (
    <div className="page container">
      <SectionHead
        eyebrow="The ecosystem"
        title={<>LangChain, LangGraph & <span className="grad-text">friends</span></>}
        sub="Four products, one ecosystem. Understand what each does, how they fit together, and the LangChain building blocks you’ll use inside your graph nodes."
      />
      <div className="grid grid-4">
        {FAMILY.map((f, i) => (
          <Reveal key={f.name} delay={i * 0.06}>
            <GlowCard style={{ height: '100%', borderTop: `2px solid ${f.color}` }}>
              <div style={{ fontSize: '2rem' }}>{f.icon}</div>
              <h3 style={{ marginTop: 8 }}>{f.name}</h3>
              <span className="tag" style={{ color: f.color, borderColor: `${f.color}66` }}>{f.role}</span>
              <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: '0.93rem' }}>{f.text}</p>
            </GlowCard>
          </Reveal>
        ))}
      </div>

      <section className="section" style={{ paddingBottom: 0 }}>
        <SectionHead eyebrow="Side by side" title="What each one is for" />
        <div className="table-wrap">
          <table className="nice">
            <thead>
              <tr>
                <th></th>
                <th>LangChain</th>
                <th>LangGraph</th>
                <th>LangSmith</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Abstraction level', 'High (components, prebuilt agents)', 'Low (graph, state, runtime)', 'N/A — tooling platform'],
                ['Core unit', 'Runnable / chain / agent', 'Node, edge, state', 'Trace, run, dataset'],
                ['Control flow', 'Linear chains; agent loop via create_agent', 'Arbitrary: loops, branches, parallel, subgraphs', '—'],
                ['State & persistence', 'Via LangGraph under the hood', 'Checkpointers, threads, Store', 'Stores traces & eval results'],
                ['Human-in-the-loop', 'HITL middleware', 'interrupt() / Command(resume)', 'Annotation queues'],
                ['Best for', 'Quick starts, integrations, RAG', 'Custom, reliable, long-running agents', 'Debugging, evals, monitoring'],
                ['License', 'MIT (open source)', 'MIT (open source)', 'Commercial SaaS / self-host (free tier)'],
              ].map((r) => (
                <tr key={r[0]}>
                  <td><b>{r[0]}</b></td>
                  {r.slice(1).map((c, k) => <td key={k} className="muted">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="analogy">
          LangChain is the <b>toolbox</b> (standardized parts), LangGraph is the <b>assembly line</b> (controls how work flows, where it pauses and resumes),
          LangSmith is the <b>quality-control lab</b> (watches and measures everything), and the deployment platform is the <b>factory building</b> that runs it all at scale.
        </Callout>
      </section>

      <section className="section">
        <SectionHead eyebrow="LangChain building blocks" title={<>The parts you’ll use <span className="grad-text">inside nodes</span></>} sub="LangGraph nodes are just functions — these LangChain components are what most of them call." />
        <div className="pills" style={{ marginBottom: 20 }}>
          {BLOCKS.map((x) => (
            <button key={x.id} className={`pill ${b === x.id ? 'active' : ''}`} onClick={() => setB(x.id)}>
              {x.icon} {x.title}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={block.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="card">
              <h3>{block.icon} {block.title}</h3>
              <p className="muted" style={{ margin: 0 }}>{block.text}</p>
            </div>
            <CodeBlock code={block.code} />
          </motion.div>
        </AnimatePresence>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <SectionHead eyebrow="Putting it together" title="LangChain components inside a LangGraph" />
        <CodeBlock
          title="support_bot.py"
          code={{
            python: `from typing import Literal
from pydantic import BaseModel
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import InMemorySaver

llm = init_chat_model("anthropic:claude-sonnet-4-5")          # LangChain model

class Intent(BaseModel):
    kind: Literal["orders", "faq"]

class State(MessagesState):
    intent: str

def classify(state: State):                                     # LangGraph node
    intent = llm.with_structured_output(Intent).invoke(state["messages"])  # LangChain
    return {"intent": intent.kind}

faq_chain = ChatPromptTemplate.from_messages(                   # LCEL chain
    [("system", "Answer from the FAQ:\\n{faq}"), ("placeholder", "{messages}")]
) | llm

def faq(state: State):
    return {"messages": [faq_chain.invoke({"faq": FAQ_TEXT, "messages": state["messages"]})]}

def orders_agent(state: State):
    return {"messages": [llm.bind_tools([search_orders]).invoke(state["messages"])]}

g = StateGraph(State)
g.add_node("classify", classify)
g.add_node("faq", faq)
g.add_node("orders", orders_agent)
g.add_node("tools", ToolNode([search_orders]))
g.add_edge(START, "classify")
g.add_conditional_edges("classify", lambda s: s["intent"], {"faq": "faq", "orders": "orders"})
g.add_conditional_edges("orders", tools_condition)
g.add_edge("tools", "orders")
g.add_edge("faq", END)
app = g.compile(checkpointer=InMemorySaver())                   # traced in LangSmith`,
          }}
        />
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <SectionHead eyebrow="Decision helper" title={<>Which one should <span className="grad-text">I</span> use?</>} />
        <Decider />
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <SectionHead eyebrow="History" title="How we got here" />
        <div className="roadmap">
          {[
            ['2022', 'LangChain launches as an open-source Python library for composing LLM calls, prompts and tools.'],
            ['2023', 'LCEL introduces the Runnable protocol; LangSmith launches for tracing and evaluation; JS library matures.'],
            ['2024', 'LangGraph is released for cyclic, stateful agent workflows. LangGraph Cloud/Platform and LangGraph Studio follow.'],
            ['2025', 'LangChain & LangGraph reach 1.0. LangChain agents are rebuilt on the LangGraph runtime with middleware; the deployment platform joins LangSmith.'],
          ].map(([y, t], i) => (
            <Reveal key={y} delay={i * 0.06}>
              <div className="road-step">
                <div className="road-dot" style={{ fontSize: '0.78rem' }}>{y}</div>
                <div className="card" style={{ flex: 1, padding: '14px 18px' }}>{t}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link to="/learn" className="btn btn-primary">Dive into LangGraph lessons →</Link>
        </div>
      </section>
    </div>
  )
}
