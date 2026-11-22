// src/packs/index.ts
import photosynthesis from './photosynthesis.json'
import amalgamation from './amalgamation.json'
import type { LessonPack } from '../type/lesson'
import { getCustomPacks } from '../lib/custom-packs'

export const builtInPacks: LessonPack[] = [
  photosynthesis as LessonPack,
  amalgamation as LessonPack,
]
export const getAllPacks = () => [...builtInPacks, ...getCustomPacks()]
export const getPack = (id?: string) => getAllPacks().find(p => p.id === id)