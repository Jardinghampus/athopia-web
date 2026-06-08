"use client";

import { useState } from "react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";

export default function ForumSummaryBar({ summary }: { summary: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <Brain className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide flex-1">
          AI-summering · senaste timmen
        </span>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-amber-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-amber-500" />
        )}
      </button>
      {!collapsed && (
        <p className="px-4 pb-4 text-sm text-foreground/90 leading-relaxed">{summary}</p>
      )}
    </div>
  );
}
