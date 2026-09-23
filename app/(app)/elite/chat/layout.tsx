import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elite AI-assistent | Nano Fotboll",
  robots: { index: false },
};

export default function EliteChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
