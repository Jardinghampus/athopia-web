import { NextResponse } from "next/server";
import type { z } from "zod";

/**
 * Svara med ett kontraktvaliderat JSON-svar.
 *
 * Servern är auktoritativ — då ska den också bevisa att den håller sitt eget
 * kontrakt. Bryter payloaden schemat är det ett serverfel, inte ett klientfel:
 * iOS hade tyst misslyckats med decoden.
 *
 * Dev/test: kastar direkt så felet syns i utvecklingen.
 * Produktion: loggar och skickar ändå — ett nytt fält eller en oväntad null ska
 * aldrig ta ned en live-yta för alla användare.
 */
export function jsonContract<T>(
  schema: z.ZodType<T>,
  payload: T,
  init?: ResponseInit,
): NextResponse {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("; ");

    if (process.env.NODE_ENV !== "production") {
      throw new Error(`API-kontraktet bröts: ${detail}`);
    }
    console.error("[api-contract] Svaret bröt sitt schema:", detail);
  }

  return NextResponse.json(payload, init);
}
