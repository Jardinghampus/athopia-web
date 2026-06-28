import { currentUser } from "@clerk/nextjs/server";
import type { Plan } from "./access";

export async function getUserPlan(): Promise<Plan> {
  const user = await currentUser();
  if (!user) return "free";
  return (user.publicMetadata?.plan as Plan) ?? "free";
}
