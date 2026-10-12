import { useState } from 'react'
import Icon from './Icon'

export const CONTACT_EMAIL = 'dev.swainatul@gmail.com'

// FormSubmit relays form posts to the owner's inbox (no backend needed on a static site).
// The first submission sends a one-time activation email to the owner.
const ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('LangGraph Universe — question')}`

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email, // FormSubmit sets this as Reply-To, so replying in Gmail answers the visitor
          message,
          _subject: `LangGraph Universe: message from ${name}`,
          _template: 'table',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || String(data.success) === 'false') throw new Error(data.message ?? 'Failed')
      setStatus('sent')
      setName('')
      setEmail('')
      setMessage('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="contact" id="contact">
      <div className="contact-intro">
        <div className="eyebrow">Contact</div>
        <h2 className="contact-title">
          Questions? <span className="grad-text">Let’s talk.</span>
        </h2>
        <p className="muted">
          Found a mistake, want a topic covered, or just want to say hi? Send a message — it goes straight to my inbox and I reply by email.
        </p>
        <a className="contact-mail" href={mailto}>
          <Icon name="Mail" size={18} />
          {CONTACT_EMAIL}
        </a>
      </div>

      <form className="contact-form" onSubmit={submit}>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div>
            <label className="lbl" htmlFor="c-name">Name</label>
            <input id="c-name" className="input" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="lbl" htmlFor="c-email">Email</label>
            <input id="c-email" className="input" type="email" required maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="lbl" htmlFor="c-msg">Message</label>
          <textarea id="c-msg" className="input" required rows={5} maxLength={5000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can I help?" style={{ resize: 'vertical' }} />
        </div>
        <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
          <span className="dim" style={{ fontSize: '0.78rem', maxWidth: 360 }}>
            Your name, email and message are delivered to me via FormSubmit and used only to reply.
          </span>
          <button className="btn btn-primary" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send message'} <Icon name="Send" size={15} />
          </button>
        </div>
        {status === 'sent' && (
          <p className="contact-status">
            <Icon name="CircleCheck" size={16} /> Thanks! Your message was sent — I’ll reply to your email soon.
          </p>
        )}
        {status === 'error' && (
          <p className="contact-status">
            <Icon name="TriangleAlert" size={16} /> Couldn’t send right now. Please email me directly at{' '}
            <a href={mailto}>{CONTACT_EMAIL}</a>.
          </p>
        )}
      </form>
    </section>
  )
}
