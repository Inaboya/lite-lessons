export interface LessonPack {
  id: string
  title: string
  subject: string
  original: string          
  plain: string            
  glossary: { term: string; meaning: string }[]
  quiz: {
    q: string
    options: string[]
    answer: number          
    why: string
  }[]
}