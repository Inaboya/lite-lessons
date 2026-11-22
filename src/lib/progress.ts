const KEY = 'litelesson:scores'

type Scores = Record<string, { best: number; total: number }>

function read(): Scores {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function getScore(id: string) {
  return read()[id]
}

export function saveScore(id: string, score: number, total: number) {
  try {
    const all = read()
    const prev = all[id]?.best ?? 0
    all[id] = { best: Math.max(prev, score), total }
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* storage blocked or full: quiz still works, score just isn't saved */
  }
}