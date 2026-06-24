"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";
import { clsx } from "clsx";

const TABS = [
  { label: "Översikt", href: "" },
  { label: "Nyheter", href: "/nyheter" },
  { label: "Statistik", href: "/statistik" },
  { label: "Podcasts", href: "/podcasts" },
  { label: "Sammanfattning", href: "/sammanfattning" },
];

export default function LagLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const pathname = usePathname();
  const base = `/lag/${slug}`;

  return (
    <div>
      <nav className="sticky top-[57px] z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-none -mb-px">
            {TABS.map((tab) => {
              const href = `${base}${tab.href}`;
              const isActive =
                tab.href === ""
                  ? pathname === base
                  : pathname.startsWith(href);
              return (
                <Link
                  key={tab.href}
                  href={href}
                  className={clsx(
                    "whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-pitch text-pitch"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
