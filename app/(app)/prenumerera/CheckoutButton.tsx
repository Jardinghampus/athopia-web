"use client";

/**
 * CheckoutButton — Client Component
 * Initierar Stripe Checkout Session via /api/create-checkout för en given
 * plan (pro/elite) + intervall (month/year).
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { PaidPlan, BillingInterval } from "@/lib/pricing";

interface Props {
  plan: PaidPlan;
  interval: BillingInterval;
  label: string;
  variant?: "primary" | "outline";
}

export function CheckoutButton({ plan, interval, label, variant = "primary" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const { url, error } = await res.json();

      if (error || !url) {
        alert("Något gick fel. Försök igen.");
        return;
      }

      window.location.href = url;
    } catch {
      alert("Nätverksfel. Kontrollera din anslutning.");
    } finally {
      setLoading(false);
    }
  }

  const styles =
    variant === "primary"
      ? "pitch-gradient text-white hover:opacity-90"
      : "border border-pitch/40 text-foreground hover:border-pitch";

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`w-full h-11 rounded-xl font-medium text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 ${styles}`}
      aria-label={`Starta ${plan}-prenumeration`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Laddar…
        </>
      ) : (
        label
      )}
    </button>
  );
}
