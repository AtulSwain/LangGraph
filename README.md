# LangGraph Universe

An interactive, 3D study guide to **LangGraph** and the **LangChain** ecosystem — built with React.

## What's inside

| Page | What you get |
| --- | --- |
| **Home** | 3D graph constellation hero, a live animated ReAct agent loop, why LangGraph, learning roadmap, FAQ |
| **Study Guide** | 27 lessons in 7 modules (Foundations → Control Flow → Tools & Agents → Persistence & Memory → Human-in-the-Loop → Streaming & Runtime → Production). Each has an explanation, analogy, Python + TypeScript code, an animated 3D diagram, pitfalls and takeaways. Progress is saved in your browser. |
| **Architecture 3D** | Clickable 3D model of the ecosystem stack (models → LangChain Core → LangChain → LangGraph → Deployment, with LangSmith as a pillar), a step-through Pregel super-step visualizer, the life of a production run, and the persistence model |
| **Patterns** | 12 agent architectures (prompt chaining, routing, parallelization, ReAct, plan-and-execute, reflection, orchestrator-workers, supervisor, swarm, hierarchical teams, agentic RAG, human approval), each animated in 3D with how/when/pros/cons and code |
| **Playground** | Execution simulator with checkpoints, `interrupt()` approve/reject, time travel and forking; plus a graph builder that validates your graph and generates Python & TypeScript code |
| **LangChain** | How LangChain, LangGraph, LangSmith and the deployment platform fit together; LangChain building blocks with code; a "which should I use?" decision helper |
| **Quiz** | 22 shuffled questions with explanations and a 3D rank trophy |
| **Cheatsheet** | Copy-ready API snippets and a searchable glossary |

## Tech stack

- **React 18 + TypeScript + Vite**
- **three.js** via **@react-three/fiber** and **@react-three/drei** for all 3D scenes
- **Framer Motion** for page transitions and scroll reveals
- **prism-react-renderer** for syntax-highlighted, tabbed (Python/TS) code blocks
- **React Router** (hash routing, so the build works on any static host)

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Deploy

`dist/` is fully static (relative asset paths + hash routing), so it can be dropped onto GitHub Pages, Netlify, Vercel, S3, or any web server with no extra configuration.

## Project layout

```
src/
  components/   Graph3D (reusable 3D graph engine), CodeBlock, Callout, Layout, Reveal, Md
  data/         concepts.ts (lessons), patterns.ts, graphs.ts (3D graph presets), quiz.ts, glossary.ts
  pages/        Home, Learn, Architecture, Patterns, Playground, LangChain, Quiz, Glossary
```

To add a lesson, append an entry to `src/data/concepts.ts`; to add a 3D diagram, add a preset to `src/data/graphs.ts` and reference it via `diagram`.

> This is an independent learning resource, not affiliated with LangChain, Inc. APIs evolve quickly — check the official docs for the latest details.
