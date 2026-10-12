import { Component, type ReactNode } from 'react'

const RELOAD_FLAG = 'lgu-reloaded-at'

/** Reload the page at most once per minute (guards against reload loops). */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG) ?? 0)
    if (Date.now() - last < 60_000) return false
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()))
  } catch {
    /* storage unavailable: still try one reload */
  }
  window.location.reload()
  return true
}

const isStaleAsset = (e: unknown) => /dynamically imported module|Importing a module script failed|Loading chunk|preload/i.test(String((e as Error)?.message ?? e))

interface Props {
  children: ReactNode
  resetKey?: string
}

/** Keeps a render error on one page from blanking the whole site. */
export default class ErrorBoundary extends Component<Props, { error: unknown }> {
  state = { error: null as unknown }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidCatch(error: unknown) {
    // A newer deploy removed the file this tab wanted: fetch the fresh version.
    if (isStaleAsset(error)) reloadOnce()
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="page container" style={{ textAlign: 'center', paddingTop: 160 }}>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>Something went wrong</div>
        <h1 style={{ fontSize: '3rem' }}>This page didn’t load.</h1>
        <p className="muted">The site may have just been updated. Reloading usually fixes it.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    )
  }
}
