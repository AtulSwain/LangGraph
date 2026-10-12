import { useLocation } from 'react-router-dom'
import { NavLink, Link, useNavigate } from './nav'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Icon from './Icon'
import Contact, { CONTACT_EMAIL } from './Contact'
import { CONCEPTS } from '../data/concepts'
import { PATTERNS } from '../data/patterns'
import { PROJECTS } from '../data/projects'
import { GLOSSARY } from '../data/glossary'

const GROUPS = [
  {
    label: 'Learn',
    items: [
      { to: '/learn', label: 'Study Guide', desc: `${CONCEPTS.length} lessons, zero to production`, icon: 'GraduationCap' },
      { to: '/projects', label: 'Projects', desc: 'Six complete, buildable agents', icon: 'Hammer' },
      { to: '/interview', label: 'Interview Prep', desc: 'Thirty questions with model answers', icon: 'CircleHelp' },
      { to: '/quiz', label: 'Quiz', desc: 'Test yourself and earn a rank', icon: 'Trophy' },
    ],
  },
  {
    label: 'Explore',
    items: [
      { to: '/architecture', label: 'Architecture 3D', desc: 'The stack and the Pregel engine', icon: 'Box' },
      { to: '/patterns', label: 'Agent Patterns', desc: 'Twelve architectures, animated', icon: 'Network' },
      { to: '/playground', label: 'Playground', desc: 'Simulate runs, build graphs', icon: 'Gamepad2' },
      { to: '/models', label: 'Models', desc: 'Providers and picking models per node', icon: 'Cpu' },
    ],
  },
  {
    label: 'Ecosystem',
    items: [
      { to: '/langchain', label: 'LangChain Family', desc: 'LangChain, LangGraph, LangSmith', icon: 'Layers' },
      { to: '/compare', label: 'Compare Frameworks', desc: 'LangGraph vs CrewAI, AutoGen, …', icon: 'Scale' },
      { to: '/resources', label: 'Resources & News', desc: 'Official links and timeline', icon: 'Library' },
      { to: '/glossary', label: 'Cheatsheet', desc: 'APIs and glossary at a glance', icon: 'FileText' },
    ],
  },
]

export function Logo() {
  return (
    <svg width="18" height="18" viewBox="0 0 64 64" aria-hidden>
      <g stroke="#fff" strokeWidth="4" fill="none">
        <path d="M14 14 L50 32 L14 50 Z" />
      </g>
      <circle cx="14" cy="14" r="7" fill="#fff" />
      <circle cx="50" cy="32" r="7" fill="#000" stroke="#fff" strokeWidth="4" />
      <circle cx="14" cy="50" r="7" fill="#fff" />
    </svg>
  )
}

// ───────────────────────── Command palette ─────────────────────────
interface Hit {
  type: string
  title: string
  sub: string
  to: string
  icon: string
}

function useSearchIndex(): Hit[] {
  return useMemo(() => {
    const pages: Hit[] = [{ type: 'Page', title: 'Home', sub: 'Start here', to: '/', icon: 'Orbit' }, ...GROUPS.flatMap((g) => g.items.map((i) => ({ type: 'Page', title: i.label, sub: i.desc, to: i.to, icon: i.icon })))]
    const lessons = CONCEPTS.map((c) => ({ type: 'Lesson', title: c.title, sub: c.tagline, to: `/learn/${c.id}`, icon: c.icon }))
    const patterns = PATTERNS.map((p) => ({ type: 'Pattern', title: p.name, sub: p.summary, to: `/patterns/${p.id}`, icon: p.icon }))
    const projects = PROJECTS.map((p) => ({ type: 'Project', title: p.title, sub: p.summary, to: `/projects/${p.id}`, icon: p.icon }))
    const terms = GLOSSARY.map((t) => ({ type: 'Term', title: t.term, sub: t.def, to: `/glossary?q=${encodeURIComponent(t.term)}`, icon: 'BookOpen' }))
    return [...pages, ...lessons, ...patterns, ...projects, ...terms]
  }, [])
}

