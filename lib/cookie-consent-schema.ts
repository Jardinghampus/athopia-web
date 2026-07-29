import { z } from "@/lib/validation";

export const CookieConsentRequestSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
  version: z.number().int().positive().max(100).optional().nullable(),
  savedAt: z.string().datetime().optional().nullable(),
});

export type CookieConsentRequest = z.infer<typeof CookieConsentRequestSchema>;
