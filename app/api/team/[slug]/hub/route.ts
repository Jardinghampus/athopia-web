import { NextResponse } from "next/server";
import { getTeamHub } from "@/lib/team-hub/queries";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const hub = await getTeamHub(slug);
    if (!hub) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(hub, { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
