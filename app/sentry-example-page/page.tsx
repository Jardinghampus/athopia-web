import SentryTestButton from "./sentry-test-button";

export const metadata = {
  title: "Sentry example | Athopia",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SentryExamplePage() {
  return (
    <main className="min-h-dvh bg-background px-6 py-16 text-foreground">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase text-muted-foreground">
            Sentry verification
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Trigger a client-side test error
          </h1>
          <p className="text-base text-muted-foreground">
            Use this page only while verifying that browser errors reach the
            Athopia Sentry project.
          </p>
        </div>
        <SentryTestButton />
      </div>
    </main>
  );
}
