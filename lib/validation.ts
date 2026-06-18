/**
 * lib/validation.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centraliserad input-validering för API-routes med Zod.
 *
 * VARFÖR: Vid 100K användare är varje JSON-body från klienten otillförlitlig.
 * Ad-hoc `if (!content)` missar typer, längd, oväntade fält och ger
 * inkonsekventa felsvar. Zod ger ETT mönster: validera → typ-säker data, eller
 * 400 med tydligt fel.
 *
 * Användning i en route:
 *   const parsed = await parseBody(req, ForumPostSchema);
 *   if (!parsed.ok) return parsed.response;   // 400 redan formaterat
 *   const { content } = parsed.data;          // typ-säker
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextResponse } from "next/server";
import { z } from "zod";

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/**
 * Läs och validera JSON-body mot ett Zod-schema.
 * Returnerar { ok:true, data } eller { ok:false, response } (400).
 */
export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Ogiltig JSON i request-body." },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return {
      ok: false,
      response: NextResponse.json(
        {
          message: firstIssue?.message ?? "Valideringsfel.",
          field: firstIssue?.path.join("."),
        },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}

/** Validera query-params (URLSearchParams → objekt) mot ett schema. */
export function parseQuery<T>(
  req: Request,
  schema: z.ZodType<T>
): ParseResult<T> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return {
      ok: false,
      response: NextResponse.json(
        { message: firstIssue?.message ?? "Ogiltiga parametrar." },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}

export { z };
