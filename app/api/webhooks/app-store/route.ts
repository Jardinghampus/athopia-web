import { NextResponse } from "next/server";
import {
  verifyAppStoreNotification,
  verifySignedAppStoreRenewal,
  verifySignedAppStoreTransaction,
} from "@/lib/app-store";
import { isStoreKitRevocationNotification } from "@/lib/product-contract";
import {
  revokeStoreKitEntitlement,
  syncStoreKitTransaction,
} from "@/lib/storekit-entitlements";
import { parseBody, z } from "@/lib/validation";

const NotificationSchema = z.object({
  signedPayload: z.string().min(100),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, NotificationSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const notification = await verifyAppStoreNotification(parsed.data.signedPayload);
    const notificationType = String(notification.notificationType ?? "");

    if (notification.data?.signedTransactionInfo) {
      const transaction = await verifySignedAppStoreTransaction(
        notification.data.signedTransactionInfo,
      );
      await syncStoreKitTransaction(transaction);
      return NextResponse.json({ received: true });
    }

    if (
      notification.data?.signedRenewalInfo &&
      isStoreKitRevocationNotification(notificationType)
    ) {
      const renewal = await verifySignedAppStoreRenewal(
        notification.data.signedRenewalInfo,
      );
      if (renewal.originalTransactionId) {
        await revokeStoreKitEntitlement(String(renewal.originalTransactionId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[app-store-webhook]", error);
    return NextResponse.json(
      { error: "Notification verification failed" },
      { status: 400 },
    );
  }
}
