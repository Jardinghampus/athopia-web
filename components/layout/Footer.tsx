import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-24 py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-10 text-sm">
        <div className="md:col-span-1">
          <div className="font-heading text-2xl text-gradient">ATHOPIA</div>
          <p className="mt-2 text-muted-foreground">Svensk fotbollsintelligens</p>
          <div className="mt-4">
            <Badge variant="outline" className="bg-white/5 border-white/10 text-foreground/80">
              Byggd med AI
            </Badge>
          </div>
        </div>

        <div>
          <div className="font-medium text-foreground mb-3">Innehåll</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/nyheter" className="hover:text-foreground transition-colors">
                Nyheter
              </Link>
            </li>
            <li>
              <Link href="/allsvenskan" className="hover:text-foreground transition-colors">
                Allsvenskan
              </Link>
            </li>
            <li>
              <Link href="/podcast" className="hover:text-foreground transition-colors">
                Podcasts
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-medium text-foreground mb-3">Lag</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/lag/aik" className="hover:text-foreground transition-colors">
                AIK
              </Link>
            </li>
            <li>
              <Link href="/lag/djurgarden" className="hover:text-foreground transition-colors">
                DIF
              </Link>
            </li>
            <li>
              <Link href="/lag/malmo" className="hover:text-foreground transition-colors">
                Malmö
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-medium text-foreground mb-3">Om</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/prenumerera" className="hover:text-foreground transition-colors">
                Bli PRO
              </Link>
            </li>
            <li>
              <Link href="/integritetspolicy" className="hover:text-foreground transition-colors">
                Integritet
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Athopia.
      </div>
    </footer>
  );
}

