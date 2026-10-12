import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout'

const Home = lazy(() => import('./pages/Home'))
const Learn = lazy(() => import('./pages/Learn'))
const Architecture = lazy(() => import('./pages/Architecture'))
const Patterns = lazy(() => import('./pages/Patterns'))
const Playground = lazy(() => import('./pages/Playground'))
const LangChain = lazy(() => import('./pages/LangChain'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Glossary = lazy(() => import('./pages/Glossary'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  const location = useLocation()
  const top = location.pathname.split('/')[1] ?? ''
  return (
    <Layout>
      <Suspense fallback={<div className="loader">loading graph…</div>}>
        <AnimatePresence mode="wait">
          <motion.div
            key={top}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:id" element={<Learn />} />
              <Route path="/architecture" element={<Architecture />} />
              <Route path="/patterns" element={<Patterns />} />
              <Route path="/patterns/:id" element={<Patterns />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/langchain" element={<LangChain />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/glossary" element={<Glossary />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </Layout>
  )
}
