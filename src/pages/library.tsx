import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllPacks, builtInPacks } from "../packs";
import { getScore } from "../lib/progress";
import { saveCustomPack, deleteCustomPack } from "../lib/custom-packs";
import { isLessonPack } from "../lib/validate";
import { ACCEPT, MAX_BYTES, fileKind, extractFileText } from "../lib/extract";

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-base font-semibold " +
  "text-white shadow-sm transition-all hover:bg-blue-800 active:scale-[0.99] " +
  "hc:border-2 hc:border-white hc:bg-white hc:text-black hc:hover:bg-neutral-200";

const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 " +
  "text-base font-semibold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 active:scale-[0.99] " +
  "hc:border-2 hc:border-white hc:bg-black hc:text-white hc:hover:bg-neutral-900";

const card =
  "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 " +
  "hc:border-2 hc:border-white hc:bg-black";

export default function Library() {
  const [, refresh] = useState(0);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const packs = getAllPacks();
  const builtInIds = new Set(builtInPacks.map((p) => p.id));
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (file.size > MAX_BYTES) return setMsg('That file is too big. Keep it under 10 MB.')

  const kind = fileKind(file)

  if (kind === 'json') {
    try {
      const data = JSON.parse(await file.text())
      if (!isLessonPack(data)) throw new Error('bad')
      if (!saveCustomPack(data)) throw new Error('storage')
      setMsg(`Added “${data.title}”.`)
      refresh(n => n + 1)
    } catch {
      setMsg('That file is not a valid lesson pack.')
    }
    return
  }

  if (kind === 'pdf' || kind === 'docx') {
    setBusy(true)
    setMsg(`Reading ${file.name}…`)
    try {
      const source = await extractFileText(file, kind)
      nav('/builder', { state: { title: file.name.replace(/\.(pdf|docx)$/i, ''), source } })
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Could not read that file.')
    } finally {
      setBusy(false)
    }
    return
  }

  setMsg(
    kind === 'doc'
      ? 'Old .doc files are not supported. Open it in Word, choose Save As .docx, and try again.'
      : 'Unsupported file. Choose a .json pack, a PDF or a Word (.docx) file.'
  )
}

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 pt-6 text-slate-900 hc:bg-black hc:text-white">
      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Page Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase hc:border hc:border-white hc:bg-black hc:text-white">
              LiteLesson Studio
            </div>
            <h1 className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl hc:text-white">
              Lesson Library
            </h1>
            <p className="mt-1.5 text-base text-slate-600 hc:text-neutral-300">
              Saved locally on this device. Fully functional offline.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 sm:flex-col">
            <Link className={`${primaryBtn} text-sm sm:py-2.5`} to="/builder">
              + Make a pack
            </Link>
          </div>
        </header>

        {/* Status / Message Banner */}
        {msg && (
          <div
            role="status"
            className="mt-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-sm font-medium text-blue-900 hc:border-2 hc:border-white hc:bg-black hc:text-white"
          >
            <span>{msg}</span>
            <button
              onClick={() => setMsg("")}
              className="text-xs font-bold uppercase tracking-wider text-blue-700 hover:underline hc:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Packs List */}
        <div className="mt-8">
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase hc:text-neutral-400">
            Available Lessons ({packs.length})
          </h2>

          <ul className="mt-3 space-y-3">
            {packs.map((p) => {
              const score = getScore(p.id);
              const isBuiltIn = builtInIds.has(p.id);

              return (
                <li
                  key={p.id}
                  className="group relative flex items-stretch gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-md sm:p-5 hc:border-2 hc:border-white hc:bg-black hc:hover:border-yellow-300"
                >
                  <Link
                    to={`/lesson/${p.id}`}
                    className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-lg font-bold text-slate-900 hc:text-white">
                          {p.title}
                        </strong>
                        {!isBuiltIn && (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 hc:border hc:border-white hc:bg-black hc:text-yellow-300">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 hc:text-neutral-300">
                        <span className="font-medium text-slate-700 hc:text-neutral-200">
                          {p.subject}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {score ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hc:border hc:border-white hc:bg-black hc:text-emerald-300">
                          <span aria-hidden="true">★</span> Best {score.best}/
                          {score.total}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 hc:text-neutral-400">
                          Not attempted
                        </span>
                      )}
                      <span
                        className="text-blue-600 transition-transform group-hover:translate-x-0.5 hc:text-sky-300"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </div>
                  </Link>

                  {!isBuiltIn && (
                    <button
                      className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50/50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 hc:border-2 hc:border-red-400 hc:bg-black hc:text-red-300 hc:hover:bg-neutral-900"
                      aria-label={`Remove ${p.title}`}
                      onClick={() => {
                        deleteCustomPack(p.id);
                        refresh((n) => n + 1);
                        setMsg(`Removed “${p.title}”.`);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Actions Card */}
        <div
          className={`${card} mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 hc:text-white">
              Have a pack file?
            </h3>
            <p className="mt-0.5 text-sm text-slate-500 hc:text-neutral-300">
              Import a downloaded JSON lesson pack to add it instantly.
            </p>
          </div>

       <div>
  <h3 className="text-base font-bold text-slate-900 hc:text-white">Add a lesson file</h3>
  <p className="mt-0.5 text-sm text-slate-500 hc:text-neutral-300">
    Upload lesson notes (PDF or Word) to turn into a pack, or import a finished pack (JSON).
  </p>
</div>

<div className="flex flex-wrap gap-2.5">
  <button
    className={`${secondaryBtn} disabled:cursor-not-allowed disabled:opacity-50`}
    onClick={() => fileRef.current?.click()}
    disabled={busy}
    aria-busy={busy}
  >
    {busy ? 'Reading…' : 'Add a file'}
  </button>
  <input
    ref={fileRef}
    type="file"
    accept={ACCEPT}
    className="sr-only"
    onChange={onFile}
    aria-label="Choose a lesson file: PDF, Word or JSON"
  />
</div>
        </div>
      </main>
    </div>
  );
}
