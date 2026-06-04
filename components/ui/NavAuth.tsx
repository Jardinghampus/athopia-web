"use client";

/**
 * NavAuth — Client Component
 * Hanterar auth-UI i navigationen med Clerk v7.
 * clerkEnabled=false renderar en statisk fallback (dev utan Clerk-nycklar).
 */

import Link from "next/link";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";

// ─── Fallback (ingen Clerk) ────────────────────────────────────────────────────
function FallbackAuth() {
  return (
    <Link
      href="/prenumerera"
      className="text-sm px-4 py-1.5 rounded-full pitch-gradient text-white font-medium hover:opacity-90 transition-opacity"
    >
      PRO
    </Link>
  );
}

// ─── Clerk-baserad auth ────────────────────────────────────────────────────────
function ClerkAuth() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="w-20 h-8 rounded-full bg-secondary animate-pulse" />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <SignInButton mode="modal">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Logga in
          </button>
        </SignInButton>
        <Link
          href="/prenumerera"
          className="text-sm px-4 py-1.5 rounded-full pitch-gradient text-white font-medium hover:opacity-90 transition-opacity"
        >
          PRO
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/konto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        Konto
      </Link>
      <UserButton />
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────
export function NavAuth({ clerkEnabled }: { clerkEnabled: boolean }) {
  if (!clerkEnabled) return <FallbackAuth />;
  return <ClerkAuth />;
}
