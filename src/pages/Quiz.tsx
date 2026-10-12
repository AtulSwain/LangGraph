import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { QUIZ } from '../data/quiz'
import { SectionHead } from '../components/Reveal'
import { SceneLights } from '../components/Graph3D'

const RANKS = [
  { min: 0, name: 'Node Novice', color: '#94a3b8', note: 'Every graph starts at START. Revisit the Foundations module and try again!' },
  { min: 0.5, name: 'Edge Explorer', color: '#60a5fa', note: 'Solid basics. Review persistence and human-in-the-loop to level up.' },
  { min: 0.75, name: 'State Strategist', color: '#a78bfa', note: 'Impressive! You understand how LangGraph really works.' },
  { min: 0.9, name: 'Graph Architect', color: '#fbbf24', note: 'Outstanding. You’re ready to design production multi-agent systems.' },
]

function Trophy({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.8
      ref.current.rotation.x += dt * 0.3
    }
  })
  return (
    <Float speed={2} floatIntensity={1}>
      <mesh ref={ref}>
        <torusKnotGeometry args={[1, 0.32, 160, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.8} roughness={0.15} />
      </mesh>
    </Float>
  )
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Quiz() {
  const [seed, setSeed] = useState(0)
  const questions = useMemo(() => shuffle(QUIZ), [seed]) // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState<string[]>([])
  const done = i >= questions.length
  const q = questions[i]

  const choose = (k: number) => {
    if (picked !== null) return
    setPicked(k)
    if (k === q.answer) setScore((s) => s + 1)
    else setMissed((m) => [...m, q.topic])
  }
  const next = () => {
    setPicked(null)
    setI((x) => x + 1)
  }
  const restart = () => {
    setSeed((s) => s + 1)
    setI(0)
    setPicked(null)
    setScore(0)
    setMissed([])
  }

  const ratio = score / questions.length
  const rank = [...RANKS].reverse().find((r) => ratio >= r.min)!
  const weak = Array.from(new Set(missed))

  return (
    <div className="page container" style={{ maxWidth: 860 }}>
      <SectionHead center eyebrow="Test yourself" title={<>The LangGraph <span className="grad-text">certification quiz</span></>} sub={`${QUIZ.length} questions covering every module. Instant feedback with explanations.`} />

      {!done ? (
        <>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="tag violet">{q.topic}</span>
            <span className="mono dim">
              {i + 1} / {questions.length} · score {score}
            </span>
          </div>
          <div className="progress" style={{ marginBottom: 24 }}>
            <div style={{ width: `${(i / questions.length) * 100}%` }} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <div className="card" style={{ padding: 28 }}>
                <h3 style={{ fontSize: '1.35rem', marginBottom: 22 }}>{q.q}</h3>
                {q.options.map((o, k) => (
                  <button
                    key={k}
                    className={`q-option ${picked !== null && k === q.answer ? 'correct' : ''} ${picked === k && k !== q.answer ? 'wrong' : ''}`}
                    disabled={picked !== null}
                    onClick={() => choose(k)}
                  >
                    <span className="mono dim" style={{ marginRight: 10 }}>{String.fromCharCode(65 + k)}</span>
                    {o}
                  </button>
                ))}
                {picked !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`callout ${picked === q.answer ? 'tip' : 'warn'}`}>
                    <div className="ci">{picked === q.answer ? '🎉' : '📘'}</div>
                    <div>
                      <strong>{picked === q.answer ? 'Correct!' : 'Not quite.'}</strong>
                      <div className="muted">{q.explain}</div>
                    </div>
                  </motion.div>
                )}
                {picked !== null && (
                  <div style={{ textAlign: 'right' }}>
                    <button className="btn btn-primary" onClick={next}>
                      {i === questions.length - 1 ? 'See results' : 'Next question →'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ height: 260 }}>
            <Canvas camera={{ position: [0, 0, 5] }}>
              <SceneLights />
              <Trophy color={rank.color} />
              <Sparkles count={80} scale={6} size={3} color={rank.color} />
            </Canvas>
          </div>
          <div className="eyebrow">Your rank</div>
          <h2 style={{ fontSize: '2.6rem', color: rank.color }}>{rank.name}</h2>
          <p style={{ fontSize: '1.3rem' }}>
            {score} / {questions.length} correct ({Math.round(ratio * 100)}%)
          </p>
          <p className="muted">{rank.note}</p>
          {weak.length > 0 && (
            <p className="muted">
              Topics to review: {weak.map((w) => <span key={w} className="tag amber" style={{ margin: 3 }}>{w}</span>)}
            </p>
          )}
          <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={restart}>↺ Retry (shuffled)</button>
            <Link to="/learn" className="btn">Back to the study guide</Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
