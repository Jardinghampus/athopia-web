import { NextResponse } from "next/server";
import { universalLinkPaths } from "@/lib/deep-links";

export const revalidate = 3600;

const UNIVERSAL_LINK_COMPONENTS = universalLinkPaths().map((path) => ({ "/": path }));

export function GET() {
  const teamId = process.env.APPLE_TEAM_ID;
  const details = teamId
    ? [
        {
          appIDs: [`${teamId}.se.athopia.app`],
          components: UNIVERSAL_LINK_COMPONENTS,
        },
      ]
    : [];

  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details,
      },
      webcredentials: {
        apps: teamId ? [`${teamId}.se.athopia.app`] : [],
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
