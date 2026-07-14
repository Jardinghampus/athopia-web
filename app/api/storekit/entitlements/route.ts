import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchAuthoritativeTransaction } from "@/lib/app-store";
import { enforceRateLimit } from "@/lib/ratelimit";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { syncStoreKitTransaction } from "@/lib/storekit-entitlements";
import { parseBody, z } from "@/lib/validation";

const TransactionSchema = z.object({
  transactionId: z.string().regex(/^[0-9]{5,40}$/),
});

async function getOrCreateAccountToken(userId: string): Promise<string> {
  const supabase = createServerClient();
  const { data: existing } = await supabase
    .from("app_store_accounts")
    .select("app_account_token")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (existing) return existing.app_account_token;

  const { data, error } = await supabase
    .from("app_store_accounts")
    .insert({ clerk_user_id: userId })
    .select("app_account_token")
    .single();
  if (!error && data) return data.app_account_token;

  const { data: raced, error: racedError } = await supabase
    .from("app_store_accounts")
    .select("app_account_token")
    .eq("clerk_user_id", userId)
    .single();
  if (racedError || !raced) throw racedError ?? new Error("Account token missing");
  return raced.app_account_token;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "DB ej konfigurerad" }, { status: 503 });
  }

  try {
    const appAccountToken = await getOrCreateAccountToken(userId);
    return NextResponse.json({ appAccountToken });
  } catch (error) {
    console.error("[storekit GET]", error);
    return NextResponse.json({ error: "Kunde inte förbereda köp" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "DB ej konfigurerad" }, { status: 503 });
  }

  const blocked = await enforceRateLimit("write", req, userId);
  if (blocked) return blocked;

  const parsed = await parseBody(req, TransactionSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const [transaction, accountToken] = await Promise.all([
      fetchAuthoritativeTransaction(parsed.data.transactionId),
      getOrCreateAccountToken(userId),
    ]);
    if (transaction.appAccountToken?.toLowerCase() !== accountToken.toLowerCase()) {
      return NextResponse.json(
        { error: "Köpet tillhör inte detta konto", code: "account_mismatch" },
        { status: 403 },
      );
    }

    const synced = await syncStoreKitTransaction(transaction);
    if (synced.userId !== userId) throw new Error("Synced entitlement user mismatch");

    return NextResponse.json({
      ok: true,
      plan: synced.effectivePlan,
      storekitPlan: synced.storekitPlan,
      expiresAt: synced.expiresAt,
    });
  } catch (error) {
    console.error("[storekit POST]", error);
    return NextResponse.json(
      { error: "Kunde inte verifiera App Store-köpet", code: "verification_failed" },
      { status: 502 },
    );
  }
}
