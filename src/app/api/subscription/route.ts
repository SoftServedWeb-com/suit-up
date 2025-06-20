// api/subscription/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateSubscription } from "@/lib/subscription";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getOrCreateSubscription(userId);
    console.log("Subscription API response:", subscription);
    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        tryOnRemaining: subscription.tryOnRemaining,
        tryOnPurchased: subscription.tryOnPurchased,
        maxTryOnsPerMonth: subscription.maxTryOnsPerMonth,
        hasUnlimitedTryOns: subscription.hasUnlimitedTryOns,
        currentPeriodStart: subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        dodoCustomerId: subscription.dodoCustomerId,
        dodoSubscriptionId: subscription.dodoSubscriptionId
      }
    });

  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json({ 
      error: "Failed to get subscription" 
    }, { status: 500 });
  }
}