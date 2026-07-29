import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/ratelimit";
import { recordAttributedEvent } from "@/lib/social-attribution";

const propertyValueSchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const propertiesSchema = z
  .record(z.string().min(1).max(64), propertyValueSchema)
  .refine((properties) => Object.keys(properties).length <= 20, {
    message: "För många properties",
  });

const bodySchema = z.object({
  event: z.enum(["team_selected", "activated"]),
  path: z.string().min(1).max(500).default("/onboarding"),
  properties: propertiesSchema.optional(),
});

export async function POST(req: Request) {
  const blocked = await enforceRateLimit("write", req);
  if (blocked) return blocked;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  await recordAttributedEvent({
    event: parsed.data.event,
    clerkUserId: userId,
    path: parsed.data.path,
    properties: parsed.data.properties,
  });
  return NextResponse.json({ ok: true });
}
