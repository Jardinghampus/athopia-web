"use client";

import { useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";

export interface RatablePlayer {
  playerId: number;
  name: string;
  teamName: string;
  avg: number | null;
  votes: number;
  myRating: number | null;
}

/**
 * Spelarbetyg efter FT (audit T7): 1–10 per startspelare, snitt + antal röster.
 * Optimistisk UI — POST /api/gamification/rate-player upsertar per användare.
 */
export function PlayerRatingPanel({ fixtureId, players }: { fixtureId: number; players: RatablePlayer[] }) {
  const { isSignedIn } = useUser();
  const [state, setState] = useState(() => new Map(players.map((p) => [p.playerId, p])));
  const [open, setOpen] = useState<number | null>(null);

  if (players.length === 0) return null;

  const rate = async (playerId: number, rating: number) => {
    const prev = state.get(playerId)!;
    const firstVote = prev.myRating == null;
    const votes = firstVote ? prev.votes + 1 : prev.votes;
    // Optimistiskt snitt — servern äger sanningen vid nästa load
    const total = (prev.avg ?? 0) * prev.votes - (prev.myRating ?? 0) + rating;
    const next = { ...prev, myRating: rating, votes, avg: votes > 0 ? total / votes : rating };
    setState(new Map(state).set(playerId, next));
    setOpen(null);
    await fetch("/api/gamification/rate-player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixtureId, playerId, rating }),
    }).catch(() => {});
  };

  const byTeam = new Map<string, RatablePlayer[]>();
  for (const p of state.values()) {
    byTeam.set(p.teamName, [...(byTeam.get(p.teamName) ?? []), p]);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Betygsätt insatsen</h3>
        {!isSignedIn && (
          <SignInButton mode="modal">
            <button className="text-xs text-pitch hover:underline">Logga in för att rösta</button>
          </SignInButton>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {[...byTeam.entries()].map(([teamName, list]) => (
          <div key={teamName}>
            <p className="text-xs font-semibold text-foreground mt-2 mb-1 truncate">{teamName}</p>
            {list.map((p) => (
              <div key={p.playerId} className="py-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex-1 text-foreground/80 truncate">{p.name}</span>
                  {p.avg != null && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {p.avg.toFixed(1)} ({p.votes})
                    </span>
                  )}
                  {isSignedIn && (
                    <button
                      onClick={() => setOpen(open === p.playerId ? null : p.playerId)}
                      className={`text-xs rounded-full border px-2 py-0.5 transition-colors ${
                        p.myRating != null
                          ? "border-pitch/60 text-pitch"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p.myRating != null ? p.myRating : "Betyg"}
                    </button>
                  )}
                </div>
                {open === p.playerId && (
                  <div className="flex gap-1 mt-1.5 mb-1 flex-wrap">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => rate(p.playerId, n)}
                        className={`w-7 h-7 rounded-md text-xs font-semibold border transition-colors ${
                          p.myRating === n
                            ? "bg-pitch text-white border-pitch"
                            : "border-border/60 text-muted-foreground hover:border-pitch/60 hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
