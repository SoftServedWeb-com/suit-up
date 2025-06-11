// lib/subscription.ts
import { db } from "@/db";
import { Plan, SubStatus } from "@/generated/prisma";

export interface SubscriptionLimits {
  maxTryOnsPerMonth: number;
  hasUnlimitedTryOns: boolean;
  features: string[];
}

export const PLAN_LIMITS: Record<Plan, SubscriptionLimits> = {
  FREE: {
    maxTryOnsPerMonth: 20,
    hasUnlimitedTryOns: false,
    features: ["20 try-ons per month", "Basic support"]
  },
  BASIC: {
    maxTryOnsPerMonth: 50,
    hasUnlimitedTryOns: false,
    features: ["50 try-ons per month", "Priority support", "High-quality results"]
  },
  PRO: {
    maxTryOnsPerMonth: 200,
    hasUnlimitedTryOns: false,
    features: ["200 try-ons per month", "Priority support", "Commercial usage", "API access"]
  },
  PREMIUM: {
    maxTryOnsPerMonth: 0, // Unlimited
    hasUnlimitedTryOns: true,
    features: ["Unlimited try-ons", "Priority support", "Commercial usage", "API access", "Custom integrations"]
  }
};

export async function getOrCreateSubscription(userId: string) {
  let subscription = await db.subscription.findUnique({
    where: { userId },
    include: { user: true }
  });

  if (!subscription) {
    // Create default FREE subscription for new users
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    subscription = await db.subscription.create({
      data: {
        userId,
        plan: "FREE",
        status: "ACTIVE",
        dodoCustomerId: `temp_${userId}`, // Temporary until real payment setup
        currentPeriodStart: now,
        currentPeriodEnd: monthEnd,
        tryOnRemaining: PLAN_LIMITS.FREE.maxTryOnsPerMonth,
        tryOnPurchased: PLAN_LIMITS.FREE.maxTryOnsPerMonth,
        maxTryOnsPerMonth: PLAN_LIMITS.FREE.maxTryOnsPerMonth,
        hasUnlimitedTryOns: PLAN_LIMITS.FREE.hasUnlimitedTryOns
      },
      include: { user: true }
    });
  }

  return subscription;
}

export async function checkCanCreateTryOn(userId: string): Promise<{
  canCreate: boolean;
  reason?: string;
  remaining?: number;
}> {
  const subscription = await getOrCreateSubscription(userId);

  // Check if subscription is active
  if (!["ACTIVE", "ACTIVE_CREDIT", "TRIALING"].includes(subscription.status)) {
    return {
      canCreate: false,
      reason: "Subscription is not active. Please update your payment method."
    };
  }

  // Check if plan has unlimited try-ons
  if (subscription.hasUnlimitedTryOns) {
    return { canCreate: true };
  }

  // Check remaining credits
  if (!subscription.tryOnRemaining || subscription.tryOnRemaining <= 0) {
    return {
      canCreate: false,
      reason: "No try-on credits remaining. Please upgrade your plan or wait for next billing cycle.",
      remaining: 0
    };
  }

  return {
    canCreate: true,
    remaining: subscription.tryOnRemaining
  };
}

export async function consumeTryOnCredit(userId: string): Promise<{
  success: boolean;
  remaining?: number;
  error?: string;
}> {
  try {
    const subscription = await getOrCreateSubscription(userId);

    // Don't consume credits for unlimited plans
    if (subscription.hasUnlimitedTryOns) {
      return { success: true };
    }

    if (!subscription.tryOnRemaining || subscription.tryOnRemaining <= 0) {
      return {
        success: false,
        error: "No try-on credits remaining"
      };
    }

    const updatedSubscription = await db.subscription.update({
      where: { userId },
      data: {
        tryOnRemaining: subscription.tryOnRemaining - 1
      }
    });

    return {
      success: true,
      remaining: updatedSubscription.tryOnRemaining!
    };
  } catch (error) {
    console.error("Error consuming try-on credit:", error);
    return {
      success: false,
      error: "Failed to consume credit"
    };
  }
}

export async function resetMonthlyCredits(userId: string) {
  const subscription = await getOrCreateSubscription(userId);
  const planLimits = PLAN_LIMITS[subscription.plan];

  await db.subscription.update({
    where: { userId },
    data: {
      tryOnRemaining: planLimits.maxTryOnsPerMonth,
      tryOnPurchased: planLimits.maxTryOnsPerMonth,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    }
  });
}

export function getPlanDisplayName(plan: Plan): string {
  const names = {
    FREE: "Free",
    BASIC: "Basic",
    PRO: "Pro",
    PREMIUM: "Premium"
  };
  return names[plan];
}

export function getStatusDisplayName(status: SubStatus): string {
  const names = {
    ACTIVE: "Active",
    ACTIVE_CREDIT: "Active (Credits)",
    PAST_DUE: "Past Due",
    UNPAID: "Payment Required",
    CANCELED: "Canceled",
    TRIALING: "Trial"
  };
  return names[status];
}