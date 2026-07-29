import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { jsonContract } from "@/lib/api-contract";
import { FeedEventsResponseSchema } from "@/lib/api-schemas";
import {
  FeedEventsRequestSchema,
  validateFeedEventTimes,
} from "@/lib/feed/feed-event-schema";
import { enforceRateLimit } from "@/lib/ratelimit";
import { createServiceClient } from "@/lib/supabase";

function errorResponse(
  status: number,
  code: string,
  message: string,
  retryable = false,
) {
  return NextResponse.json(
    { error: { code, message, retryable } },
    { status },
  );
}

export async function POST(req: Request) {
  const { userId } = await auth();
  const blocked = await enforceRateLimit("write", req, userId);
  if (blocked) return blocked;

  if (!userId) {
    return jsonContract(FeedEventsResponseSchema, {
      ok: true,
      accepted: 0,
      duplicates: 0,
      skipped: "authentication_required",
    });
  }

  let db: ReturnType<typeof createServiceClient>;
  try {
    db = createServiceClient();
    const { data: config, error: configError } = await db
      .from("user_feed_config")
      .select("personalization_enabled")
      .eq("clerk_user_id", userId)
      .eq("sport", "football")
      .maybeSingle();

    if (configError) {
      console.error("[feed-events] config:", configError.message);
      return errorResponse(503, "storage_failed", "Event storage unavailable.", true);
    }
    if (config?.personalization_enabled !== true) {
      return jsonContract(FeedEventsResponseSchema, {
        ok: true,
        accepted: 0,
        duplicates: 0,
        skipped: "personalization_disabled",
      });
    }
  } catch (error) {
    console.error("[feed-events] config:", error);
    return errorResponse(503, "storage_failed", "Event storage unavailable.", true);
  }

  const parsed = FeedEventsRequestSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success || !validateFeedEventTimes(parsed.data.events)) {
    return errorResponse(400, "invalid_payload", "Invalid feed event batch.");
  }

  const rows = parsed.data.events.map((event) => ({
    event_key: event.eventKey,
    clerk_user_id: userId,
    sport: "football",
    event_type: event.eventType,
    surface: event.surface,
    module_key: event.moduleKey ?? null,
    item_id: event.itemId ?? null,
    story_id: event.storyId ?? null,
    position: event.position ?? null,
    score: event.score ?? null,
    ranker_version: event.rankerVersion ?? null,
    schema_version: event.schemaVersion,
    metadata: event.metadata,
    factors: event.factors,
    occurred_at: event.occurredAt,
  }));

  try {
    const { data, error } = await db
      .from("feed_interactions")
      .upsert(rows, { onConflict: "event_key", ignoreDuplicates: true })
      .select("event_key");

    if (error) {
      if (
        error.code === "P0001" &&
        error.message === "feed personalization is disabled"
      ) {
        return jsonContract(FeedEventsResponseSchema, {
          ok: true,
          accepted: 0,
          duplicates: 0,
          skipped: "personalization_disabled",
        });
      }
      console.error("[feed-events]", error.message);
      return errorResponse(503, "storage_failed", "Event storage unavailable.", true);
    }

    const accepted = data?.length ?? 0;
    return jsonContract(FeedEventsResponseSchema, {
      ok: true,
      accepted,
      duplicates: rows.length - accepted,
    });
  } catch (error) {
    console.error("[feed-events]", error);
    return errorResponse(503, "storage_failed", "Event storage unavailable.", true);
  }
}
