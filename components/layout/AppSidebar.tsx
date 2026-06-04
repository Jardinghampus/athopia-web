"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  IconHome,
  IconNews,
  IconTrophy,
  IconHeadphones,
  IconChartBar,
  IconFlame,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { Sidebar, DesktopSidebar, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/app", label: "Hem", Icon: IconHome, exact: true },
  { href: "/nyheter", label: "Nyheter", Icon: IconNews, exact: false },
  { href: "/allsvenskan", label: "Allsvenskan", Icon: IconTrophy, exact: false },
  { href: "/match", label: "Matcher", Icon: IconCalendarEvent, exact: false },
  { href: "/podcast", label: "Podcasts", Icon: IconHeadphones, exact: false },
  { href: "/statistik", label: "Statistik", Icon: IconChartBar, exact: false },
  { href: "/analys", label: "Analys", Icon: IconFlame, exact: false },
];

function NavItem({
  href,
  label,
  Icon,
  exact,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  exact: boolean;
}) {
  const { open, animate } = useSidebar();
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-colors duration-150",
        isActive
          ? "text-[var(--color-pitch)] bg-[var(--color-pitch)]/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-[var(--color-pitch)]" : "text-foreground/60"
        )}
      />
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="whitespace-nowrap font-medium"
      >
        {label}
      </motion.span>
    </Link>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-14 h-[calc(100vh-3.5rem)] self-start shrink-0">
      <Sidebar open={open} setOpen={setOpen}>
        <DesktopSidebar className="h-full !bg-background border-r border-border/50 py-4 flex-col gap-0.5">
          {NAV_LINKS.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              Icon={link.Icon}
              exact={link.exact}
            />
          ))}
        </DesktopSidebar>
      </Sidebar>
    </div>
  );
}
