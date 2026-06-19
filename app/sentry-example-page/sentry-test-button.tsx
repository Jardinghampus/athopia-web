"use client";

export default function SentryTestButton() {
  return (
    <button
      type="button"
      className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={() => {
        throw new Error("Sentry Test Error");
      }}
    >
      Trigger test error
    </button>
  );
}
