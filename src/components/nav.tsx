/**
 * Site-wide navigation primitives. Every internal navigation is a real page load
 * (each route is pre-rendered to its own index.html), which is exactly what a browser
 * refresh does: no client-side page swaps, no stale state, and real URLs for search engines.
 */
import { forwardRef } from 'react'
import { Link as RouterLink, NavLink as RouterNavLink, type LinkProps, type NavLinkProps } from 'react-router-dom'

/** Router basename without trailing slash, e.g. "/LangGraph" (or "" when served at the root). */
export const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Turn an app path like "/learn/state" into a full URL path with a trailing slash. */
export function href(to: string): string {
  const [path, query = ''] = to.split('?')
  const clean = path === '/' ? '/' : path.replace(/\/?$/, '/')
  return BASENAME + clean + (query ? `?${query}` : '')
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  return <RouterLink ref={ref} reloadDocument {...props} />
})

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(props, ref) {
  return <RouterNavLink ref={ref} reloadDocument {...props} />
})

/** Drop-in for useNavigate(): performs a full page load. */
export function useNavigate() {
  return (to: string) => window.location.assign(href(to))
}
