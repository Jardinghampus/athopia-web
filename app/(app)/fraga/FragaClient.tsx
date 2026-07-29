"use client";

import { useState } from "react";

type Source = {
  title: string;
  url: string;
  sourceName: string | null;
  publishedAt: string | null;
};

type AskResponse = {
  answer: string;
  sources: Source[];
  grounded: boolean;
};

function relTime(iso: string | null): string {
  if (!iso) return "";
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "just nu";
  if (h < 24) return `${h} tim`;
  return `${Math.round(h / 24)} d`;
}

export function FragaClient() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskResponse | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Något gick fel. Försök igen.");
        return;
      }
      setResult(await res.json());
    } catch {
      setError("Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Fråga Athopia</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Svar bygger enbart på Athopias eget underlag — inte fritt AI-svar.
      </p>

      <form onSubmit={submit} className="mt-6 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="T.ex. Hur har AIK spelat de senaste veckorna?"
          maxLength={500}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none focus:border-pitch"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-xl bg-pitch px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "..." : "Fråga"}
        </button>
      </form>

      {error ? (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-sm leading-relaxed text-foreground">{result.answer}</p>
          </div>

          {result.sources.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {result.sources.map((s, i) => (
                <a
                  key={`${s.url}-${i}`}
                  href={s.url}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/20"
                >
                  {s.sourceName ?? "Källa"} · {relTime(s.publishedAt)}
                </a>
              ))}
            </div>
          ) : null}

          <p className="text-[11px] text-muted-foreground">
            AI-genererat svar — kan ha fel, verifiera med källorna.
          </p>
        </div>
      ) : null}
    </main>
  );
}
