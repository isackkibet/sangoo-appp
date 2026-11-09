"use client";

import { useCallback, useRef, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import type { Language } from "@/components/ai/types";
import { dictionary } from "@/components/ai/i18n";

/**
 * Ask SIHU AI about the current article.
 * Sends the question plus the article title/excerpt to the existing
 * /api/ai/chat endpoint so answers are grounded in the real article.
 * Keeps AI responses visually separate from the original article content.
 */
type Props = {
  title: string;
  excerpt: string;
  content: string;
  language: Language;
};

export default function AskSIHU({ title, language }: Props) {
  const t = dictionary[language];
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const ask = useCallback(async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `About the article "${title}": ${q}`,
          sessionId: `article-${title}`,
          language,
          history: [],
        }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || data.error) {
        throw new Error(data.error || "Request failed");
      }
      setAnswer(data.reply || t.errorReply);
    } catch {
      setError(t.errorReply);
    } finally {
      setLoading(false);
    }
  }, [question, title, language, loading, t.errorReply]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void ask();
    }
  };

  return (
    <section className="mt-16 border border-slate-200 rounded-2xl bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={18} strokeWidth={1.5} className="text-primary" aria-hidden="true" />
        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
          Ask SIHU AI about this story
        </h3>
      </div>
      <p className="text-sm text-slate-600 mb-5 dark:text-slate-400">
        Questions about this article are answered separately by SIHU AI and are
        not part of the original story.
      </p>

      <form onSubmit={(event) => { event.preventDefault(); void ask(); }} className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <textarea
            ref={inputRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question about this article…"
            rows={2}
            className="w-full min-h-[72px] resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-primary dark:focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
        >
          {loading ? (
            <>
              <span className="relative inline-flex h-4 w-4">
                <span className="animate-spin absolute h-full w-full rounded-full border-b-2 border-primary"></span>
              </span>
              Asking
            </>
          ) : (
            <>Ask SIHU</>
          )}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-error dark:text-error-container">{error}</p>
      )}

      {answer && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-3 dark:text-slate-400">
              SIHU AI response
            </h4>
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
              {answer}
            </div>
          </div>
      )}
    </section>
  );
}
