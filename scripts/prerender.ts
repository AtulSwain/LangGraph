/**
 * Post-build: give every route its own HTML file so each page is a real URL.
 *  - dist/<route>/index.html with a route-specific <title>, description, canonical and Open Graph tags
 *  - dist/404.html fallback, dist/sitemap.xml and dist/robots.txt for search engines
 * Run after `vite build` (see package.json "build").
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { CONCEPTS } from '../src/data/concepts'
import { PATTERNS } from '../src/data/patterns'
import { PROJECTS } from '../src/data/projects'

const DIST = join(import.meta.dirname, '..', 'dist')
const SITE = (process.env.SITE_URL ?? 'https://atulswain.github.io/LangGraph').replace(/\/$/, '')
const BRAND = 'LangGraph Universe'
const EDU = ' For educational purposes only.'

interface Page {
  path: string // "/" or "/learn/state/"
  title: string
  description: string
}

const pages: Page[] = [
  { path: '/', title: `${BRAND} — Interactive 3D guide to LangGraph & LangChain`, description: 'Learn LangGraph, LangChain and LangSmith with 3D visualizations, live simulations, real projects, patterns and a quiz.' },
  { path: '/learn/', title: `Study Guide — ${CONCEPTS.length} LangGraph lessons | ${BRAND}`, description: 'A complete LangGraph curriculum from state, nodes and edges to multi-agent systems, persistence, human-in-the-loop and production.' },
  { path: '/projects/', title: `Projects — build real LangGraph agents | ${BRAND}`, description: 'Complete, runnable LangGraph projects: support router, research assistant, SQL agent, RAG chatbot, email assistant and a multi-agent team.' },
  { path: '/interview/', title: `LangGraph Interview Questions & Answers | ${BRAND}`, description: 'Thirty LangGraph and agent-engineering interview questions with concise model answers and flash cards.' },
  { path: '/quiz/', title: `LangGraph Quiz | ${BRAND}`, description: 'Test your LangGraph knowledge with an interactive quiz and explanations.' },
  { path: '/architecture/', title: `LangGraph Architecture in 3D | ${BRAND}`, description: 'The LangChain ecosystem stack and the Pregel super-step runtime, visualized in interactive 3D.' },
  { path: '/patterns/', title: `Agent Architecture Patterns | ${BRAND}`, description: 'ReAct, plan-and-execute, reflection, supervisor, swarm, agentic RAG and more — animated in 3D with code.' },
  { path: '/playground/', title: `LangGraph Playground & Graph Builder | ${BRAND}`, description: 'Simulate LangGraph runs with checkpoints, interrupts and time travel, and build graphs that generate code.' },
  { path: '/models/', title: `Choosing LLM Models for LangGraph | ${BRAND}`, description: 'Model providers for LangGraph agents and how to pick the right model for each node.' },
  { path: '/langchain/', title: `LangChain, LangGraph & LangSmith Explained | ${BRAND}`, description: 'How LangChain, LangGraph, LangSmith and LangSmith Deployment fit together, with code examples.' },
  { path: '/compare/', title: `LangGraph vs CrewAI, AutoGen & More | ${BRAND}`, description: 'A practical comparison of LangGraph with CrewAI, AutoGen, OpenAI Agents SDK, LlamaIndex, Pydantic AI, Google ADK and Mastra.' },
  { path: '/resources/', title: `LangGraph Resources & News | ${BRAND}`, description: 'Official docs, repositories, courses, a learning path and a timeline of the LangChain ecosystem.' },
  { path: '/glossary/', title: `LangGraph Cheatsheet & Glossary | ${BRAND}`, description: 'Copy-ready LangGraph API snippets and a searchable glossary of key terms.' },
  ...CONCEPTS.map((c) => ({ path: `/learn/${c.id}/`, title: `${c.title} — LangGraph Study Guide | ${BRAND}`, description: c.tagline })),
  ...PATTERNS.map((p) => ({ path: `/patterns/${p.id}/`, title: `${p.name} — Agent Pattern | ${BRAND}`, description: p.summary })),
  ...PROJECTS.map((p) => ({ path: `/projects/${p.id}/`, title: `${p.title} — LangGraph Project | ${BRAND}`, description: p.summary })),
]

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const template = readFileSync(join(DIST, 'index.html'), 'utf8')
if (!/<title>[^<]*<\/title>/.test(template) || !/<meta name="description" content="[^"]*"\s*\/?>/.test(template)) {
  throw new Error('prerender: index.html is missing <title> or meta description')
}

function render(page: Page, { noindex = false } = {}) {
  const url = SITE + page.path
  const desc = page.description + EDU
  const head = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    noindex ? `<meta name="robots" content="noindex" />` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(desc)}" />`)
    .replace('</head>', `    ${head}\n  </head>`)
}

for (const page of pages) {
  const file = join(DIST, page.path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, render(page))
}
writeFileSync(join(DIST, '404.html'), render({ path: '/404/', title: `Page not found | ${BRAND}`, description: 'This page does not exist.' }, { noindex: true }))

const today = new Date().toISOString().slice(0, 10)
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${esc(SITE + p.path)}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`,
)
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`prerender: wrote ${pages.length} pages, 404.html, sitemap.xml and robots.txt`)
