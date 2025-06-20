// lib/subscription.ts
import { db } from "@/db";
import { Plan, SubStatus } from "@/generated/prisma";

export interface SubscriptionLimits {
  maxTryOnsPerMonth: number;
  hasUnlimitedTryOns: boolean;
  features: string[];
  dodoProductId?: string;
  price: number; // Price in paise (for INR) or cents (for USD)
}

export const PLAN_LIMITS: Record<Plan, SubscriptionLimits> = {
  FREE: {
    maxTryOnsPerMonth: 20,
    hasUnlimitedTryOns: false,
    features: ["20 try-ons", "Standard processing", "Basic quality", "Community support"],
    price: 0
  },
  BASIC: {
    maxTryOnsPerMonth: 100,
    hasUnlimitedTryOns: false,
    features: ["100 try-ons per month", "Priority processing", "High-quality results", "Email support", "Commercial usage"],
    dodoProductId: process.env.DODO_PRO_PRODUCT_ID as string,
    price: 100000 // ₹2000 in paise
  },
  PRO: {
    maxTryOnsPerMonth: 300,
    hasUnlimitedTryOns: false,
    features: ["300 try-ons per month", "Priority processing", "High-quality results", "Email support", "Commercial usage"],
    dodoProductId: process.env.DODO_PRO_PRODUCT_ID as string,
    price: 200000 // ₹2000 in paise
  },
  PREMIUM: {
    maxTryOnsPerMonth: 500,
    hasUnlimitedTryOns: false,
    features: ["500 try-ons per month", "Priority processing", "High-quality results", "Email support", "Commercial usage"],
    dodoProductId: process.env.DODO_PRO_PRODUCT_ID as string,
    price: 300000 // ₹2000 in paise
  },

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
      reason: subscription.plan === "FREE" 
        ? "Please upgrade to Pro plan to continue using try-ons."
        : "Subscription is not active. Please update your payment method."
    };
  }

  // Check if plan has unlimited try-ons (none of our current plans do, but keeping for future)
  if (subscription.hasUnlimitedTryOns) {
    return { canCreate: true };
  }

  // Check remaining credits
  if (!subscription.tryOnRemaining || subscription.tryOnRemaining <= 0) {
    return {
      canCreate: false,
      reason: subscription.plan === "FREE"
        ? `You've used all your free try-ons for this month. Upgrade to Pro for 300 try-ons per month!`
        : "No try-on credits remaining. Your credits will reset on your next billing cycle.",
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
        error: subscription.plan === "FREE"
          ? "No free try-ons remaining. Please upgrade to Pro."
          : "No try-on credits remaining"
      };
    }

    const updatedSubscription = await db.subscription.update({
      where: { userId },
      data: {
        tryOnRemaining: subscription.tryOnRemaining - 1,
        updatedAt: new Date()
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
      currentPeriodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      updatedAt: new Date()
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

// Helper function to create checkout sessions for upgrades
export async function createUpgradeCheckoutUrl(userId: string, plan: Plan): Promise<string> {
  const planConfig = PLAN_LIMITS[plan];
  
  if (!planConfig.dodoProductId) {
    throw new Error(`Product ID not configured for plan: ${plan}`);
  }

  // You'll need to implement this based on Dodo Payments checkout API
  // This is a placeholder that you should replace with actual Dodo Payments integration
  const checkoutData = {
    product_id: planConfig.dodoProductId,
    customer_metadata: {
      user_id: userId,
      plan: plan
    },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?cancelled=true`
  };

  // Replace this with actual Dodo Payments checkout creation
  // const checkout = await dodopayments.checkout.create(checkoutData);
  // return checkout.url;
  
  return "#"; // Placeholder
}