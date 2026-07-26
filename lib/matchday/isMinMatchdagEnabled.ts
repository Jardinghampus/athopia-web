/** Feature flag: OFF by default so prod behavior is unchanged. */
export function isMinMatchdagEnabled(): boolean {
  return process.env.MIN_MATCHDAG === "true";
}
