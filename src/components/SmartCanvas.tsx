import { Canvas, type CanvasProps } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Suspense, useState, type CSSProperties, type ReactNode } from 'react'
import { useInView } from './useInView'

/**
 * A Canvas that only renders while on screen and lowers its pixel ratio when the
 * device can't keep up — so 3D never makes the rest of the site feel slow.
 */
export default function SmartCanvas({
  className,
  style,
  overlay,
  children,
  ...canvasProps
}: { className?: string; style?: CSSProperties; overlay?: ReactNode; children: ReactNode } & Omit<CanvasProps, 'children'>) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const [dpr, setDpr] = useState(Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio : 1))
  return (
    <div ref={ref} className={className} style={style}>
      <Canvas dpr={dpr} frameloop={inView ? 'always' : 'never'} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} {...canvasProps}>
        <PerformanceMonitor onDecline={() => setDpr(1)} flipflops={2} onFallback={() => setDpr(0.75)} />
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
      {overlay}
    </div>
  )
}
