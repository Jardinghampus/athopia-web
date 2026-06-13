"use client";

import { useEffect, useRef, useState } from "react";
import { useUser, useSignIn } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Camera, Check, Loader2, Lock, Mail, ShieldCheck, KeyRound } from "lucide-react";
import { ProfileCard, type PublicProfile } from "@/components/profile/ProfileCard";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";

interface Team { id: string; name: string; slug: string | null }

export function ProfilePageClient({
  initialProfile,
  email,
  firstName: initialFirst,
  lastName: initialLast,
  favouriteTeamId,
}: {
  initialProfile: PublicProfile;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  favouriteTeamId: string | null;
}) {
  const { user } = useUser();
  const { signIn } = useSignIn();
  const { setFavoriteTeam } = useFavoriteTeam();

  const [profile, setProfile] = useState<PublicProfile>(initialProfile);
  const [firstName, setFirstName] = useState(initialFirst ?? "");
  const [lastName, setLastName] = useState(initialLast ?? "");
  const [nickname, setNickname] = useState(initialProfile.nickname ?? "");
  const [bio, setBio] = useState(initialProfile.bio ?? "");

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Lag-lista (Allsvenskan) för lagbyte
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState(favouriteTeamId ?? "");

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!url || !key) return;
    const db = createClient(url, key);
    void db
      .from("entities")
      .select("id,name,slug,metadata")
      .eq("type", "team")
      .order("name")
      .then(({ data }) => {
        const rows = (data ?? []) as (Team & { metadata: Record<string, unknown> | null })[];
        const alls = rows.filter((t) => t.metadata?.["league"] === "Allsvenskan");
        setTeams(alls.length > 0 ? alls : rows);
      });
  }, []);

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setSavedAt(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, nickname, bio }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Kunde inte spara");
        return;
      }
      setProfile((p) => ({
        ...p,
        nickname: nickname || null,
        bio: bio || null,
        display_name: [firstName, lastName].filter(Boolean).join(" ") || null,
      }));
      setSavedAt(true);
      setTimeout(() => setSavedAt(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError(null);
    try {
      const res = await user.setProfileImage({ file });
      const newUrl = res.publicUrl ?? user.imageUrl;
      setProfile((p) => ({ ...p, avatar_url: newUrl }));
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: newUrl }),
      });
    } catch {
      setError("Kunde inte ladda upp bilden");
    }
  }

  async function changeTeam(newId: string) {
    setTeamId(newId);
    const team = teams.find((t) => t.id === newId);
    if (!team) return;
    await setFavoriteTeam(team.slug ?? team.id);
    await fetch("/api/feed/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followed_team_ids: [team.id] }),
    }).catch(() => {});
  }

  async function sendReset() {
    if (!signIn || !email) return;
    try {
      const params = {
        strategy: "reset_password_email_code",
        identifier: email,
      } as unknown as Parameters<typeof signIn.create>[0];
      await signIn.create(params);
      setResetSent(true);
    } catch {
      setError("Kunde inte skicka återställningsmail");
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <h1 className="font-heading text-4xl text-foreground">MIN PROFIL</h1>

      {/* Profilkort (samma som andra ser) + byt bild */}
      <div className="relative">
        <ProfileCard profile={profile} />
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 text-xs text-muted-foreground shadow-sm hover:text-foreground transition-colors"
        >
          <Camera className="h-3.5 w-3.5" /> Byt bild
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarPick} />
      </div>

      {/* Redigera offentlig profil */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Offentlig profil
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Förnamn" value={firstName} onChange={setFirstName} placeholder="Förnamn" />
          <Field label="Efternamn" value={lastName} onChange={setLastName} placeholder="Efternamn" />
        </div>

        <div>
          <Field
            label="Nickname (unikt)"
            value={nickname}
            onChange={(v) => setNickname(v.replace(/\s/g, ""))}
            placeholder="t.ex. hammarby_hampus"
            prefix="@"
          />
          <p className="mt-1 text-xs text-muted-foreground">3–20 tecken: bokstäver, siffror, _</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 280))}
            rows={3}
            placeholder="Berätta lite om dig..."
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{bio.length}/280</p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full min-h-11 rounded-xl bg-pitch text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedAt ? <Check className="h-4 w-4" /> : null}
          {saving ? "Sparar..." : savedAt ? "Sparat" : "Spara ändringar"}
        </button>
      </section>

      {/* Byt favoritlag */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Mitt lag
        </h2>
        <select
          value={teamId}
          onChange={(e) => changeTeam(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Välj lag...</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </section>

      {/* Hemlig kontoinfo — ALDRIG offentlig */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Privat kontoinfo
        </h2>
        <p className="text-xs text-muted-foreground">Detta visas aldrig för andra användare.</p>

        <ListGroup>
          <ListRow leading={<Mail />} title="E-post" trailing={<span className="text-foreground text-sm">{email ?? "–"}</span>} />
          <ListRow
            leading={<ShieldCheck />}
            title="Verifierad"
            trailing={
              <span className={profile.verified ? "text-[#1D9BF0] text-sm" : "text-muted-foreground text-sm"}>
                {profile.verified ? "Ja" : "Nej"}
              </span>
            }
          />
        </ListGroup>

        <button
          onClick={sendReset}
          disabled={resetSent}
          className="w-full min-h-11 rounded-xl border border-border text-sm font-medium text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-60"
        >
          <KeyRound className="h-4 w-4" />
          {resetSent ? "Återställningsmail skickat" : "Återställ lösenord"}
        </button>
      </section>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, prefix,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <div className="flex items-center rounded-xl border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
        {prefix && <span className="text-muted-foreground text-sm">{prefix}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none"
        />
      </div>
    </div>
  );
}
