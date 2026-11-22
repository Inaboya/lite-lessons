import 'dotenv/config'
import express from 'express'
import { GoogleGenAI, Type } from '@google/genai'

const app = express()
app.use(express.json({ limit: '50kb' }))

// Initialize Gemini client (automatically reads GEMINI_API_KEY from environment)
const ai = new GoogleGenAI()
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash'

const SYSTEM = `You turn a teacher's lesson text into a study pack for secondary-school learners who may be reading English as a second language, on a low-end phone.

Rules:
- "plain": rewrite for a reading age of about 12. Short sentences, common words, no jargon unless defined. Keep every fact from the source. Do not add facts that are not in the source. Separate paragraphs with a blank line.
- "glossary": 4 to 8 hard terms from the lesson, each with a one-sentence everyday meaning.
- "quiz": exactly 5 multiple-choice questions, 4 options each, exactly one correct. Wrong options must be plausible. Only test what the lesson says. "why" is one sentence.
- Keep "original" out of your answer; the server adds it.`

// Define the schema for strict structured JSON output
const lessonPackSchema = {
  type: Type.OBJECT,
  properties: {
    plain: { 
      type: Type.STRING, 
      description: 'The rewritten plain text lesson summary.' 
    },
    glossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { 
          term: { type: Type.STRING }, 
          meaning: { type: Type.STRING } 
        },
        required: ['term', 'meaning'],
      },
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          q: { type: Type.STRING },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          answer: { 
            type: Type.INTEGER, 
            description: 'Index of the correct option, starting at 0' 
          },
          why: { type: Type.STRING },
        },
        required: ['q', 'options', 'answer', 'why'],
      },
    },
  },
  required: ['plain', 'glossary', 'quiz'],
}

// Tiny in-memory rate limit: 10 requests per IP per hour
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter(t => now - t < 3_600_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 10
}

app.post('/api/generate', async (req, res) => {
  const { text } = req.body ?? {}
  if (typeof text !== 'string' || text.trim().length < 200)
    return res.status(400).json({ error: 'Paste at least a few paragraphs of lesson text.' })
  if (text.length > 12000)
    return res.status(400).json({ error: 'Text is too long. Keep it under 12,000 characters.' })
  if (limited(req.ip || 'unknown'))
    return res.status(429).json({ error: 'Too many requests. Try again later.' })

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Lesson text:\n\n${text}`,
      config: {
        systemInstruction: SYSTEM,
        responseMimeType: 'application/json',
        responseSchema: lessonPackSchema,
        temperature: 0.3,
      },
    })

    if (!response.text) throw new Error('No response returned from Gemini')

    const out = JSON.parse(response.text)

    // Server-side sanity check on the quiz
    const quizOk =
      Array.isArray(out.quiz) &&
      out.quiz.every(
        (q: any) =>
          Array.isArray(q.options) && q.options.length >= 2 &&
          Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length
      )
    if (!quizOk || typeof out.plain !== 'string') throw new Error('Malformed pack')

    res.json({ plain: out.plain, glossary: out.glossary, quiz: out.quiz })
  } catch (e:any) {
   console.error('Generate failed:', e?.status, e?.message ?? e)
    res.status(500).json({ error: 'Could not generate the pack. Please try again.' })
  }
})

const port = Number(process.env.PORT) || 8787
app.listen(port, () => console.log(`API on http://localhost:${port}`))