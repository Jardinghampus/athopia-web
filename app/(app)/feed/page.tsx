import type { Metadata } from "next";
import { FeedDashboard } from "./FeedDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Athopia",
  description: "Din personaliserade football dashboard — statistik, nyheter, forum och podcasts för ditt lag.",
};

export default function FeedPage() {
  return <FeedDashboard />;
}
