import type { LessonPack } from '../type/lesson'

export function isLessonPack(x: any): x is LessonPack {
  return (
    x && typeof x === 'object' &&
    typeof x.id === 'string' && typeof x.title === 'string' &&
    typeof x.subject === 'string' && typeof x.original === 'string' &&
    typeof x.plain === 'string' &&
    Array.isArray(x.glossary) &&
    x.glossary.every((g: any) => typeof g?.term === 'string' && typeof g?.meaning === 'string') &&
    Array.isArray(x.quiz) && x.quiz.length > 0 &&
    x.quiz.every(
      (q: any) =>
        typeof q?.q === 'string' && Array.isArray(q.options) && q.options.length >= 2 &&
        Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length &&
        typeof q.why === 'string'
    )
  )
}