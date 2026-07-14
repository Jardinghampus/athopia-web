export const APP_STORE_PRODUCTS = {
  proMonthly: {
    id: "se.athopia.app.pro.monthly",
    plan: "pro",
    interval: "month",
  },
  proYearly: {
    id: "se.athopia.app.pro.yearly",
    plan: "pro",
    interval: "year",
  },
  eliteMonthly: {
    id: "se.athopia.app.elite.monthly",
    plan: "elite",
    interval: "month",
  },
  eliteYearly: {
    id: "se.athopia.app.elite.yearly",
    plan: "elite",
    interval: "year",
  },
} as const;

const STOREKIT_REVOKE_NOTIFICATIONS = new Set([
  "EXPIRED",
  "GRACE_PERIOD_EXPIRED",
  "REFUND",
  "REVOKE",
  "DID_REVOKE",
]);

export function isStoreKitRevocationNotification(type: string | undefined): boolean {
  return type ? STOREKIT_REVOKE_NOTIFICATIONS.has(type) : false;
}
