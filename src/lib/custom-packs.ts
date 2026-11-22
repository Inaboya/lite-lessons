import type { LessonPack } from '../type/lesson'
import { isLessonPack } from './validate'

const KEY = 'litelesson:custom'

export function getCustomPacks(): LessonPack[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(raw) ? raw.filter(isLessonPack) : []
  } catch {
    return []
  }
}

export function saveCustomPack(pack: LessonPack): boolean {
  try {
    const others = getCustomPacks().filter(p => p.id !== pack.id)
    localStorage.setItem(KEY, JSON.stringify([...others, pack]))
    return true
  } catch {
    return false
  }
}

export function deleteCustomPack(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(getCustomPacks().filter(p => p.id !== id)))
  } catch { /* ignore */ }
}