function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const index = useSearchIndex()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const nav = useNavigate()
  const input = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return index.filter((h) => h.type === 'Page')
    const words = t.split(/\s+/)
    return index
      .map((h) => {
        const hay = (h.title + ' ' + h.sub + ' ' + h.type).toLowerCase()
        if (!words.every((w) => hay.includes(w))) return null
        const score = (h.title.toLowerCase().startsWith(t) ? 0 : h.title.toLowerCase().includes(t) ? 1 : 2) + (h.type === 'Term' ? 0.5 : 0)
        return { h, score }
      })
      .filter(Boolean)
      .sort((a, b) => a!.score - b!.score)
      .slice(0, 30)
      .map((x) => x!.h)
  }, [q, index])

  useEffect(() => {
    if (open) {
      setQ('')
      setSel(0)
      setTimeout(() => input.current?.focus(), 30)
    }
  }, [open])
  useEffect(() => setSel(0), [q])

  const go = (h?: Hit) => {
    if (!h) return
    nav(h.to)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="palette-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="palette"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="palette-input">
              <Icon name="Search" size={18} />
              <input
                ref={input}
                autoFocus
                value={q}
                placeholder="Search lessons, patterns, projects, terms…"
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
                  if (e.key === 'Enter') go(results[sel])
                  if (e.key === 'Escape') onClose()
                }}
              />
              <span className="kbd">esc</span>
            </div>
            <div className="palette-results">
              {results.length === 0 && <div className="dim" style={{ padding: 20 }}>No results for “{q}”.</div>}
              {results.map((h, i) => (
                <button key={h.type + h.to + h.title} className={`palette-item ${i === sel ? 'sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => go(h)}>
                  <Icon name={h.icon} size={16} />
                  <span className="pi-main">
                    <b>{h.title}</b>
                    <span>{h.sub}</span>
                  </span>
                  <span className="pi-type">{h.type}</span>
                </button>
              ))}
            </div>
            <div className="palette-foot">
              <span><span className="kbd">↑</span> <span className="kbd">↓</span> navigate</span>
              <span><span className="kbd">↵</span> open</span>
              <span>{index.length} items indexed</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Nav() {
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState<string | null>(null)
  const [palette, setPalette] = useState(false)
  const { pathname } = useLocation()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  useEffect(() => {
    setOpen(false)
    setMenu(null)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
      }
      const tag = (e.target as HTMLElement)?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        setPalette(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const groupActive = (g: (typeof GROUPS)[number]) => g.items.some((i) => pathname === i.to || pathname.startsWith(i.to + '/'))

  return (
    <>
      <nav className="nav" onMouseLeave={() => setMenu(null)}>
        <div className="nav-inner">
          <Link to="/" className="brand">
            <span className="brand-logo"><Logo /></span>
            LangGraph <span className="serif italic" style={{ fontSize: '1.15rem', fontWeight: 400 }}>Universe</span>
          </Link>

          <div className={`nav-links ${open ? 'open' : ''}`}>
            {GROUPS.map((g) => (
              <div key={g.label} className="nav-group" onMouseEnter={() => setMenu(g.label)}>
                <button className={`nav-trigger ${groupActive(g) ? 'active' : ''}`} onClick={() => setMenu((m) => (m === g.label ? null : g.label))}>
                  {g.label} <Icon name="ChevronDown" size={14} />
                </button>
                <AnimatePresence>
                  {menu === g.label && (
                    <motion.div className="nav-menu" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}>
                      {g.items.map((i) => (
                        <NavLink key={i.to} to={i.to} className={({ isActive }) => `nav-menu-item ${isActive ? 'active' : ''}`}>
                          <span className="nmi-icon"><Icon name={i.icon} size={17} /></span>
                          <span>
                            <b>{i.label}</b>
                            <span>{i.desc}</span>
                          </span>
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* mobile: flat list */}
                <div className="nav-mobile-list">
                  {g.items.map((i) => (
                    <NavLink key={i.to} to={i.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                      <Icon name={i.icon} size={15} /> {i.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button className="search-btn" onClick={() => setPalette(true)} aria-label="Search">
            <Icon name="Search" size={15} />
            <span className="search-label">Search</span>
            <span className="kbd">⌘K</span>
          </button>
          <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            <Icon name={open ? 'X' : 'Menu'} size={18} />
          </button>
        </div>
      </nav>
      <motion.div className="scroll-progress" style={{ scaleX, right: 0 }} />
      <Palette open={palette} onClose={() => setPalette(false)} />
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <Contact />
        <div className="footer-big serif">
          Think in <i>graphs.</i>
        </div>
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 12 }}>
              <span className="brand-logo"><Logo /></span> LangGraph <span className="serif italic" style={{ fontSize: '1.15rem', fontWeight: 400 }}>Universe</span>
            </div>
            <p style={{ maxWidth: 380 }}>
              An independent, interactive study guide to LangGraph and the LangChain ecosystem. Not affiliated with LangChain, Inc. APIs move fast — always confirm details in the official docs.
            </p>
            <p style={{ maxWidth: 380 }}>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
          </div>
          {GROUPS.map((g) => (
            <div key={g.label}>
              <h5>{g.label}</h5>
              {g.items.map((i) => (
                <Link key={i.to} to={i.to}>{i.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} LangGraph Universe</span>
          <span className="edu-note">For educational purposes only.</span>
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
