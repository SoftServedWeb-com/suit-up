//api/billing/webhook/route.ts
import { Webhook } from "standardwebhooks";
import { headers } from "next/headers";
import { dodopayments } from "@/lib/dodo-payments";
import { db } from "@/db";
import { Plan } from "@/generated/prisma";

// Webhook handler for fashion try-on subscription events
const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY!);

// Plan configuration for fashion try-on product
const FASHION_TRYON_PLAN_CONFIG = {
  FREE: {
    dodoProductId: "free", // Free plan doesn't have a product ID
    tryOnLimit: 20,
    price: 0
  },
  PRO: {
    dodoProductId: process.env.DODO_PRO_PRODUCT_ID!, // Your Pro plan product ID from Dodo Payments
    tryOnLimit: 300,
    price: 2000 // ₹2000
  }
};

async function logWebhookError(message: string, event: string, data: any) {
  console.error(`Webhook Error [${event}]: ${message}`, data);
  // You can implement proper error logging here (e.g., to a logging service)
}

export async function POST(request: Request) {
  console.log("Fashion Try-On Webhook received");
  const headersList = await headers();

  try {
    const rawBody = await request.text();
    const webhookHeaders = {
      "webhook-id": headersList.get("webhook-id") || "",
      "webhook-signature": headersList.get("webhook-signature") || "",
      "webhook-timestamp": headersList.get("webhook-timestamp") || "",
    };

    // Verify webhook signature
    try {
      await webhook.verify(rawBody, webhookHeaders);
    } catch (error) {
      await logWebhookError(
        "Webhook signature verification failed",
        "verification",
        { headers: webhookHeaders }
      );
      return Response.json(
        { message: "Webhook verification failed" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    console.log("Webhook payload:", payload);

    // Handle Subscription Events
    if (payload.data.payload_type === "Subscription") {
      const subscriptionData = await dodopayments.subscriptions.retrieve(
        payload.data.subscription_id
      );
      
      const userId = subscriptionData.metadata.user_id;
      if (!userId) {
        await logWebhookError(
          "Missing userId in subscription metadata",
          payload.type,
          subscriptionData
        );
        return Response.json(
          { message: "Webhook processed with errors: Missing userId" },
          { status: 400 }
        );
      }

      console.log("Processing subscription event for user:", userId);
      console.log("Subscription data:", subscriptionData);

      switch (payload.type) {
        case "subscription.active":
          await handleSubscriptionActive(subscriptionData, userId);
          break;

        case "subscription.failed":
          await handleSubscriptionFailed(payload.data.subscription_id);
          break;

        case "subscription.cancelled":
          await handleSubscriptionCancelled(payload.data.subscription_id);
          break;

        case "subscription.renewed":
          await handleSubscriptionRenewed(payload.data.subscription_id);
          break;

        case "subscription.on_hold":
          await handleSubscriptionOnHold(payload.data.subscription_id);
          break;

        default:
          console.log("Unhandled subscription event:", payload.type);
      }
    }

    // Handle Payment Events (for one-time purchases or failed payments)
    else if (payload.data.payload_type === "Payment") {
      const paymentData = await dodopayments.payments.retrieve(
        payload.data.payment_id
      );
      
      const userId = paymentData.metadata.user_id;
      if (!userId) {
        await logWebhookError(
          "Missing userId in payment metadata",
          payload.type,
          paymentData
        );
        return Response.json(
          { message: "Webhook processed with errors: Missing userId" },
          { status: 400 }
        );
      }

      console.log("Processing payment event for user:", userId);

      switch (payload.type) {
        case "payment.succeeded":
          await handlePaymentSucceeded(paymentData, userId);
          break;

        case "payment.failed":
          await handlePaymentFailed(paymentData, userId);
          break;

        default:
          console.log("Unhandled payment event:", payload.type);
      }
    }

    return Response.json(
      { message: "Webhook processed successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Webhook processing error:", error);
    await logWebhookError("Unhandled webhook error", "general", {
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      { message: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActive(subscriptionData: any, userId: string) {
  try {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30); // 30 days from now

    // Determine the plan based on product ID
    let plan: Plan = "FREE";
    let tryOnLimit = FASHION_TRYON_PLAN_CONFIG.FREE.tryOnLimit;

    if (subscriptionData.product_id === FASHION_TRYON_PLAN_CONFIG.PRO.dodoProductId) {
      plan = "PRO";
      tryOnLimit = FASHION_TRYON_PLAN_CONFIG.PRO.tryOnLimit;
    }

    console.log(`Activating ${plan} subscription for user ${userId}`);

    // Create or update subscription
    await db.subscription.upsert({
      where: { userId: userId },
      update: {
        plan: plan,
        status: "ACTIVE",
        dodoSubscriptionId: subscriptionData.subscription_id,
        dodoCustomerId: subscriptionData.customer.customer_id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        tryOnRemaining: tryOnLimit,
        tryOnPurchased: tryOnLimit,
        maxTryOnsPerMonth: tryOnLimit,
        hasUnlimitedTryOns: false,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        plan: plan,
        status: "ACTIVE",
        dodoSubscriptionId: subscriptionData.subscription_id,
        dodoCustomerId: subscriptionData.customer.customer_id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        tryOnRemaining: tryOnLimit,
        tryOnPurchased: tryOnLimit,
        maxTryOnsPerMonth: tryOnLimit,
        hasUnlimitedTryOns: false,
        updatedAt: new Date()
      },
    });

    console.log(`${plan} subscription activated for user ${userId}`);
  } catch (error) {
    await logWebhookError(
      "Failed to activate subscription",
      "subscription.active",
      { userId, error: error instanceof Error ? error.message : String(error) }
    );
    throw error;
  }
}

async function handleSubscriptionFailed(subscriptionId: string) {
  try {
    const subscription = await db.subscription.findFirst({
      where: { dodoSubscriptionId: subscriptionId },
      select: { id: true, userId: true }
    });

    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { 
          status: "PAST_DUE",
          updatedAt: new Date()
        },
      });

      console.log(`Subscription marked as PAST_DUE for user ${subscription.userId}`);

      await logWebhookError(
        "Subscription payment failed",
        "subscription.failed",
        {
          subscriptionId,
          userId: subscription.userId,
        }
      );
    } else {
      await logWebhookError(
        "Subscription not found in database",
        "subscription.failed",
        { subscriptionId }
      );
    }
  } catch (error) {
    await logWebhookError(
      "Failed to handle subscription failure",
      "subscription.failed",
      { subscriptionId, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function handleSubscriptionCancelled(subscriptionId: string) {
  try {
    const subscription = await db.subscription.findFirst({
      where: { dodoSubscriptionId: subscriptionId },
      select: { id: true, userId: true }
    });

    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { 
          status: "CANCELED",
          updatedAt: new Date()
        },
      });

      console.log(`Subscription cancelled for user ${subscription.userId}`);
    }
  } catch (error) {
    await logWebhookError(
      "Failed to handle subscription cancellation",
      "subscription.cancelled",
      { subscriptionId, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function handleSubscriptionRenewed(subscriptionId: string) {
  try {
    await dodopayments.subscriptions.retrieve(subscriptionId);
    const subscription = await db.subscription.findFirst({
      where: { dodoSubscriptionId: subscriptionId },
      select: { id: true, userId: true, plan: true }
    });

    if (subscription) {
      // Calculate new period end date
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      // Get the try-on limit for the current plan
      const tryOnLimit = subscription.plan === "PRO" 
        ? FASHION_TRYON_PLAN_CONFIG.PRO.tryOnLimit 
        : FASHION_TRYON_PLAN_CONFIG.FREE.tryOnLimit;

      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          // Reset try-on counters on renewal
          tryOnRemaining: tryOnLimit,
          tryOnPurchased: tryOnLimit,
          updatedAt: new Date()
        },
      });

      console.log(`Subscription renewed for user ${subscription.userId}`);
    }
  } catch (error) {
    await logWebhookError(
      "Failed to handle subscription renewal",
      "subscription.renewed",
      { subscriptionId, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function handleSubscriptionOnHold(subscriptionId: string) {
  try {
    const subscription = await db.subscription.findFirst({
      where: { dodoSubscriptionId: subscriptionId },
      select: { id: true, userId: true }
    });

    if (subscription) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { 
          status: "UNPAID",
          updatedAt: new Date()
        },
      });

      console.log(`Subscription put on hold for user ${subscription.userId}`);
    }
  } catch (error) {
    await logWebhookError(
      "Failed to handle subscription on hold",
      "subscription.on_hold",
      { subscriptionId, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function handlePaymentSucceeded(paymentData: any, userId: string) {
  try {
    console.log("Processing successful payment for user:", userId);
    console.log("Payment data:", paymentData);

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      await logWebhookError(
        "User not found for payment",
        "payment.succeeded",
        { paymentId: paymentData.payment_id, userId }
      );
      return;
    }

    // Handle different payment types based on metadata
    const paymentType = paymentData.metadata?.payment_type || "subscription";

    switch (paymentType) {
      case "subscription":
        // This is handled by subscription.active event
        console.log("Subscription payment processed via subscription.active event");
        break;

      case "try_on_credits":
        // Handle additional try-on credits purchase
        const additionalCredits = parseInt(paymentData.metadata?.credits || "0");
        if (additionalCredits > 0 && user.subscription) {
          await db.subscription.update({
            where: { userId },
            data: {
              tryOnRemaining: (user.subscription.tryOnRemaining || 0) + additionalCredits,
              tryOnPurchased: (user.subscription.tryOnPurchased || 0) + additionalCredits,
              updatedAt: new Date()
            }
          });
          console.log(`Added ${additionalCredits} try-on credits for user ${userId}`);
        }
        break;

      default:
        console.log("Unhandled payment type:", paymentType);
    }

    console.log(`Payment processed successfully for user ${userId}`);
  } catch (error) {
    await logWebhookError(
      "Failed to handle successful payment",
      "payment.succeeded",
      { paymentId: paymentData.payment_id, userId, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

async function handlePaymentFailed(paymentData: any, userId: string) {
  try {
    console.log("Processing failed payment for user:", userId);

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      await logWebhookError(
        "User not found for failed payment",
        "payment.failed",
        { paymentId: paymentData.payment_id, userId }
      );
      return;
    }

    // If this was a subscription payment and user has a subscription, mark it as past due
    if (paymentData.metadata?.payment_type === "subscription" && user.subscription) {
      await db.subscription.update({
        where: { userId },
        data: { 
          status: "PAST_DUE",
          updatedAt: new Date()
        },
      });
    }
    
    await logWebhookError(
      "Payment failed for user",
      "payment.failed",
      {
        paymentId: paymentData.payment_id,
        userId,
        amount: paymentData.total_amount,
        paymentType: paymentData.metadata?.payment_type
      }
    );

    console.log(`Failed payment processed for user ${userId}`);
  } catch (error) {
    await logWebhookError(
      "Failed to handle payment failure",
      "payment.failed",
      { paymentId: paymentData.payment_id, userId, error: error instanceof Error ? error.message : String(error) }
    );
  }
}