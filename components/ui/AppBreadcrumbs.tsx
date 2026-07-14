import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = {
  label: string;
  href?: string;
};

function truncate(label: string, max = 36): string {
  const t = label.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Diskret breadcrumb uppe till vänster — bara på djupa sidor.
 */
export function AppBreadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  if (items.length < 2) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="gap-1 text-[11px] sm:text-xs tracking-wide">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const label = truncate(item.label, last ? 42 : 28);
          return (
            <BreadcrumbItem key={`${item.label}-${i}`}>
              {i > 0 ? <BreadcrumbSeparator className="text-muted-foreground/50 [&>svg]:size-3" /> : null}
              {last || !item.href ? (
                <BreadcrumbPage className="font-medium text-foreground/80">{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  render={<Link href={item.href} />}
                  className="text-muted-foreground hover:text-pitch"
                >
                  {label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
