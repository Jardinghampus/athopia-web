import type { Metadata } from "next";
import { FeedClient } from "./FeedClient";

export const metadata: Metadata = {
  title: "Mitt feed",
  description: "Personaliserad feed med nyheter, forum och podcasts för ditt lag.",
};

export default function FeedPage() {
  return <FeedClient />;
}
