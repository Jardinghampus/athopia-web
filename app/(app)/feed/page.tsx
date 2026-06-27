import type { Metadata } from "next";
import { FeedClient } from "./FeedClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feed | Athopia",
  description: "Din personaliserade nyhetsström — nyheter, AI-analyser och forum för ditt lag.",
};

export default function FeedPage() {
  return <FeedClient />;
}
