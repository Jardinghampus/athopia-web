"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, TrendingUp, Flame, MessageSquare } from "lucide-react";

interface Topic {
  label: string;
  count: number;
  trend: "hot" | "rising" | "normal";
}

interface Props {
  teamName: string;
  summary: string;
  topics: Topic[];
  postCount: number;
  activeUsers: number;
  generatedAt: string;
}

export default function ForumDailySummary({ teamName, summary, topics, postCount, activeUsers, generatedAt }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-pitch/25 bg-pitch/5 overflow-hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-pitch/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-pitch" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-pitch uppercase tracking-wider">
            Senaste 24h · {teamName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {postCount} inlägg · {activeUsers} aktiva · {generatedAt}
          </p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-pitch shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-pitch shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-sm text-foreground/90 leading-relaxed border-t border-pitch/10 pt-4">
            {summary}
          </p>

          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <span
                key={t.label}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  t.trend === "hot"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : t.trend === "rising"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400"
                }`}
              >
                {t.trend === "hot" ? (
                  <Flame className="w-3 h-3" />
                ) : t.trend === "rising" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <MessageSquare className="w-3 h-3" />
                )}
                {t.label}
                <span className="opacity-60">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
