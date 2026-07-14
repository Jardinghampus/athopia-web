import { NextResponse } from "next/server";

export const revalidate = 3600;

const UNIVERSAL_LINK_COMPONENTS = [
  "/artikel/*",
  "/nyhet/*",
  "/lag/*",
  "/spelare/*",
  "/match/*",
  "/match",
  "/forum/*",
  "/forum",
  "/allsvenskan",
  "/allsvenskan/*",
  "/analys",
  "/analys/*",
  "/daily",
  "/podcast",
  "/podcast/*",
  "/nyheter",
  "/statistik",
  "/statistik/*",
  "/mitt-lag",
  "/profil",
  "/konto",
  "/ai",
].map((path) => ({ "/": path }));

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
