import { Link } from '../components/nav'

export default function NotFound() {
  return (
    <div className="page container" style={{ textAlign: 'center', paddingTop: 180 }}>
      <div className="eyebrow">GraphRecursionError</div>
      <h1 style={{ fontSize: '4rem' }}>
        404 · <span className="grad-text">No edge here</span>
      </h1>
      <p className="muted">This node isn’t connected to anything. Let’s route you back to START.</p>
      <Link to="/" className="btn btn-primary">↩ Go to START</Link>
    </div>
  )
}
