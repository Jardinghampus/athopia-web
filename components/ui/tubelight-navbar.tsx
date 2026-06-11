"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

export function NavBar({ items, className }: NavBarProps) {
  const pathname = usePathname();
  const initial = items.find((item) => item.url === pathname)?.name ?? items[0]!.name;
  const [activeTab, setActiveTab] = useState(initial);

  return (
    <div className={cn("z-50", className)}>
      {/* Liquid glass: hög blur + saturate, inre topp-highlight, mjuk yttre skugga */}
      <div className="flex items-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.05] backdrop-blur-2xl backdrop-saturate-[1.8] py-1 px-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.4)]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-sm font-sans font-semibold px-5 py-2.5 rounded-full transition-colors",
                "text-white/70 hover:text-white",
                isActive && "text-pitch"
              )}
            >
              <span className="hidden lg:inline">{item.name}</span>
              <span className="lg:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="tubelight"
                  className="absolute inset-0 w-full bg-pitch/[0.08] rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-pitch rounded-t-full">
                    <div className="absolute w-12 h-6 bg-pitch/25 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-pitch/25 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-pitch/25 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
