import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { BASENAME } from './components/nav'
import App from './App'
import './styles.css'
import { reloadOnce } from './components/ErrorBoundary'

// Vite fires this when a preloaded file is missing (e.g. after a redeploy).
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault()
  reloadOnce()
})

Object.assign(window, { __lguBooted: true })

// Old links used hash routes (/#/learn/state). Send them to the real page.
if (window.location.hash.startsWith('#/')) {
  const target = window.location.hash.slice(1)
  window.location.replace(BASENAME + (target === '/' ? '/' : target.replace(/\/?(\?|$)/, '/$1')))
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={BASENAME || '/'}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
