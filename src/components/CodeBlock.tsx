import { Highlight, themes } from 'prism-react-renderer'
import { useState } from 'react'

export interface CodeSample {
  python?: string
  js?: string
  bash?: string
  json?: string
}

const LANG_LABEL: Record<string, string> = { python: 'Python', js: 'TypeScript', bash: 'Shell', json: 'JSON' }
const PRISM_LANG: Record<string, string> = { python: 'python', js: 'tsx', bash: 'bash', json: 'json' }

const theme = {
  ...themes.nightOwl,
  plain: { ...themes.nightOwl.plain, backgroundColor: 'transparent' },
}

export default function CodeBlock({ code, title }: { code: CodeSample | string; title?: string }) {
  const sample: CodeSample = typeof code === 'string' ? { python: code } : code
  const langs = (Object.keys(sample) as (keyof CodeSample)[]).filter((k) => sample[k])
  const [lang, setLang] = useState<keyof CodeSample>(langs[0])
  const [copied, setCopied] = useState(false)
  const src = (sample[lang] ?? '').trim()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(src)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="code-wrap">
      <div className="code-head">
        <div className="code-dots">
          <i style={{ background: '#9a9a9a' }} />
          <i style={{ background: '#c2c2c2' }} />
          <i style={{ background: '#f2f2f2' }} />
        </div>
        {langs.length > 1 ? (
          langs.map((l) => (
            <button key={l} className={`code-tab ${l === lang ? 'active' : ''}`} onClick={() => setLang(l)}>
              {LANG_LABEL[l]}
            </button>
          ))
        ) : (
          <span className="code-title">{title ?? LANG_LABEL[lang]}</span>
        )}
        {langs.length > 1 && title && <span className="code-title" style={{ marginLeft: 8 }}>· {title}</span>}
        <button className="code-copy" onClick={copy}>
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <div className="code-body">
        <Highlight theme={theme} code={src} language={PRISM_LANG[lang]}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={style}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} className="code-line">
                  <span className="code-ln">{i + 1}</span>
                  <span className="code-content">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  )
}
