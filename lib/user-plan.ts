import { currentUser } from "@clerk/nextjs/server";
import type { Plan } from "./access-rules";
import { planForVertical } from "./plan-for-vertical";
import { VERTICAL } from "./vertical";

export async function getUserPlan(): Promise<Plan> {
  const user = await currentUser();
  if (!user) return "free";
  return planForVertical(VERTICAL, user.publicMetadata);
}
