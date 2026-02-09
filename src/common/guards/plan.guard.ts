import { ForbiddenException } from "@nestjs/common";

export function requirePlan(
  plan: string,
  allowed: Array<"PRO" | "ELITE">,
  feature: string
) {
  if (!allowed.includes(plan as any)) {
    throw new ForbiddenException({
      code: "UPGRADE_REQUIRED",
      feature,
      requiredPlans: allowed,
    });
  }
}
