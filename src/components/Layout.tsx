import { NavLink, Link, useLocation } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/learn', label: 'Study Guide' },
  { to: '/architecture', label: 'Architecture 3D' },
  { to: '/patterns', label: 'Patterns' },
  { to: '/playground', label: 'Playground' },
  { to: '/langchain', label: 'LangChain' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/glossary', label: 'Cheatsheet' },
]

export function Logo() {
  return (
    <svg width="20" height="20" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <g stroke="url(#lg)" strokeWidth="5" fill="none">
        <path d="M14 14 L50 32 L14 50" />
        <path d="M14 14 L14 50" />
      </g>
      <circle cx="14" cy="14" r="7" fill="#22d3ee" />
      <circle cx="50" cy="32" r="7" fill="#a78bfa" />
      <circle cx="14" cy="50" r="7" fill="#f472b6" />
    </svg>
  )
}

export function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  useEffect(() => setOpen(false), [pathname])
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand">
            <span className="brand-logo"><Logo /></span>
            LangGraph <span className="grad-text">Universe</span>
          </Link>
          <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? '✕' : '☰'}
          </button>
          <div className={`nav-links ${open ? 'open' : ''}`}>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <motion.div className="scroll-progress" style={{ scaleX, right: 0 }} />
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand" style={{ marginBottom: 12 }}>
            <span className="brand-logo"><Logo /></span> LangGraph <span className="grad-text">Universe</span>
          </div>
          <p style={{ maxWidth: 380 }}>
            An independent, interactive study guide to LangGraph and the LangChain ecosystem. Not affiliated with LangChain, Inc.
            Always check the official docs for the latest API details.
          </p>
        </div>
        <div>
          <h5>Learn</h5>
          <Link to="/learn">Study Guide</Link>
          <Link to="/patterns">Agent Patterns</Link>
          <Link to="/quiz">Quiz</Link>
        </div>
        <div>
          <h5>Explore</h5>
          <Link to="/architecture">Architecture 3D</Link>
          <Link to="/playground">Playground</Link>
          <Link to="/glossary">Cheatsheet</Link>
        </div>
        <div>
          <h5>Official</h5>
          <a href="https://langchain-ai.github.io/langgraph/" target="_blank" rel="noreferrer">LangGraph docs</a>
          <a href="https://python.langchain.com/" target="_blank" rel="noreferrer">LangChain docs</a>
          <a href="https://github.com/langchain-ai/langgraph" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://academy.langchain.com/" target="_blank" rel="noreferrer">LangChain Academy</a>
        </div>
      </div>
    </footer>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  )
}
