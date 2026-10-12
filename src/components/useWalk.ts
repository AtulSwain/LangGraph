import { useEffect, useMemo, useState } from 'react'
import { GRAPHS } from '../data/graphs'
import { edgeKey } from './Graph3D'

/** Walks the diagram's edges from START, lighting one hop at a time. */
export function useWalk(graphId?: string) {
  const g = graphId ? GRAPHS[graphId] : undefined
  const path = useMemo(() => {
    if (!g) return [] as string[]
    const out = ['__start__']
    const seen = new Set(out)
    let cur = '__start__'
    for (let i = 0; i < 12; i++) {
      const nexts = g.edges.filter((e) => e.from === cur)
      if (!nexts.length) break
      const fresh = nexts.find((e) => !seen.has(e.to)) ?? nexts[0]
      cur = fresh.to
      out.push(cur)
      if (cur === '__end__') break
      seen.add(cur)
    }
    return out
  }, [g])
  const [i, setI] = useState(0)
  useEffect(() => {
    setI(0)
    if (!path.length) return
    const t = setInterval(() => setI((x) => (x + 1) % path.length), 1300)
    return () => clearInterval(t)
  }, [path])
  const active = path[i]
  const prev = i > 0 ? path[i - 1] : undefined
  return { active: active ? [active] : [], edges: prev ? [edgeKey(prev, active)] : [] }
}

