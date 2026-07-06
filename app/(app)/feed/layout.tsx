import { FeedMatchHero } from "@/components/feed/FeedMatchHero";

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="px-4 sm:px-6 pt-4 max-w-2xl mx-auto">
        <FeedMatchHero />
      </div>
      {children}
    </div>
  );
}
