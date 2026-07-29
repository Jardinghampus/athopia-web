import { pathToFileURL } from "node:url";

export function assertProductionAuthEnv(env = process.env) {
  if (env.VERCEL_ENV !== "production") return;

  const publishableKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const secretKey = env.CLERK_SECRET_KEY ?? "";
  const problems = [];

  if (!publishableKey.startsWith("pk_live_")) {
    problems.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must use pk_live_");
  }

  if (!secretKey.startsWith("sk_live_")) {
    problems.push("CLERK_SECRET_KEY must use sk_live_");
  }

  if (problems.length > 0) {
    throw new Error(
      [
        "Production deploy blocked: Clerk development keys are configured.",
        ...problems.map((problem) => `- ${problem}`),
        "Create or select the Clerk production instance, then update both Vercel Production variables.",
      ].join("\n")
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assertProductionAuthEnv();
}
