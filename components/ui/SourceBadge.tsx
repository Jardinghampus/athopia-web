import { Badge } from "@/components/ui/badge";

function hashString(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

const palette = [
  "bg-pitch/15 text-pitch-light border-pitch/25",
  "bg-blue-500/10 text-blue-300 border-blue-500/20",
  "bg-amber-500/10 text-amber-300 border-amber-500/20",
  "bg-purple-500/10 text-purple-300 border-purple-500/20",
  "bg-red-500/10 text-red-300 border-red-500/20",
];

export function SourceBadge({ sourceName }: { sourceName: string }) {
  const idx = hashString(sourceName ?? "") % palette.length;
  return (
    <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${palette[idx]}`}>
      {sourceName}
    </Badge>
  );
}

