import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line, OrbitControls, Stars, Float } from '@react-three/drei'
import { useMemo, useRef, useState, Suspense } from 'react'
import * as THREE from 'three'

export type NodeKind = 'start' | 'end' | 'llm' | 'tool' | 'human' | 'router' | 'agent' | 'data' | 'default'

export interface GNode {
  id: string
  label?: string
  pos: [number, number, number]
  kind?: NodeKind
}

export interface GEdge {
  from: string
  to: string
  conditional?: boolean
  label?: string
}

export const KIND_COLORS: Record<NodeKind, string> = {
  start: '#34d399',
  end: '#fb7185',
  llm: '#a78bfa',
  tool: '#fbbf24',
  human: '#f472b6',
  router: '#60a5fa',
  agent: '#22d3ee',
  data: '#2dd4bf',
  default: '#c4b5fd',
}

export const KIND_LABELS: Record<NodeKind, string> = {
  start: 'START',
  end: 'END',
  llm: 'LLM call',
  tool: 'Tool',
  human: 'Human',
  router: 'Router',
  agent: 'Agent',
  data: 'Data / Retrieval',
  default: 'Node',
}

export const edgeKey = (from: string, to: string) => `${from}->${to}`

function buildCurve(a: THREE.Vector3, b: THREE.Vector3, bend: number) {
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const dir = b.clone().sub(a)
  const len = dir.length()
  let perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1))
  if (perp.lengthSq() < 1e-6) perp = new THREE.Vector3(1, 0, 0)
  perp.normalize()
  mid.add(perp.multiplyScalar(bend * Math.min(len, 6) * 0.18))
  mid.z += bend * 0.35
  return new THREE.QuadraticBezierCurve3(a, mid, b)
}

function NodeMesh({
  node,
  active,
  dimmed,
  showLabel,
  onClick,
}: {
  node: GNode
  active: boolean
  dimmed: boolean
  showLabel: boolean
  onClick?: (id: string) => void
}) {
  const ref = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const [hover, setHover] = useState(false)
  const kind = node.kind ?? 'default'
  const color = KIND_COLORS[kind]
  const isTerminal = kind === 'start' || kind === 'end'

  useFrame((s, dt) => {
    if (!ref.current) return
    const target = active ? 1.35 + Math.sin(s.clock.elapsedTime * 6) * 0.08 : hover ? 1.18 : 1
    const sc = THREE.MathUtils.lerp(ref.current.scale.x, target, 1 - Math.pow(0.001, dt))
    ref.current.scale.setScalar(sc)
    ref.current.rotation.y += dt * (active ? 2.2 : 0.35)
    ref.current.rotation.x += dt * 0.15
    if (ring.current) {
      ring.current.rotation.z += dt * 1.5
      const rs = active ? 1 + ((s.clock.elapsedTime * 1.2) % 1) * 0.6 : 0.001
      ring.current.scale.setScalar(rs)
      const m = ring.current.material as THREE.MeshBasicMaterial
      m.opacity = active ? 0.7 * (1 - ((s.clock.elapsedTime * 1.2) % 1)) : 0
    }
  })

  return (
    <group position={node.pos}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.(node.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          if (onClick) document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        {isTerminal ? <octahedronGeometry args={[0.36, 0]} /> : kind === 'tool' ? <boxGeometry args={[0.5, 0.5, 0.5]} /> : kind === 'human' ? <torusKnotGeometry args={[0.22, 0.08, 80, 12]} /> : kind === 'router' ? <coneGeometry args={[0.34, 0.6, 6]} /> : <icosahedronGeometry args={[0.38, 1]} />}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1.6 : hover ? 0.9 : 0.45}
          roughness={0.25}
          metalness={0.4}
          transparent
          opacity={dimmed ? 0.35 : 1}
          flatShading
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.62, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.12 : 0.04} depthWrite={false} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.025, 8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
      </mesh>
      {active && <pointLight color={color} intensity={6} distance={4} />}
      {showLabel && (
        <Html center position={[0, -0.25, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`node-label ${active ? 'active' : ''}`} style={{ opacity: dimmed ? 0.5 : 1 }}>
            {node.label ?? node.id}
          </div>
        </Html>
      )}
    </group>
  )
}

