import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { enforceRateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const blocked = await enforceRateLimit("checkout", req, userId);
  if (blocked) return blocked;

  const user = await currentUser();
  const customerId = user?.privateMetadata?.stripeCustomerId as string | undefined;
  if (!customerId) return NextResponse.json({ error: "Ingen Stripe-kund hittad" }, { status: 400 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://athopia.se/profil",
      locale: "sv",
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
