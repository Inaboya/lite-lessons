import { useRef, useState } from 'react'
import type { LessonPack } from '../type/lesson'
import { saveCustomPack } from '../lib/custom-packs'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { MAX_BYTES, fileKind, extractFileText } from '../lib/extract'

const field =
  'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 ' +
  'shadow-2xs transition-colors placeholder:text-slate-400 ' +
  'focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 ' +
  'hc:border-2 hc:border-white hc:bg-black hc:text-white hc:focus:ring-white'

const card =
  'rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 ' +
  'hc:border-2 hc:border-white hc:bg-black'

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-base font-semibold ' +
  'text-white shadow-sm transition-all hover:bg-blue-800 active:scale-[0.99] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'hc:border-2 hc:border-white hc:bg-white hc:text-black hc:hover:bg-neutral-200'

const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 ' +
  'text-base font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 active:scale-[0.99] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'hc:border-2 hc:border-white hc:bg-black hc:text-white hc:hover:bg-neutral-900'

// NEW: the builder only takes lesson notes, not JSON packs
const BUILDER_ACCEPT =
  '.pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MAX_CHARS = 12000

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lesson'

export default function Builder() {
  const nav = useNavigate()
  const location = useLocation()
  const fileRef = useRef<HTMLInputElement>(null) // NEW

  // Text handed over from the Library after a PDF/Word upload
  const incoming = location.state as { title?: string; source?: string } | null

  const [title, setTitle] = useState(incoming?.title ?? '')
  const [subject, setSubject] = useState('')
  const [source, setSource] = useState(incoming?.source ?? '')
  const [draft, setDraft] = useState<LessonPack | null>(null)
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(false) // NEW
  const [error, setError] = useState('')
  const [status, setStatus] = useState(
    incoming?.source ? 'Lesson text loaded. Check it below before drafting.' : ''
  )
  const [reviewed, setReviewed] = useState(false)

  // NEW: read a PDF or Word file in the browser and fill the text box
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    if (file.size > MAX_BYTES) return setError('That file is too big. Keep it under 10 MB.')

    const kind = fileKind(file)
    if (kind !== 'pdf' && kind !== 'docx') {
      return setError(
        kind === 'doc'
          ? 'Old .doc files are not supported. Save as .docx and try again.'
          : 'Choose a PDF or a Word (.docx) file.'
      )
    }

    setReading(true)
    setStatus(`Reading ${file.name}…`)
    try {
      const text = await extractFileText(file, kind)
      setSource(text)
      if (!title.trim()) setTitle(file.name.replace(/\.(pdf|docx)$/i, ''))
      setStatus(
        text.length > MAX_CHARS
          ? `Read ${text.length.toLocaleString()} characters. Only the first ${MAX_CHARS.toLocaleString()} fit, so trim the text below.`
          : `Read ${text.length.toLocaleString()} characters. Check the text below before drafting.`
      )
    } catch (err) {
      setStatus('')
      setError(err instanceof Error ? err.message : 'Could not read that file.')
    } finally {
      setReading(false)
    }
  }

  const generate = async () => {
    setError('')
    setStatus('')
    if (!navigator.onLine) return setError('The builder needs an internet connection.')
    if (!title.trim() || !subject.trim()) return setError('Add a title and subject first.')
    // NEW: same limits the server enforces, so teachers see the problem straight away
    if (source.trim().length < 200)
      return setError('Add at least a few paragraphs of lesson text.')
    if (source.length > MAX_CHARS)
      return setError(`Text is too long. Keep it under ${MAX_CHARS.toLocaleString()} characters.`)

    setBusy(true)
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: source }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Something went wrong.')
      setDraft({
        id: `${slug(title)}-${Date.now().toString(36)}`,
        title: title.trim(),
        subject: subject.trim(),
        original: source.trim(),
        plain: data.plain,
        glossary: data.glossary,
        quiz: data.quiz,
      })
      setReviewed(false)
    } catch (e: any) {
      setError(e.message || 'Could not reach the server.')
    } finally {
      setBusy(false)
    }
  }

  const patch = (p: Partial<LessonPack>) => setDraft(d => (d ? { ...d, ...p } : d))

  const save = () => {
    if (!draft) return
    if (saveCustomPack(draft)) nav(`/lesson/${draft.id}`)
    else setError('Could not save on this device (storage is full or blocked). Download the file instead.')
  }

  const download = () => {
    if (!draft) return
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${draft.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isNearLimit = source.length > 11000
  const isOverLimit = source.length > MAX_CHARS // NEW

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 pt-6 text-slate-900 hc:bg-black hc:text-white">
      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Top Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-blue-700 hc:text-sky-300 hc:underline"
        >
          <span aria-hidden="true">←</span> All lessons
        </Link>

        {/* Page Header */}
        <header className="mt-4">
          <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase hc:border hc:border-white hc:bg-black hc:text-white">
            Teacher Studio
          </div>
          <h1 className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl hc:text-white">
            Make a lesson pack
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600 hc:text-neutral-300">
            Upload your lesson notes (PDF or Word) or paste the text. AI will draft a plain-language
            version, key vocabulary, and a quick quiz for you to review before sharing with learners.
            Files are read on this device and are never uploaded.
          </p>
        </header>

        {/* Step 1: Source Material Card */}
        <section aria-labelledby="step-1" className={`${card} mt-8`}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 hc:border-neutral-700">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white hc:border hc:border-white hc:bg-black">
              1
            </span>
            <h2 id="step-1" className="text-lg font-bold text-slate-900 hc:text-white">
              Lesson details & source text
            </h2>
          </div>

          <div className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800 hc:text-white">Lesson title</span>
                <input
                  className={field}
                  placeholder="e.g. Introduction to Photosynthesis"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-800 hc:text-white">Subject</span>
                <input
                  className={field}
                  placeholder="e.g. Biology"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </label>
            </div>

            {/* NEW: file upload */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4 hc:border-2 hc:border-white hc:bg-black">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800 hc:text-white">
                    Upload lesson notes
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 hc:text-neutral-300">
                    PDF or Word (.docx), up to 10 MB. Scanned pages are not supported.
                  </p>
                </div>
                <button
                  type="button"
                  className={secondaryBtn}
                  onClick={() => fileRef.current?.click()}
                  disabled={reading || busy}
                  aria-busy={reading}
                >
                  {reading ? 'Reading…' : 'Choose a file'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept={BUILDER_ACCEPT}
                  className="sr-only"
                  onChange={onFile}
                  aria-label="Upload lesson notes as a PDF or Word file"
                />
              </div>
            </div>

            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-800 hc:text-white">
                  Lesson text <span className="font-normal text-slate-500 hc:text-neutral-300">(or paste it here)</span>
                </span>
                <span
                  className={`text-xs font-medium ${
                    isOverLimit
                      ? 'text-red-700 hc:text-red-300'
                      : isNearLimit
                      ? 'text-amber-700 hc:text-yellow-300'
                      : 'text-slate-500 hc:text-neutral-300'
                  }`}
                >
                  {source.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
                </span>
              </div>
              <textarea
                className={`${field} leading-relaxed`}
                rows={9}
                placeholder="Paste your article, lecture notes, or textbook excerpt here..."
                value={source}
                onChange={e => setSource(e.target.value)}
              />
            </label>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <button
                className={primaryBtn}
                onClick={generate}
                disabled={busy || reading}
                aria-busy={busy}
              >
                {busy ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent hc:border-black hc:border-t-transparent" />
                    Drafting pack…
                  </>
                ) : (
                  'Draft the pack'
                )}
              </button>
              <span className="text-xs text-slate-500 hc:text-neutral-300">
                Takes about 10–15 seconds
              </span>
            </div>
          </div>
        </section>

        {/* NEW: Status banner (file read result). Always rendered so screen readers announce changes. */}
        <div role="status" aria-live="polite" className={status ? 'mt-6' : ''}>
          {status && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-sm font-medium text-blue-900 hc:border-2 hc:border-white hc:bg-black hc:text-white">
              <span aria-hidden="true" className="text-base leading-none">📄</span>
              <span>{status}</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 hc:border-2 hc:border-red-400 hc:bg-black hc:text-red-300"
          >
            <span aria-hidden="true" className="text-base leading-none">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step 2: Review & Edit */}
        {draft && (
          <section aria-labelledby="review" className="mt-10 space-y-6">
            <div className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white hc:border hc:border-white hc:bg-black">
                2
              </span>
              <h2 id="review" className="text-2xl font-bold tracking-tight text-slate-900 hc:text-white">
                Review and edit
              </h2>
            </div>

            {/* AI Verification Banner */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 hc:border-2 hc:border-yellow-300 hc:bg-neutral-900 hc:text-yellow-300">
              <span aria-hidden="true" className="mt-0.5 text-base">💡</span>
              <div>
                <strong className="font-semibold">Teacher check required:</strong> AI can make mistakes. Verify every fact, glossary definition, and quiz answer before publishing.
              </div>
            </div>

            {/* Plain-Language Card */}
            <div className={card}>
              <label className="block">
                <span className="text-base font-bold text-slate-900 hc:text-white">
                  Plain-language version
                </span>
                <p className="mt-0.5 text-sm text-slate-500 hc:text-neutral-300">
                  Simplified explanation tailored for accessibility and clarity.
                </p>
                <textarea
                  className={`${field} mt-3 leading-relaxed`}
                  rows={10}
                  value={draft.plain}
                  onChange={e => patch({ plain: e.target.value })}
                />
              </label>
            </div>

            {/* Key Words Card */}
            <fieldset className={card}>
              <legend className="float-left w-full text-base font-bold text-slate-900 hc:text-white">
                Key words
              </legend>
              <p className="clear-both mt-0.5 text-sm text-slate-500 hc:text-neutral-300">
                Core vocabulary terms and learner-friendly definitions.
              </p>

              <div className="mt-4 space-y-3">
                {draft.glossary.map((g, i) => (
                  <div
                    key={i}
                    className="grid gap-2.5 rounded-xl bg-slate-50/80 p-3 sm:grid-cols-[1fr_2fr] hc:border hc:border-neutral-700 hc:bg-black"
                  >
                    <input
                      className={`${field} !mt-0 font-medium`}
                      aria-label={`Term ${i + 1}`}
                      placeholder="Term"
                      value={g.term}
                      onChange={e =>
                        patch({
                          glossary: draft.glossary.map((x, j) =>
                            j === i ? { ...x, term: e.target.value } : x
                          ),
                        })
                      }
                    />
                    <input
                      className={`${field} !mt-0`}
                      aria-label={`Meaning of term ${i + 1}`}
                      placeholder="Definition"
                      value={g.meaning}
                      onChange={e =>
                        patch({
                          glossary: draft.glossary.map((x, j) =>
                            j === i ? { ...x, meaning: e.target.value } : x
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Quiz Card */}
            <fieldset className={card}>
              <legend className="float-left w-full text-base font-bold text-slate-900 hc:text-white">
                Comprehension quiz
              </legend>
              <p className="clear-both mt-0.5 text-sm text-slate-500 hc:text-neutral-300">
                Select the radio button next to the correct answer for each question.
              </p>

              <div className="mt-5 space-y-6">
                {draft.quiz.map((q, i) => {
                  const setQ = (nq: typeof q) =>
                    patch({ quiz: draft.quiz.map((x, j) => (j === i ? nq : x)) })

                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 hc:border-2 hc:border-white hc:bg-black"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-slate-500 uppercase hc:text-neutral-300">
                          Question {i + 1}
                        </span>
                      </div>

                      <input
                        className={`${field} mt-2 font-semibold`}
                        aria-label={`Question ${i + 1}`}
                        value={q.q}
                        onChange={e => setQ({ ...q, q: e.target.value })}
                      />

                      <div className="mt-3.5 space-y-2.5">
                        {q.options.map((o, n) => {
                          const isCorrect = q.answer === n
                          return (
                            <div
                              key={n}
                              className={`flex items-center gap-3 rounded-xl border p-2 transition-colors ${
                                isCorrect
                                  ? 'border-emerald-500/80 bg-emerald-50/60 hc:border-white hc:bg-neutral-900'
                                  : 'border-transparent bg-white/70 hc:bg-black'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`ans-${i}`}
                                checked={isCorrect}
                                aria-label={`Mark option ${n + 1} of question ${i + 1} as correct`}
                                onChange={() => setQ({ ...q, answer: n })}
                                className="ml-1.5 size-4 shrink-0 accent-emerald-600 hc:accent-white"
                              />
                              <input
                                className={`${field} !mt-0`}
                                aria-label={`Question ${i + 1} option ${n + 1}`}
                                value={o}
                                onChange={e =>
                                  setQ({
                                    ...q,
                                    options: q.options.map((x, m) => (m === n ? e.target.value : x)),
                                  })
                                }
                              />
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-4 border-t border-slate-200/80 pt-3.5 hc:border-neutral-700">
                        <label className="block">
                          <span className="text-xs font-semibold text-slate-600 hc:text-neutral-300">
                            Answer explanation
                          </span>
                          <input
                            className={`${field} text-sm`}
                            aria-label={`Explanation for question ${i + 1}`}
                            placeholder="Why is this answer correct?"
                            value={q.why}
                            onChange={e => setQ({ ...q, why: e.target.value })}
                          />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </fieldset>

            {/* Sign-off & Publish Card */}
            <div className={`${card} border-blue-200/80 bg-blue-50/30 hc:border-white hc:bg-black`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-5 shrink-0 rounded accent-blue-700 hc:accent-white"
                  checked={reviewed}
                  onChange={e => setReviewed(e.target.checked)}
                />
                <span className="text-sm font-medium leading-snug text-slate-800 hc:text-white">
                  I have checked this pack and confirmed it is accurate and appropriate for my learners.
                </span>
              </label>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-5 hc:border-neutral-700">
                <button className={primaryBtn} onClick={save} disabled={!reviewed}>
                  Save to this device
                </button>
                <button className={secondaryBtn} onClick={download} disabled={!reviewed}>
                  Download JSON file
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}