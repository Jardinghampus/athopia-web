"use client";

import Image from "next/image";
import { BadgeCheck, PenLine } from "lucide-react";

export interface PublicProfile {
  clerk_user_id: string;
  nickname: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean;
  role?: "reader" | "columnist";
  created_at: string;
}

function memberSince(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

// Team-gradient (ljusblå → mörkblå för alla just nu; byts till lagfärger senare)
const TEAM_GRADIENT = "linear-gradient(135deg, #4DA3FF 0%, #0B2A6B 100%)";

export function ProfileCard({ profile }: { profile: PublicProfile }) {
  const name = profile.nickname ?? profile.display_name ?? "Anonym";

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      {/* Topp ~30% — team-gradient */}
      <div className="relative h-28" style={{ background: TEAM_GRADIENT }} aria-hidden />

      {/* Rund profilbild, centrerad, överlappar gradienten */}
      <div className="flex flex-col items-center px-6 pb-7 -mt-12">
        <div className="rounded-full ring-4 ring-card bg-card">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
              {initials(name)}
            </div>
          )}
        </div>

        {/* Nickname + verifierad-badge */}
        <div className="mt-4 flex items-center gap-1.5">
          <h2 className="text-xl font-semibold text-foreground">{name}</h2>
          {profile.verified && (
            <BadgeCheck
              className="h-5 w-5 text-[#1D9BF0]"
              fill="#1D9BF0"
              stroke="white"
              aria-label="Verifierad"
            />
          )}
          {profile.role === "columnist" && (
            <PenLine className="h-4 w-4 text-pitch" aria-label="Krönikör hos Athopia" />
          )}
        </div>
        {profile.role === "columnist" && (
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-pitch">Krönikör</span>
        )}

        {/* Medlem sedan */}
        <p className="mt-1 text-xs text-muted-foreground">
          Medlem sedan {memberSince(profile.created_at)}
        </p>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 max-w-sm text-center text-sm leading-relaxed text-foreground/80">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  );
}
