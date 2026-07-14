import { NextResponse } from "next/server";
import { canAccess } from "@/lib/access-rules";
import { getTransferRadar } from "@/lib/team-hub/transfers";
import { getUserPlan } from "@/lib/user-plan";

export const revalidate = 300;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const items = await getTransferRadar(slug);
  const plan = await getUserPlan();
  const unlocked = canAccess("transferSignals", plan);
  const confirmed = items.filter((item) => item.status === "bekraftad").length;

  return NextResponse.json({
    items: unlocked
      ? items
      : items.map((item) => ({
          id: item.id,
          title: item.title,
          publishedAt: item.publishedAt,
        })),
    unlocked,
    requiredPlan: "pro",
    tease:
      items.length > 0
        ? `${items.length} transfer-signaler${confirmed ? ` · ${confirmed} bekräftade` : ""}`
        : null,
  });
}
