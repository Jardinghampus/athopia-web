"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { Article } from "@/lib/types";

interface Team {
  name: string;
  slug: string;
}

interface Props {
  articles: Article[];
  teams: Team[];
}

async function classify(articleId: string, isAllsvenskan: boolean, teamSlugs: string[]) {
  const res = await fetch("/api/admin/classify-article", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articleId, isAllsvenskan, teamSlugs }),
  });
  if (!res.ok) throw new Error("Classify failed");
}

function ArticleRow({ article, teams }: { article: Article; teams: Team[] }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [allTeams, setAllTeams] = useState(false);

  const toggleTeam = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleAll = () => {
    if (allTeams) {
      setSelected(new Set());
      setAllTeams(false);
    } else {
      setSelected(new Set(teams.map((t) => t.slug)));
      setAllTeams(true);
    }
  };

  const handleYes = async () => {
    setStatus("saving");
    try {
      await classify(article.id, true, allTeams ? teams.map((t) => t.slug) : [...selected]);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const handleNo = async () => {
    setStatus("saving");
    try {
      await classify(article.id, false, []);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="bg-card border border-border rounded-lg p-4 opacity-50">
        <p className="text-sm text-muted-foreground">✓ Klassificerad</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm leading-snug">{article.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{article.sourceName}</p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">
            Gäller detta Allsvenskan?
          </p>

          <div className="flex gap-2 mb-3">
            <button
              onClick={handleNo}
              disabled={status === "saving"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Nej
            </button>
            <button
              onClick={handleYes}
              disabled={status === "saving" || (selected.size === 0 && !allTeams)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pitch/40 text-pitch text-sm hover:bg-pitch/10 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Ja — publicera
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={toggleAll}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {allTeams ? "Avmarkera alla" : "Alla lag"}
            </button>
            <div className="flex flex-wrap gap-1.5">
              {teams.map((team) => {
                const isOn = allTeams || selected.has(team.slug);
                return (
                  <button
                    key={team.slug}
                    onClick={() => toggleTeam(team.slug)}
                    className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                      isOn
                        ? "bg-pitch/10 border-pitch/40 text-pitch"
                        : "border-border text-muted-foreground hover:border-pitch/40"
                    }`}
                  >
                    {team.name}
                  </button>
                );
              })}
            </div>
          </div>

          {status === "error" && (
            <p className="text-xs text-red-400 mt-2">Något gick fel. Försök igen.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ContentReviewClient({ articles, teams }: Props) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Inga artiklar att granska.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {articles.map((article) => (
        <ArticleRow key={article.id} article={article} teams={teams} />
      ))}
    </div>
  );
}
