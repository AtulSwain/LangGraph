import { Routes, Route, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
// Pages are bundled eagerly: navigation never waits on a network request and
// can't break when a redeploy renames lazily-loaded chunk files.
import Home from './pages/Home'
import Learn from './pages/Learn'
import Architecture from './pages/Architecture'
import Patterns from './pages/Patterns'
import Playground from './pages/Playground'
import LangChain from './pages/LangChain'
import Quiz from './pages/Quiz'
import Glossary from './pages/Glossary'
import Projects from './pages/Projects'
import Models from './pages/Models'
import Compare from './pages/Compare'
import Interview from './pages/Interview'
import Resources from './pages/Resources'
import NotFound from './pages/NotFound'

export default function App() {
  const location = useLocation()
  const top = location.pathname.split('/')[1] ?? ''
  return (
    <Layout>
      <ErrorBoundary resetKey={location.pathname}>
        {/* enter-only fade: the new page renders immediately, no waiting on an exit animation */}
        <motion.div key={top} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
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
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<Projects />} />
            <Route path="/models" element={<Models />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </ErrorBoundary>
    </Layout>
  )
}
