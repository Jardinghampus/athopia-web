import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ProGate({
  children,
  feature = "den här funktionen",
}: {
  children: ReactNode;
  feature?: string;
}) {
  const { sessionClaims } = await auth();
  const tier = (sessionClaims?.publicMetadata as { subscriptionTier?: string })?.subscriptionTier;
  const isPro = tier === "pro";

  if (isPro) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[2px] opacity-60">{children}</div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="glass rounded-2xl p-6 max-w-md w-[92%] border border-white/10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="font-heading text-2xl text-foreground">Låst innehåll</h3>
            <Badge className="pitch-gradient text-white">PRO</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Uppgradera för att läsa {feature}.
          </p>
          <Link href="/prenumerera" className="block">
            <Button className="w-full">Uppgradera</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

