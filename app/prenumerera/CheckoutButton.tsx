"use client";

/**
 * CheckoutButton — Client Component
 * Initierar Stripe Checkout Session via /api/create-checkout.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout", { method: "POST" });
      const { url, error } = await res.json();

      if (error) {
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

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full h-11 rounded-xl pitch-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
      aria-label="Starta PRO-prenumeration"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Laddar…
        </>
      ) : (
        "Starta PRO — 39 kr/mån"
      )}
    </button>
  );
}
