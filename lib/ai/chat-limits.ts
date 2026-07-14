import { createClient } from "@supabase/supabase-js";
import { CHAT_DAILY_LIMIT, monthlyBudgetUsd } from "@/lib/ai/budget";

export { CHAT_DAILY_LIMIT };
export const CHAT_MONTHLY_BUDGET_USD = monthlyBudgetUsd();

const HAIKU_IN_PER_TOKEN = 1 / 1_000_000;
const HAIKU_OUT_PER_TOKEN = 5 / 1_000_000;

export function getChatDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function checkChatLimits(userId: string): Promise<
  | { ok: true; db: ReturnType<typeof getChatDb> }
  | { ok: false; status: number; error: string }
> {
  const db = getChatDb();
  const budget = monthlyBudgetUsd();

  const { data: usage } = await db
    .from("chat_usage")
    .select("msg_count")
    .eq("user_id", userId)
    .eq("day", new Date().toISOString().slice(0, 10))
    .single();

  if ((usage?.msg_count ?? 0) >= CHAT_DAILY_LIMIT) {
    return {
      ok: false,
      status: 429,
      error: `Du har nått dagens gräns (${CHAT_DAILY_LIMIT} frågor). Försök igen imorgon.`,
    };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthUsage } = await db
    .from("chat_usage")
    .select("tokens_in, tokens_out")
    .gte("day", monthStart.toISOString().slice(0, 10));

  const totalCost = (monthUsage ?? []).reduce(
    (sum, row) => sum + row.tokens_in * HAIKU_IN_PER_TOKEN + row.tokens_out * HAIKU_OUT_PER_TOKEN,
    0,
  );

  if (totalCost >= budget) {
    console.error(`[chat] månadsbudget överskriden: $${totalCost.toFixed(2)} (cap $${budget})`);
    return {
      ok: false,
      status: 503,
      error: "Tjänsten är tillfälligt otillgänglig. Försök igen om en stund.",
    };
  }

  return { ok: true, db };
}

export async function bumpChatUsage(
  db: ReturnType<typeof getChatDb>,
  userId: string,
  tokensIn: number,
  tokensOut: number,
) {
  await db.rpc("bump_chat_usage", {
    p_user_id: userId,
    p_tokens_in: tokensIn,
    p_tokens_out: tokensOut,
  });
}