function EdgeMesh({
  curve,
  color,
  conditional,
  active,
  label,
  particles,
}: {
  curve: THREE.QuadraticBezierCurve3
  color: string
  conditional?: boolean
  active: boolean
  label?: string
  particles: number
}) {
  const points = useMemo(() => curve.getPoints(40), [curve])
  const pRefs = useRef<(THREE.Mesh | null)[]>([])
  const arrow = useMemo(() => {
    const t = 0.86
    const p = curve.getPointAt(t)
    const tan = curve.getTangentAt(t).normalize()
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan)
    return { p, q }
  }, [curve])
  const offsets = useMemo(() => Array.from({ length: particles }, (_, i) => i / Math.max(particles, 1)), [particles])

  useFrame((s) => {
    const speed = active ? 0.9 : 0.22
    offsets.forEach((o, i) => {
      const m = pRefs.current[i]
      if (!m) return
      const t = (s.clock.elapsedTime * speed + o) % 1
      m.position.copy(curve.getPointAt(t))
      const sc = active ? 1.4 : 0.8
      m.scale.setScalar(sc * (0.6 + Math.sin(t * Math.PI) * 0.6))
    })
  })

  const mid = curve.getPointAt(0.5)

  return (
    <group>
      <Line
        points={points}
        color={active ? '#ffffff' : color}
        lineWidth={active ? 3 : 1.4}
        dashed={conditional}
        dashSize={0.18}
        gapSize={0.12}
        transparent
        opacity={active ? 1 : 0.55}
      />
      <mesh position={arrow.p} quaternion={arrow.q}>
        <coneGeometry args={[0.08, 0.22, 10]} />
        <meshBasicMaterial color={active ? '#ffffff' : color} transparent opacity={active ? 1 : 0.8} />
      </mesh>
      {offsets.map((_, i) => (
        <mesh key={i} ref={(el) => (pRefs.current[i] = el)}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshBasicMaterial color={active ? '#ffffff' : color} />
        </mesh>
      ))}
      {label && (
        <Html center position={mid} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="edge-label">{label}</div>
        </Html>
      )}
    </group>
  )
}

export function GraphScene({
  nodes,
  edges,
  activeNodes = [],
  activeEdges = [],
  onNodeClick,
  showLabels = true,
  particles = 2,
  focusDim = false,
}: {
  nodes: GNode[]
  edges: GEdge[]
  activeNodes?: string[]
  activeEdges?: string[]
  onNodeClick?: (id: string) => void
  showLabels?: boolean
  particles?: number
  focusDim?: boolean
}) {
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes])
  const curves = useMemo(() => {
    const pairs = new Set(edges.map((e) => edgeKey(e.from, e.to)))
    return edges
      .filter((e) => byId[e.from] && byId[e.to])
      .map((e) => {
        const a = new THREE.Vector3(...byId[e.from].pos)
        const b = new THREE.Vector3(...byId[e.to].pos)
        const hasReverse = pairs.has(edgeKey(e.to, e.from))
        // the perpendicular flips with direction, so a constant bend puts reverse edges on opposite sides
        const bend = hasReverse ? 1.1 : 0.35
        // shorten so the curve starts/ends at the node surfaces
        const dir = b.clone().sub(a).normalize()
        const a2 = a.clone().add(dir.clone().multiplyScalar(0.5))
        const b2 = b.clone().sub(dir.clone().multiplyScalar(0.55))
        return { e, curve: buildCurve(a2, b2, bend) }
      })
  }, [edges, byId])

  const anyActive = activeNodes.length > 0

  return (
    <group>
      {curves.map(({ e, curve }) => {
        const k = edgeKey(e.from, e.to)
        const col = e.conditional ? '#fbbf24' : '#8b8fd9'
        return (
          <EdgeMesh
            key={k}
            curve={curve}
            color={col}
            conditional={e.conditional}
            active={activeEdges.includes(k)}
            label={e.label}
            particles={particles}
          />
        )
      })}
      {nodes.map((n) => (
        <NodeMesh
          key={n.id}
          node={n}
          active={activeNodes.includes(n.id)}
          dimmed={focusDim && anyActive && !activeNodes.includes(n.id)}
          showLabel={showLabels}
          onClick={onNodeClick}
        />
      ))}
    </group>
  )
}

