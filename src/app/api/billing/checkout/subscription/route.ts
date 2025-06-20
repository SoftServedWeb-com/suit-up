// api/billing/checkout/subscription/route.ts
import { db } from "@/db";
import { dodopayments } from "@/lib/dodo-payments";
import { auth } from "@clerk/nextjs/server";
import { NextResponse, NextRequest } from "next/server";

// Fashion Try-On Plan Configuration
const FASHION_TRYON_PLANS = {
  FREE:{
    productId: "free",
    name: "Fashion Try-On Free",
    price: 0,
    tryOns: 20,
    billingCycle: "monthly"
  },
  PRO: {
    productId: process.env.DODO_PRO_PRODUCT_ID!,
    name: "Fashion Try-On Pro",
    price: 2000, // ₹2000
    tryOns: 300,
    billingCycle: "monthly"
  }
} as const;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, statusText: "Unauthorized" }
      );
    }

    console.log("Creating subscription checkout for user:", userId);

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get plan from query parameters
    const { searchParams } = new URL(request.url);
    const planParam = searchParams.get("plan") as string;
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/billing`;

    console.log("Requested plan:", planParam);

    const plan = planParam.toUpperCase() as keyof typeof FASHION_TRYON_PLANS;
    const planConfig = FASHION_TRYON_PLANS[plan];

    if (!planConfig.productId) {
      return NextResponse.json(
        { error: "Product ID not configured for this plan" },
        { status: 500 }
      );
    }

    // Check if user already has an active subscription
    if (user.subscription && user.subscription.status === "ACTIVE" && user.subscription.plan === "PRO") {
      return NextResponse.json(
        { 
          error: "You already have an active Pro subscription",
          redirect: `${process.env.NEXT_PUBLIC_BASE_URL}/billing`
        },
        { status: 409 }
      );
    }

    // Prepare user billing information
    const userName = user.name || user.email?.split('@')[0] || "Fashion Try-On User";
    const userEmail = user.email || "";

    // Default billing info for India (can be customized based on user's location)
    const defaultBilling = {
      city: "",
      country: "IN" as const, // Default to India
      state: "",
      street: "",
      zipcode: "",
    };

    console.log("Creating subscription with product ID:", planConfig.productId);

    // Create subscription checkout with Dodo Payments
    const subscriptionResponse = await dodopayments.subscriptions.create({
      billing: defaultBilling,
      customer: {
        email: userEmail,
        name: userName,
      },
      payment_link: true,
      product_id: planConfig.productId,
      quantity: 1,
      return_url: returnUrl,
      metadata: {
        user_id: userId,
        payment_type: "SUBSCRIPTION_PAYMENT",
        plan: plan,
        app_name: "fashion_tryon",
        try_on_limit: planConfig.tryOns.toString(),
        billing_cycle: planConfig.billingCycle
      }
    });

    console.log("Subscription checkout created successfully:", {
      subscriptionId: subscriptionResponse.subscription_id,
      paymentUrl: subscriptionResponse.payment_link
    });

    return NextResponse.json({
      success: true,
      subscription_id: subscriptionResponse.subscription_id,
      payment_link: subscriptionResponse.payment_link,
      plan: plan,
      plan_details: {
        name: planConfig.name,
        price: planConfig.price,
        try_ons: planConfig.tryOns,
        billing_cycle: planConfig.billingCycle
      }
    });

  } catch (error) {
    console.error("Subscription checkout error:", error);
    
    // Check if it's a Dodo Payments API error
    if (error && typeof error === 'object' && 'response' in error) {
      const dodoError = error as any;
      console.error("Dodo Payments error details:", dodoError.response?.data || dodoError.message);
      
      return NextResponse.json(
        { 
          error: "Payment service error",
          details: dodoError.response?.data?.message || "Failed to create subscription checkout"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create subscription checkout" },
      { status: 500, statusText: "Internal Server Error" }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const subscriptionId = body.subscriptionId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, statusText: "Unauthorized" }
      );
    }

    const subscription = await dodopayments.subscriptions.update(subscriptionId,{status: "cancelled"});
    if(subscription.status === "cancelled") {
      await db.subscription.update({
        where: { userId },
        data: {
          plan: "FREE",
          status: "ACTIVE",
          dodoSubscriptionId: null,
          dodoCustomerId: `free_${userId}`,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          tryOnPurchased: FASHION_TRYON_PLANS.FREE.tryOns,
          maxTryOnsPerMonth: FASHION_TRYON_PLANS.FREE.tryOns,
          hasUnlimitedTryOns: false,
        },
        include: { user: true }
      });    
    }


    return NextResponse.json(
      {
        success: true,
        message: "Subscription cancelled successfully"
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("Subscription cancellation error:", error);
    
    // Check if it's a Dodo Payments API error
    if (error && typeof error === 'object' && 'response' in error) {
      const dodoError = error as any;
      console.error("Dodo Payments error details:", dodoError.response?.data || dodoError.message);
      
      return NextResponse.json(
        { 
          error: "Payment service error",
          details: dodoError.response?.data?.message || "Failed to create subscription checkout"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500, statusText: "Internal Server Error" }
    );
  }
}