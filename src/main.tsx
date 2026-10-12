import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import { reloadOnce } from './components/ErrorBoundary'

// Vite fires this when a preloaded file is missing (e.g. after a redeploy).
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault()
  reloadOnce()
})

Object.assign(window, { __lguBooted: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
