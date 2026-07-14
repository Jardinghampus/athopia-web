import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCESS,
  canAccess,
  requiredPlanFor,
  type AccessFeature,
  type Plan,
} from "./access-rules";

const plans: Plan[] = ["free", "pro", "elite"];
const rank: Record<Plan, number> = { free: 0, pro: 1, elite: 2 };

test("every access requirement follows the plan hierarchy", () => {
  for (const [feature, requiredPlan] of Object.entries(ACCESS) as [
    AccessFeature,
    Plan,
  ][]) {
    assert.equal(requiredPlanFor(feature), requiredPlan);
    for (const plan of plans) {
      assert.equal(
        canAccess(feature, plan),
        rank[plan] >= rank[requiredPlan],
        `${feature} should require ${requiredPlan} for ${plan}`,
      );
    }
  }
});

test("core cross-platform product decisions remain explicit", () => {
  assert.equal(requiredPlanFor("unlimitedFeed"), "free");
  assert.equal(requiredPlanFor("pushAlerts"), "free");
  assert.equal(requiredPlanFor("aiChat"), "pro");
  // Founderbeslut D2 2026-07-14: global AI-chat är PRO, inte Elite.
  assert.equal(requiredPlanFor("globalAiChat"), "pro");
});
