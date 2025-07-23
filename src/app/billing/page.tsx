"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Calendar,
  Zap,
  Crown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Gift,
  RefreshCw,
  FileText,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from "@/components/page/header";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SubscriptionData {
  id: string;
  plan: "FREE" | "PRO" | "PREMIUM";
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  tryOnRemaining: number;
  tryOnPurchased: number;
  maxTryOnsPerMonth: number;
  hasUnlimitedTryOns: boolean;
  dodoCustomerId: string;
  dodoSubscriptionId?: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// Updated interface to match the actual API response
interface PaymentHistoryItem {
  payment_id: string;
  status: "succeeded" | "pending" | "failed" | "requires_action";
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_method_type?: string;
  customer: {
    customer_id: string;
    name: string;
    email: string;
  };
  created_at: string;
  subscription_id?: string;
  brand_id: string;
  digital_products_delivered: boolean;
  metadata: {
    app_name: string;
    billing_cycle: string;
    payment_type: string;
    plan: string;
    user_id: string;
    try_on_limit: string;
  };
}

interface PaymentHistoryResponse {
  items: PaymentHistoryItem[];
}

export default function BillingPage() {
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);

      // Load subscription data
      const subResponse = await fetch("/api/subscription");
      if (subResponse.ok) {
        const subData = await subResponse.json();
        console.log("Subscription data loaded:", subData);
        setSubscriptionData(subData.subscription);
        console.log("Subscription data will be set to:", subData.subscription);
      }

      // Load payment history - updated to handle the actual API response
      const historyResponse = await fetch("/api/billing/history");
      if (historyResponse.ok) {
        const historyData: PaymentHistoryResponse =
          await historyResponse.json();
        console.log("Payment history loaded:", historyData);
        setPaymentHistory(historyData.items || []);
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
      toast.error("Failed to load billing information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      const response = await fetch(
        `/api/billing/checkout/subscription?plan=${plan}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.plan === "FREE") {
          window.location.href = "/billing";
        }
        if (data.plan !== "FREE" && data.payment_link) {
          window.location.href = data.payment_link;
        }
      } else {
        throw new Error("Failed to initiate upgrade");
      }
    } catch (error) {
      console.error("Error upgrading plan:", error);
      toast.error("Failed to initiate upgrade");
    }
  };

  const handleCancelPlan = async () => {
    try {
      setIsCanceling(true);

      // Call your cancel subscription API endpoint
      const response = await fetch("/api/billing/checkout/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscriptionData?.dodoSubscriptionId,
        }),
      });

      if (response.status === 200) {
        toast.success("Subscription has been canceled successfully");
        // Reload billing data to reflect the change
        await loadBillingData();
      } else {
        console.log("Failed to cancel subscription", response);
        toast.error("Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel subscription"
      );
    } finally {
      setIsCanceling(false);
    }
  };

  const calculateDaysRemaining = (endDate: string): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const calculateDaysTotal = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "FREE":
        return <Gift className="h-5 w-5 text-blue-500" />;
      case "PRO":
        return <Zap className="h-5 w-5 text-purple-500" />;
      case "PREMIUM":
        return <Crown className="h-5 w-5 text-yellow-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "FREE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "PRO":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "PREMIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "PAST_DUE":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "CANCELED":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "TRIALING":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "requires_action":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "requires_action":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100);
  };

  const formatPaymentDescription = (payment: PaymentHistoryItem) => {
    const planName = payment.metadata.plan;
    const billingCycle = payment.metadata.billing_cycle;
    const tryOnLimit = payment.metadata.try_on_limit;

    return `${planName} Plan - ${billingCycle} subscription (${tryOnLimit} try-ons)`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto animate-spin mb-4" />
            <p className="text-muted-foreground">
              Loading billing information...
            </p>
          </div>
        </main>
      </div>
    );
  }

  const daysRemaining = subscriptionData
    ? calculateDaysRemaining(subscriptionData.currentPeriodEnd)
    : 0;
  const daysTotal = subscriptionData
    ? calculateDaysTotal(
        subscriptionData.currentPeriodStart,
        subscriptionData.currentPeriodEnd
      )
    : 1;

  const usagePercentage = subscriptionData?.hasUnlimitedTryOns
    ? 100
    : subscriptionData
    ? ((subscriptionData.tryOnPurchased - subscriptionData.tryOnRemaining) /
        subscriptionData.tryOnPurchased) *
      100
    : 0;

  const periodPercentage = subscriptionData
    ? ((daysTotal - daysRemaining) / daysTotal) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-4xl bg-white mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex flex-col gap-4 md:flex-row items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row  items-start gap-4">
              <Link
                href={"/dashboard"}
                onClick={() => window.history.back()}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="space-y-1">
                <h2 className="text-2xl font-serif font-medium tracking-tight text-foreground">
                  Billing & Usage
                </h2>
                <p className="text-muted-foreground">
                  Manage your subscription and view usage statistics
                </p>
              </div>
            </div>
            <TabsList className="glass-card">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Billing History ({paymentHistory.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Plan Status */}
            {subscriptionData && (
              <Card className="border-border/50 bg-card">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-medium tracking-tight mb-2">
                        Account Overview
                      </CardTitle>
                      <CardDescription className="text-base font-light">
                        Your subscription and usage details
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-center">
                        {getPlanIcon(subscriptionData.plan)}
                      </div>
                      <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
                        {subscriptionData.plan}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Status */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {getStatusIcon(subscriptionData.status)}
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      <div className="text-2xl font-light tracking-tight text-foreground">
                        {subscriptionData.status}
                      </div>
                    </div>

                    {/* Days Remaining */}
                    <div className="space-y-3 ">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Days Remaining
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl font-light tracking-tight text-foreground">
                          {daysRemaining}
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${100 - periodPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Try-ons Remaining */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Try-ons Left
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl font-light tracking-tight text-foreground">
                          {subscriptionData.hasUnlimitedTryOns
                            ? "∞"
                            : `${subscriptionData.tryOnRemaining}`}
                        </div>
                        {!subscriptionData.hasUnlimitedTryOns && (
                          <div className="w-full bg-muted/50 rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${100 - usagePercentage}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Next Billing */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Next Billing
                        </span>
                      </div>
                      <div className="text-sm font-light text-foreground">
                        {subscriptionData.plan === "FREE"
                          ? "No billing required"
                          : new Date(
                              subscriptionData.currentPeriodEnd
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                      </div>
                    </div>
                  </div>

                  {/* Usage Summary */}
                  {!subscriptionData.hasUnlimitedTryOns && (
                    <div className="bg-accent/30 border border-border rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-foreground">
                          Monthly Usage
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {subscriptionData.tryOnPurchased -
                            subscriptionData.tryOnRemaining}{" "}
                          of {subscriptionData.tryOnPurchased} used
                        </span>
                      </div>
                      <div className="w-full bg-accent-foreground/20 rounded-full border  h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${usagePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Alerts */}
                  {!subscriptionData.hasUnlimitedTryOns &&
                    subscriptionData.tryOnRemaining <= 5 &&
                    subscriptionData.tryOnRemaining > 0 && (
                      <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-amber-900 mb-1">
                              Running Low
                            </p>
                            <p className="text-sm text-amber-700 font-light">
                              Only {subscriptionData.tryOnRemaining} try-ons
                              remaining this month. Consider upgrading to Pro
                              for unlimited access.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {!subscriptionData.hasUnlimitedTryOns &&
                    subscriptionData.tryOnRemaining === 0 && (
                      <div className="bg-red-50/50 border border-red-200/50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-red-900 mb-1">
                              Limit Reached
                            </p>
                            <p className="text-sm text-red-700 font-light">
                              You've used all your try-ons for this month.
                              Upgrade to Pro for unlimited access or wait for
                              next month's reset.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Available Plans */}
            <div className="space-y-8">
              {/* Header Section */}
              <div className="text-center">
                <h2 className="text-2xl font-medium text-foreground mb-2">
                  Choose Your Plan
                </h2>
                <p className="text-muted-foreground">
                  Select the perfect plan for your virtual try-on needs
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Free Plan */}
                <Card
                  className={`relative transition-all duration-300 ${
                    subscriptionData?.plan === "FREE"
                      ? "border-primary shadow-lg shadow-primary/10 bg-card"
                      : "border-border/50 hover:border-border hover:shadow-md shadow-sm bg-card"
                  }`}
                >
                  {subscriptionData?.plan === "FREE" && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
                        Current Plan
                      </div>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8 pt-8">
                    <div className="w-16 h-16 bg-background border border-border/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Gift className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-medium tracking-tight">
                      Free
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      Perfect for getting started
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-8 pb-8">
                    {/* Pricing */}
                    <div className="text-center mb-8">
                      <div className="text-5xl font-light text-foreground tracking-tight">
                        ₹0
                      </div>
                      <div className="text-muted-foreground mt-1 font-light">
                        Forever
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground font-light">
                          10 try-ons included
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground font-light">
                          Standard processing
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground font-light">
                          Basic quality results
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground font-light">
                          Community support
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      {subscriptionData?.plan === "FREE" ? (
                        <Button
                          variant="outline"
                          className="w-full h-12 font-medium border-border/50"
                          disabled
                        >
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full h-12 font-medium hover:bg-muted/50"
                        >
                          Downgrade to Free
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card
                  className={`relative transition-all duration-300 ${
                    subscriptionData?.plan === "PRO" &&
                    subscriptionData.status === "ACTIVE"
                      ? "border-primary shadow-xl shadow-primary/15 bg-card ring-1 ring-primary/10"
                      : "border-border/50 hover:border-primary/30 hover:shadow-lg shadow-md bg-card"
                  }`}
                >
                  {subscriptionData?.plan === "PRO" &&
                    subscriptionData.status === "ACTIVE" && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
                          Current Plan
                        </div>
                      </div>
                    )}

                  {/* Popular Badge */}
                  {(!subscriptionData || subscriptionData?.plan !== "PRO") && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-foreground text-background px-4 py-1.5 rounded-full text-sm font-medium shadow-md">
                        Recommended
                      </div>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8 pt-8">
                    <div className="w-16 h-16 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Zap className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-medium tracking-tight">
                      Pro
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      For professionals and regular users
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-8 pb-8">
                    {/* Pricing */}
                    <div className="text-center mb-8">
                      <div className="text-5xl font-light text-foreground tracking-tight">
                        ₹2,000
                      </div>
                      <div className="text-muted-foreground mt-1 font-light">
                        per month
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground font-light">
                          100 try-ons per month
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground font-light">
                          Priority processing
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground font-light">
                          High-quality results
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground font-light">
                          Email support
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                        </div>
                        <span className="text-foreground font-light">
                          Commercial usage
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      {subscriptionData?.plan === "PRO" &&
                      subscriptionData?.status === "ACTIVE" ? (
                        <div className="space-y-3">
                          <Button
                            variant="outline"
                            className="w-full h-12 font-medium border-border/50"
                            disabled
                          >
                            Current Plan
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground hover:text-destructive font-light"
                              >
                                Cancel subscription
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-border/50 shadow-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-medium">
                                  Cancel Pro Subscription?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base font-light">
                                  Your subscription will remain active until the
                                  end of your current billing period. You can
                                  resubscribe at any time.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <div className="bg-muted/30 border border-border/50 rounded-xl p-6 space-y-3">
                                <p className="font-medium">
                                  What happens next:
                                </p>
                                <ul className="text-muted-foreground space-y-2 font-light">
                                  <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0"></div>
                                    Access to Pro features until billing period
                                    ends
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0"></div>
                                    Automatic downgrade to Free plan
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0"></div>
                                    No charges for future billing periods
                                  </li>
                                </ul>
                              </div>

                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-medium">
                                  Keep Plan
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleCancelPlan}
                                  className="bg-destructive hover:bg-destructive/90 font-medium"
                                  disabled={isCanceling}
                                >
                                  {isCanceling ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Canceling...
                                    </>
                                  ) : (
                                    "Cancel Subscription"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : (
                        <Button
                          className="w-full h-12 font-medium shadow-sm"
                          onClick={() => handleUpgrade("PRO")}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Upgrade to Pro
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment History
                  <Badge variant="secondary" className="ml-auto">
                    {paymentHistory.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Your payment and transaction history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-2">No payment history</h3>
                    <p className="text-sm text-muted-foreground">
                      Your payment history will appear here once you make your
                      first payment
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentHistory.map((payment) => (
                      <div
                        key={payment.payment_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getPaymentStatusIcon(payment.status)}
                            <p className="font-medium">
                              {formatPaymentDescription(payment)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {new Date(payment.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {payment.payment_method}
                            </span>
                          </div>
                          {payment.subscription_id && (
                            <div className="text-xs text-muted-foreground">
                              Subscription: {payment.subscription_id.slice(-8)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              {formatCurrency(
                                payment.total_amount,
                                payment.currency
                              )}
                            </p>
                            <Badge
                              className={getPaymentStatusColor(payment.status)}
                            >
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  payment.payment_id
                                );
                                toast.success("Payment ID copied to clipboard");
                              }}
                              title="Copy Payment ID"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            {paymentHistory.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Payment Summary
                  </CardTitle>
                  <CardDescription>
                    Overview of your payment activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Payments
                      </p>
                      <p className="text-2xl font-bold">
                        {paymentHistory.length}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Spent
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          paymentHistory
                            .filter((p) => p.status === "succeeded")
                            .reduce(
                              (total, payment) => total + payment.total_amount,
                              0
                            ),
                          paymentHistory[0]?.currency || "USD"
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Success Rate
                      </p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          (paymentHistory.filter(
                            (p) => p.status === "succeeded"
                          ).length /
                            paymentHistory.length) *
                            100
                        )}
                        %
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
