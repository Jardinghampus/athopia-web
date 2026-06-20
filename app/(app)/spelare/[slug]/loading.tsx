export default function LoadingPlayerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center gap-6">
        <div className="size-20 rounded-full skeleton-wave bg-muted/50" />
        <div className="space-y-3">
          <div className="h-10 w-64 max-w-[70vw] rounded-lg skeleton-wave bg-muted/50" />
          <div className="h-4 w-44 rounded skeleton-wave bg-muted/40" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-6 w-44 rounded skeleton-wave bg-muted/50" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl border border-border bg-card p-4">
              <div className="h-7 w-16 rounded skeleton-wave bg-muted/50" />
              <div className="mt-3 h-3 w-20 rounded skeleton-wave bg-muted/40" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="h-96 rounded-2xl border border-border bg-card skeleton-wave" />
        <div className="h-96 rounded-2xl border border-border bg-card skeleton-wave" />
      </div>
    </div>
  );
}
