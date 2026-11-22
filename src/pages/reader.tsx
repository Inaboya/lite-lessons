import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPack } from '../packs'
import { canSpeak, speak, stopSpeaking } from '../lib/speech'

const card =
  'rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 ' +
  'hc:border-2 hc:border-white hc:bg-black'

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-base font-semibold ' +
  'text-white shadow-sm transition-all hover:bg-blue-800 active:scale-[0.99] ' +
  'hc:border-2 hc:border-white hc:bg-white hc:text-black hc:hover:bg-neutral-200'

export default function Reader() {
  const { id } = useParams()
  const pack = getPack(id)
  const [mode, setMode] = useState<'plain' | 'original'>('plain')
  const [size, setSize] = useState(18)
  const [contrast, setContrast] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => {
    document.body.classList.toggle('hc', contrast)
  }, [contrast])

  if (!pack) {
    return (
      <div className="min-h-screen bg-slate-50/70 pb-16 pt-6 text-slate-900 hc:bg-black hc:text-white">
        <main className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className={`${card} text-center`}>
            <h1 className="text-xl font-bold">Lesson not found</h1>
            <p className="mt-2 text-sm text-slate-600 hc:text-neutral-300">
              This lesson pack may have been removed from your device.
            </p>
            <div className="mt-6">
              <Link className={primaryBtn} to="/">
                ← Back to library
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const text = mode === 'plain' ? pack.plain : pack.original

  const toggleSpeech = () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      setSpeaking(true)
      speak(text, () => setSpeaking(false))
    }
  }

  const switchMode = (m: 'plain' | 'original') => {
    stopSpeaking()
    setSpeaking(false)
    setMode(m)
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6 text-slate-900 hc:bg-black hc:text-white">
      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Top Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-blue-700 hc:text-sky-300 hc:underline"
        >
          <span aria-hidden="true">←</span> All lessons
        </Link>

        {/* Lesson Header */}
        <header className="mt-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase hc:border hc:border-white hc:bg-black hc:text-white">
              {pack.subject}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl hc:text-white">
            {pack.title}
          </h1>
        </header>

        {/* Reading Controls Toolbar */}
        <div className={`${card} mt-6 !p-4 sm:!p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Mode Switcher */}
            <div
              className="flex items-center rounded-xl bg-slate-100 p-1 hc:border hc:border-white hc:bg-black"
              role="group"
              aria-label="Reading options"
            >
              <button
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  mode === 'plain'
                    ? 'bg-white text-blue-700 shadow-2xs hc:border hc:border-white hc:bg-white hc:text-black'
                    : 'text-slate-600 hover:text-slate-900 hc:text-neutral-300 hc:hover:text-white'
                }`}
                aria-pressed={mode === 'plain'}
                onClick={() => switchMode('plain')}
              >
                Plain language
              </button>
              <button
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  mode === 'original'
                    ? 'bg-white text-blue-700 shadow-2xs hc:border hc:border-white hc:bg-white hc:text-black'
                    : 'text-slate-600 hover:text-slate-900 hc:text-neutral-300 hc:hover:text-white'
                }`}
                aria-pressed={mode === 'original'}
                onClick={() => switchMode('original')}
              >
                Original text
              </button>
            </div>

            {/* Accessibility & Utilities */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Font Sizer */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hc:border hc:border-white hc:bg-black hc:text-white">
                <button
                  className="rounded px-2 py-1 transition-colors hover:bg-slate-100 hc:hover:bg-neutral-900"
                  onClick={() => setSize(s => Math.max(14, s - 2))}
                  aria-label="Smaller text"
                >
                  A−</button>
                <span className="px-1.5 text-slate-400 hc:text-neutral-500">|</span>
                <button
                  className="rounded px-2 py-1 transition-colors hover:bg-slate-100 hc:hover:bg-neutral-900"
                  onClick={() => setSize(s => Math.min(32, s + 2))}
                  aria-label="Larger text"
                >
                  A+</button>
              </div>

              {/* High Contrast Toggle */}
              <button
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                  contrast
                    ? 'border-yellow-300 bg-neutral-900 text-yellow-300 hc:border-2 hc:border-white hc:bg-white hc:text-black'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hc:border-white hc:bg-black hc:text-white'
                }`}
                aria-pressed={contrast}
                onClick={() => setContrast(c => !c)}
              >
                High contrast
              </button>

              {/* Speech Synthesizer */}
              {canSpeak() && (
                <button
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    speaking
                      ? 'bg-red-600 text-white hc:border hc:border-red-400 hc:bg-black hc:text-red-300'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hc:border hc:border-white hc:bg-black hc:text-white'
                  }`}
                  onClick={toggleSpeech}
                >
                  {speaking ? '■ Stop reading' : '▶ Read aloud'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lesson Body Card */}
        <article className={`${card} mt-6`}>
          <div
            className="prose prose-slate max-w-none space-y-5 leading-relaxed text-slate-800 hc:text-white"
            style={{ fontSize: `${size}px` }}
          >
            {text.split('\n\n').map((para, i) => (
              <p key={i} className="m-0">
                {para}
              </p>
            ))}
          </div>
        </article>

        {/* Key Words Glossary Card */}
        {pack.glossary && pack.glossary.length > 0 && (
          <section aria-labelledby="gl" className={`${card} mt-8`}>
            <h2 id="gl" className="text-xl font-bold text-slate-900 hc:text-white">
              Key words & definitions
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 hc:text-neutral-300">
              Important terms referenced in this lesson.
            </p>

            <dl className="mt-5 divide-y divide-slate-100 hc:divide-neutral-700">
              {pack.glossary.map(g => (
                <div key={g.term} className="py-3.5 first:pt-0 last:pb-0">
                  <dt className="font-bold text-slate-900 hc:text-white">{g.term}</dt>
                  <dd className="mt-1 text-sm text-slate-600 leading-relaxed hc:text-neutral-300">
                    {g.meaning}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Bottom Quiz CTA Banner */}
        <div className={`${card} mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-blue-200/80 bg-blue-50/40 hc:border-white hc:bg-black`}>
          <div>
            <h2 className="text-lg font-bold text-slate-900 hc:text-white">Ready to test your knowledge?</h2>
            <p className="mt-0.5 text-sm text-slate-600 hc:text-neutral-300">
              Take the quick practice check to lock in what you've learned.
            </p>
          </div>
          <Link
            to={`/lesson/${pack.id}/quiz`}
            className={primaryBtn}
          >
            Practice check <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    </div>
  )
}