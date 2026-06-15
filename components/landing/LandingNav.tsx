"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ArrowRight } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Container } from "./primitives";
import { BottomSheet } from "./BottomSheet";

const NAV_LINKS = [
  { href: "#upplevelsen", label: "Upplevelsen" },
  { href: "#funktioner", label: "Funktioner" },
  { href: "#priser", label: "Priser" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  return (
    <>
      <motion.header
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? "border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <Container>
          <nav className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex h-12 items-center font-heading text-2xl tracking-widest text-white transition-colors duration-200 hover:text-pitch"
            >
              ATHOPIA
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              {NAV_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="flex h-12 items-center rounded-lg px-4 text-sm text-white/55 transition-colors duration-200 hover:text-white"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="hidden h-12 items-center rounded-xl border border-white/15 px-5 text-sm text-white/60 transition-all duration-200 hover:border-white/35 hover:text-white md:inline-flex"
              >
                Logga in
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-pitch px-4 text-sm font-bold text-black transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] md:h-12 md:px-5"
              >
                Börja gratis
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Öppna meny"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-white active:scale-[0.94] md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </nav>
        </Container>
      </motion.header>

      {/* Mobilmeny som bottom sheet — ingen hamburger-dropdown */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Meny">
        <nav className="flex flex-col pb-4">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-14 items-center justify-between border-b border-white/[0.06] text-[17px] font-medium text-white/85 active:text-pitch"
            >
              {label}
              <ArrowRight className="h-4 w-4 text-white/30" />
            </a>
          ))}
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/onboarding"
              className="flex h-14 items-center justify-center rounded-2xl bg-pitch text-[17px] font-bold text-black active:scale-[0.98]"
            >
              Börja gratis
            </Link>
            <Link
              href="/sign-in"
              className="flex h-14 items-center justify-center rounded-2xl border border-white/15 text-[17px] font-medium text-white/80 active:scale-[0.98]"
            >
              Logga in
            </Link>
          </div>
        </nav>
      </BottomSheet>
    </>
  );
}
