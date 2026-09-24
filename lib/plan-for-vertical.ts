import type { Plan } from "./access-rules";

/**
 * Fotboll läser `publicMetadata.plan` exakt som tidigare.
 * Hockey läser bara `plans.hockey` och är free när fältet saknas,
 * så en fotbolls-PRO inte blir hockey-PRO.
 */
export function planForVertical(
  vertical: "football" | "hockey",
  metadata: { plan?: unknown; plans?: unknown } | null | undefined,
): Plan {
  if (!metadata) return "free";
  if (vertical === "hockey") {
    const plans = metadata.plans;
    if (plans && typeof plans === "object") {
      const value = (plans as { hockey?: unknown }).hockey;
      return value === "elite" ? "elite" : value === "pro" ? "pro" : "free";
    }
    return "free";
  }
  return (metadata.plan as Plan) ?? "free";
}
