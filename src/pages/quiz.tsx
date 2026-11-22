import { useRef, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPack } from '../packs'
import { saveScore } from '../lib/progress'

export default function Quiz() {
  const { id } = useParams()
  const pack = getPack(id)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Move focus to the question heading on each step (screen readers + keyboard users)
  useEffect(() => { headingRef.current?.focus() }, [i, done])

  if (!pack) return (
    <main className="mx-auto max-w-2xl p-4">
      <p>Lesson not found.</p>
      <Link className="text-blue-700 underline hc:text-sky-300" to="/">Back</Link>
    </main>
  )

  const link = 'text-blue-700 underline hc:text-sky-300'
  const q = pack.quiz[i]
  const answered = picked !== null

  const choose = (n: number) => {
    if (answered) return
    setPicked(n)
    if (n === q.answer) setScore(s => s + 1)
  }

  const next = () => {
    if (i + 1 < pack.quiz.length) {
      setI(i + 1)
      setPicked(null)
    } else {
      saveScore(pack.id, score, pack.quiz.length)
      setDone(true)
    }
  }

  const restart = () => { setI(0); setPicked(null); setScore(0); setDone(false) }

  if (done) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">
          You got {score} out of {pack.quiz.length}
        </h1>
        <p className="mt-2 text-slate-600 hc:text-neutral-300">
          {score === pack.quiz.length
            ? 'Perfect. You can move on to the next lesson.'
            : 'Read the lesson again, then try once more.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn" onClick={restart}>Try again</button>
          <Link className="btn inline-flex items-center no-underline" to={`/lesson/${pack.id}`}>
            Back to lesson
          </Link>
          <Link className="btn inline-flex items-center no-underline" to="/">All lessons</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <Link className={link} to={`/lesson/${pack.id}`}>← Back to lesson</Link>
      <p className="mt-3 text-sm text-slate-600 hc:text-neutral-300">
        Question {i + 1} of {pack.quiz.length}
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-2xl font-bold outline-none">
        {q.q}
      </h1>

      <div role="group" aria-label="Answer choices" className="mt-4 space-y-3">
        {q.options.map((opt, n) => {
          const isRight = answered && n === q.answer
          const isWrong = answered && n === picked && n !== q.answer
          return (
            <button
              key={n}
              onClick={() => choose(n)}
              aria-disabled={answered}
              className={[
                'w-full min-h-12 rounded-lg border-2 px-4 py-3 text-left text-lg',
                'hc:bg-black hc:text-white',
                isRight
                  ? 'border-green-700 bg-green-50 hc:border-green-400 hc:bg-black'
                  : isWrong
                  ? 'border-red-700 bg-red-50 hc:border-red-400 hc:bg-black'
                  : 'border-slate-300 hover:border-blue-600 hc:border-white',
              ].join(' ')}
            >
              {opt}
              {/* Never rely on colour alone: add a text marker too */}
              {isRight && <span className="ml-2 font-semibold">✓ Correct</span>}
              {isWrong && <span className="ml-2 font-semibold">✗ Not this one</span>}
            </button>
          )
        })}
      </div>

      {/* Announced to screen readers when it appears */}
      <div aria-live="polite" className="mt-4">
        {answered && (
          <p className="rounded-lg bg-slate-100 p-3 hc:bg-neutral-800">
            <strong>{picked === q.answer ? 'Correct. ' : 'The answer is: ' + q.options[q.answer] + '. '}</strong>
            {q.why}
          </p>
        )}
      </div>

      {answered && (
        <button className="btn mt-4" onClick={next}>
          {i + 1 < pack.quiz.length ? 'Next question →' : 'See my score'}
        </button>
      )}
    </main>
  )
}