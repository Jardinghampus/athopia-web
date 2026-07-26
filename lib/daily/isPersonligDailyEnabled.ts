/** Feature flag: OFF by default so prod behavior is byte-for-byte unchanged. */
export function isPersonligDailyEnabled(): boolean {
  return process.env.PERSONLIG_DAILY === "true";
}
