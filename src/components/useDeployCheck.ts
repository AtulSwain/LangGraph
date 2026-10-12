import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * GitHub Pages lets browsers cache files for ~10 minutes, so a visitor can keep running an
 * old build after a redeploy. On each navigation (and when the tab regains focus) we fetch
 * version.json bypassing the cache; if a newer build is live, we load it with a full,
 * cache-busting page load instead of letting the stale build fail.
 */
export function useDeployCheck() {
  const location = useLocation()
  const lastCheck = useRef(0)

  useEffect(() => {
    const check = async () => {
      if (import.meta.env.DEV || Date.now() - lastCheck.current < 15_000) return
      lastCheck.current = Date.now()
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const { buildId } = (await res.json()) as { buildId?: string }
        if (buildId && buildId !== __BUILD_ID__) {
          const url = new URL(window.location.href)
          url.searchParams.set('v', buildId) // new URL => the browser can't serve the stale cached HTML
          window.location.replace(url.toString())
        }
      } catch {
        /* offline or blocked: keep running the current build */
      }
    }
    check()
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [location.pathname])
}
