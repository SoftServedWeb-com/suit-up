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
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
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
        const historyData: PaymentHistoryResponse = await historyResponse.json();
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
      const response = await fetch(`/api/billing/checkout/subscription?plan=${plan}`);
      
      if (response.ok) {
        const data = await response.json();
        if(data.plan === "FREE") {
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
      toast.error(error instanceof Error ? error.message : "Failed to cancel subscription");
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
            <p className="text-muted-foreground">Loading billing information...</p>
          </div>
        </main>
      </div>
    );
  }

  const daysRemaining = subscriptionData ? calculateDaysRemaining(subscriptionData.currentPeriodEnd) : 0;
  const daysTotal = subscriptionData ? calculateDaysTotal(subscriptionData.currentPeriodStart, subscriptionData.currentPeriodEnd) : 1;
  
  const usagePercentage = subscriptionData?.hasUnlimitedTryOns 
    ? 100 
    : subscriptionData 
    ? ((subscriptionData.tryOnPurchased - subscriptionData.tryOnRemaining) / subscriptionData.tryOnPurchased) * 100
    : 0;

  const periodPercentage = subscriptionData 
    ? ((daysTotal - daysRemaining) / daysTotal) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={"/dashboard"}
                onClick={() => window.history.back()}
                className={cn(buttonVariants({"variant":"outline"}))}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="space-y-1">
                <h2 className="text-2xl font-serif font-medium tracking-wide text-foreground">
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
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getPlanIcon(subscriptionData.plan)}
                    Current Plan
                    <Badge className={getPlanColor(subscriptionData.plan)}>
                      {subscriptionData.plan}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Your subscription details and current usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(subscriptionData.status)}
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {subscriptionData.status}
                      </p>
                    </div>

                    {/* Days Remaining */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Days Remaining</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {daysRemaining}
                      </p>
                      <Progress value={100 - periodPercentage} className="h-2" />
                    </div>

                    {/* Try-ons Remaining */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Try-ons Remaining</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {subscriptionData.hasUnlimitedTryOns 
                          ? "∞" 
                          : `${subscriptionData.tryOnRemaining}/${subscriptionData.tryOnPurchased}`
                        }
                      </p>
                      {!subscriptionData.hasUnlimitedTryOns && (
                        <Progress value={100 - usagePercentage} className="h-2" />
                      )}
                    </div>

                    {/* Next Billing */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Next Billing</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {subscriptionData.plan === "FREE" 
                          ? "No billing required" 
                          : new Date(subscriptionData.currentPeriodEnd).toLocaleDateString()
                        }
                      </p>
                    </div>
                  </div>

                  {/* Usage Progress Bar */}
                  {!subscriptionData.hasUnlimitedTryOns && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Try-ons used this month</span>
                        <span>
                          {subscriptionData.tryOnPurchased - subscriptionData.tryOnRemaining} / {subscriptionData.tryOnPurchased}
                        </span>
                      </div>
                      <Progress value={usagePercentage} className="h-3" />
                    </div>
                  )}

                  {/* Low usage warning */}
                  {!subscriptionData.hasUnlimitedTryOns && subscriptionData.tryOnRemaining <= 5 && subscriptionData.tryOnRemaining > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                        You're running low on try-ons! Only {subscriptionData.tryOnRemaining} generations remaining this month.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* No try-ons warning */}
                  {!subscriptionData.hasUnlimitedTryOns && subscriptionData.tryOnRemaining == 0 && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        You've used all your try-ons for this month.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Available Plans */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Available Plans</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Plan */}
                <Card className={`glass-card transition-all duration-300 ${
                  subscriptionData?.plan === "FREE" 
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-lg" 
                    : "border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700"
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-blue-500" />
                        Free Plan
                      </CardTitle>
                      {subscriptionData?.plan === "FREE" && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          Current Plan
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Perfect for getting started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">
                      Free
                      <span className="text-sm font-normal text-muted-foreground">/forever</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        10 try-ons
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Standard processing time
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Basic quality results
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Community support
                      </li>
                    </ul>
                    
                  </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className={`glass-card transition-all duration-300 ${
                  subscriptionData?.plan === "PRO" && subscriptionData.status === "ACTIVE" 
                    ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 ring-2 ring-purple-500/20 shadow-lg" 
                    : "border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700"
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-purple-500" />
                        Pro Plan
                      </CardTitle>
                      {subscriptionData?.plan === "PRO" && subscriptionData.status === "ACTIVE" && (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                          Current Plan
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      Perfect for regular users and professionals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">
                      ₹2,000
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        100 try-ons per month
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Priority processing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        High-quality results
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Email support
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Commercial usage allowed
                      </li>
                    </ul>
                    {(subscriptionData?.plan === "PRO" && subscriptionData?.status === "ACTIVE") ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            className="w-full"
                            disabled={isCanceling}
                          >
                            {isCanceling ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Canceling...
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel Plan
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                              Cancel Pro Subscription
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your Pro subscription? This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
                              <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-3">
                                What happens when you cancel:
                              </p>
                              <ul className="text-sm text-red-600 dark:text-red-400 space-y-2">
                                <li>• You will lose access to Pro features</li>
                                <li>• Your account will be downgraded to the Free plan</li>
                                <li>• You can resubscribe at any time</li>
                              </ul>
                            </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelPlan}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                              disabled={isCanceling}
                            >
                              {isCanceling ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Canceling...
                                </>
                              ) : (
                                "Yes, Cancel Subscription"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700" 
                        onClick={() => handleUpgrade("PRO")}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    )}
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
                      Your payment history will appear here once you make your first payment
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
                            <p className="font-medium">{formatPaymentDescription(payment)}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {new Date(payment.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
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
                              {formatCurrency(payment.total_amount, payment.currency)}
                            </p>
                            <Badge className={getPaymentStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(payment.payment_id);
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
                      <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                      <p className="text-2xl font-bold">
                        {paymentHistory.length}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          paymentHistory
                            .filter(p => p.status === "succeeded")
                            .reduce((total, payment) => total + payment.total_amount, 0),
                          paymentHistory[0]?.currency || "USD"
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          (paymentHistory.filter(p => p.status === "succeeded").length / paymentHistory.length) * 100
                        )}%
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