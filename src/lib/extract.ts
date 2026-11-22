import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export const ACCEPT = `.json,application/json,.pdf,application/pdf,.docx,${DOCX_MIME}`
export const MAX_BYTES = 10 * 1024 * 1024

export type FileKind = 'json' | 'pdf' | 'docx' | 'doc' | 'unsupported'

export function fileKind(f: File): FileKind {
  const n = f.name.toLowerCase()
  if (n.endsWith('.json') || f.type === 'application/json') return 'json'
  if (n.endsWith('.pdf') || f.type === 'application/pdf') return 'pdf'
  if (n.endsWith('.docx') || f.type === DOCX_MIME) return 'docx'
  if (n.endsWith('.doc')) return 'doc'
  return 'unsupported'
}

const tidy = (t: string) =>
  t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

async function pdfText(file: File): Promise<string> {
  // Loaded only when needed, so it doesn't weigh down the first page load
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const pages: string[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const content = await (await pdf.getPage(p)).getTextContent()
    pages.push(
      content.items
        .map((it: any) => ('str' in it ? it.str + (it.hasEOL ? '\n' : ' ') : ''))
        .join('')
    )
  }
  return pages.join('\n\n')
}

async function docxText(file: File): Promise<string> {
  const mod: any = await import('mammoth/mammoth.browser')
  const mammoth = mod.default ?? mod
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return value
}

/** Returns clean text, or throws an Error whose message is safe to show the teacher. */
export async function extractFileText(file: File, kind: 'pdf' | 'docx'): Promise<string> {
  let text: string
  try {
    text = tidy(kind === 'pdf' ? await pdfText(file) : await docxText(file))
  } catch {
    throw new Error(`Could not read that ${kind === 'pdf' ? 'PDF' : 'Word file'}. Try another file or paste the text in the builder.`)
  }
  if (text.length < 200) {
    throw new Error(
      kind === 'pdf'
        ? 'No readable text found. This may be a scanned PDF. Paste the text in the builder instead.'
        : 'That file has too little text to make a lesson from.'
    )
  }
  return text
}