export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 6]} intensity={1.2} />
      <pointLight position={[-6, -4, 4]} intensity={20} color="#a78bfa" distance={30} />
      <pointLight position={[6, 4, -4]} intensity={20} color="#22d3ee" distance={30} />
    </>
  )
}

export default function Graph3D({
  height = 460,
  camera = [0, 0, 11],
  autoRotate = false,
  stars = true,
  floating = true,
  controls = true,
  children,
  ...sceneProps
}: {
  height?: number | string
  camera?: [number, number, number]
  autoRotate?: boolean
  stars?: boolean
  floating?: boolean
  controls?: boolean
  children?: React.ReactNode
} & React.ComponentProps<typeof GraphScene>) {
  return (
    <div className="stage" style={{ height }}>
      <Canvas camera={{ position: camera, fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <SceneLights />
          {stars && <Stars radius={60} depth={40} count={1400} factor={3} saturation={0} fade speed={0.6} />}
          {floating ? (
            <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.35}>
              <GraphScene {...sceneProps} />
            </Float>
          ) : (
            <GraphScene {...sceneProps} />
          )}
          {controls && (
            <OrbitControls
              enablePan={false}
              enableDamping
              autoRotate={autoRotate}
              autoRotateSpeed={0.6}
              minDistance={4}
              maxDistance={24}
              makeDefault
            />
          )}
        </Suspense>
      </Canvas>
      {children}
      <div className="stage-hint">drag to orbit · scroll to zoom</div>
    </div>
  )
}

export function Legend({ kinds }: { kinds: NodeKind[] }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      {kinds.map((k) => (
        <span key={k} className="tag" style={{ background: 'rgba(6,7,20,0.75)' }}>
          <i style={{ width: 8, height: 8, borderRadius: 99, background: KIND_COLORS[k], display: 'inline-block' }} />
          {KIND_LABELS[k]}
        </span>
      ))}
    </div>
  )
}

/** Simple layered auto-layout (used by the graph builder). */
export function autoLayout(ids: string[], edges: GEdge[], spacingX = 2.6, spacingY = 1.9): Record<string, [number, number, number]> {
  const layer: Record<string, number> = {}
  const adj: Record<string, string[]> = {}
  ids.forEach((i) => (adj[i] = []))
  edges.forEach((e) => adj[e.from]?.push(e.to))
  const root = ids.includes('__start__') ? '__start__' : ids[0]
  const queue: string[] = root ? [root] : []
  if (root) layer[root] = 0
  while (queue.length) {
    const cur = queue.shift()!
    for (const nx of adj[cur] ?? []) {
      if (layer[nx] === undefined) {
        layer[nx] = layer[cur] + 1
        queue.push(nx)
      }
    }
  }
  let maxL = Math.max(0, ...Object.values(layer))
  ids.forEach((i) => {
    if (layer[i] === undefined) layer[i] = ++maxL
  })
  if (ids.includes('__end__')) {
    const others = ids.filter((i) => i !== '__end__').map((i) => layer[i])
    layer['__end__'] = Math.max(layer['__end__'], Math.max(0, ...others) + 1)
  }
  const groups: Record<number, string[]> = {}
  ids.forEach((i) => (groups[layer[i]] ??= []).push(i))
  const L = Math.max(...Object.keys(groups).map(Number))
  const out: Record<string, [number, number, number]> = {}
  Object.entries(groups).forEach(([l, members]) => {
    members.forEach((m, idx) => {
      const y = (idx - (members.length - 1) / 2) * -spacingY
      const x = (Number(l) - L / 2) * spacingX
      out[m] = [x, y, (idx % 2) * 0.6 - 0.3]
    })
  })
  return out
}
