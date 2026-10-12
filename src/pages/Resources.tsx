import { RESOURCES, TIMELINE } from '../data/knowledge'
import Reveal, { SectionHead } from '../components/Reveal'
import Icon from '../components/Icon'
import Callout from '../components/Callout'

export default function Resources() {
  return (
    <div className="page container">
      <SectionHead
        eyebrow="Resources & news"
        title={
          <>
            Where to go <span className="grad-text">next.</span>
          </>
        }
        sub="The official sources, the most useful repositories and courses, and a timeline of how the ecosystem got here."
      />

      <h2 style={{ fontSize: '2rem' }}>Timeline</h2>
      <div className="timeline-h">
        {TIMELINE.map((t, i) => (
          <Reveal key={t.date} delay={i * 0.05}>
            <div className="tl-item">
              <div className="tl-dot" />
              <div className="mono dim" style={{ fontSize: '0.72rem', letterSpacing: '0.1em' }}>{t.date.toUpperCase()}</div>
              <h3 style={{ margin: '6px 0' }}>{t.title}</h3>
              <p className="muted" style={{ fontSize: '0.9rem', margin: 0 }}>{t.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {RESOURCES.map((g) => (
        <section key={g.group} style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: '2rem' }}>{g.group}</h2>
          <div className="grid grid-3">
            {g.items.map((r) => (
              <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="card hoverable res-card">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <b>{r.name}</b>
                  <Icon name="ExternalLink" size={14} />
                </div>
                <p className="muted" style={{ fontSize: '0.88rem', margin: '8px 0 0' }}>{r.desc}</p>
                <div className="mono dim" style={{ fontSize: '0.7rem', marginTop: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.url.replace('https://', '')}
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}

      <section style={{ marginTop: 56 }}>
        <h2 style={{ fontSize: '2rem' }}>A suggested learning path</h2>
        <ol className="step-list">
          <li>Read lessons 1–9 here (Foundations), then build the Customer Support Router project.</li>
          <li>Take the official “Introduction to LangGraph” course on LangChain Academy.</li>
          <li>Learn tools, agents and middleware; build the SQL Analyst and Docs Chatbot projects.</li>
          <li>Add persistence, memory and human-in-the-loop; build the Email Assistant.</li>
          <li>Go multi-agent and deep agents; build the Content Team.</li>
          <li>Instrument everything with LangSmith, write an evaluation dataset, and deploy with <code>langgraph dev</code> → LangSmith Deployment.</li>
        </ol>
        <Callout type="info" title="Stay current">
          The ecosystem releases often. Watch the GitHub releases of <code>langchain-ai/langgraph</code> and the LangChain changelog, and prefer docs and tutorials dated after the October 2025 1.0 releases.
        </Callout>
      </section>
    </div>
  )
}
