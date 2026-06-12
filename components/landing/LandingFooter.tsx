"use client";

import Link from "next/link";
import { Container } from "./primitives";

const FOOTER_COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Produkt",
    links: [
      { label: "Nyheter", href: "/nyheter" },
      { label: "Matcher", href: "/match" },
      { label: "Statistik", href: "/statistik" },
      { label: "Forum", href: "/forum" },
    ],
  },
  {
    title: "Konto",
    links: [
      { label: "Logga in", href: "/sign-in" },
      { label: "Skapa konto", href: "/sign-up" },
      { label: "Prenumerera", href: "/prenumerera" },
    ],
  },
  {
    title: "Athopia",
    links: [
      { label: "Allsvenskan", href: "/allsvenskan" },
      { label: "Podcasts", href: "/podcast" },
      { label: "Integritetspolicy", href: "/integritetspolicy" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] pb-[max(env(safe-area-inset-bottom),40px)] pt-16">
      <Container>
        <div className="mb-14 grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-2 font-heading text-2xl tracking-widest text-white">ATHOPIA</div>
            <p className="text-sm text-white/35">Allsvenskan på djupet.</p>
          </div>

          {FOOTER_COLS.map(({ title, links }) => (
            <div key={title}>
              <h4 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {title}
              </h4>
              <ul className="flex flex-col">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="flex min-h-11 items-center text-sm text-white/45 transition-colors duration-200 hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
          <p className="text-xs text-white/20">© 2026 Athopia · Alla rättigheter förbehållna</p>
          <Link
            href="/integritetspolicy"
            className="flex min-h-11 items-center text-xs text-white/20 transition-colors duration-200 hover:text-white/50"
          >
            Integritetspolicy
          </Link>
        </div>
      </Container>
    </footer>
  );
}
