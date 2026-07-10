import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TrendBadge({
  trend,
  value,
}: {
  trend: "rising" | "falling" | "stable";
  value?: number;
}) {
  const common = "gap-1.5";
  if (trend === "rising") {
    return (
      <Badge variant="outline" className={cn(common, "border-success/30 text-success bg-success/10")}>
        <TrendingUp className="w-3 h-3" />
        Stigande{typeof value === "number" ? ` ${Math.round(value)}%` : ""}
      </Badge>
    );
  }
  if (trend === "falling") {
    return (
      <Badge variant="outline" className={cn(common, "border-red-500/25 text-red-300 bg-red-500/10")}>
        <TrendingDown className="w-3 h-3" />
        Fallande{typeof value === "number" ? ` ${Math.round(value)}%` : ""}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn(common, "border-white/10 text-muted-foreground bg-white/5")}>
      <Minus className="w-3 h-3" />
      Stabil{typeof value === "number" ? ` ${Math.round(value)}%` : ""}
    </Badge>
  );
}

