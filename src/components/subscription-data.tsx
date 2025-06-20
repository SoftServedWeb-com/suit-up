"use client";

import { useState, useEffect } from "react";
import {
  Crown,
  Zap,
  Calendar,
  AlertTriangle,
  Check,
  ChevronUp,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SubscriptionData {
  id: string;
  plan: "FREE" | "BASIC" | "PRO" | "PREMIUM";
  status: string;
  tryOnRemaining: number | null;
  tryOnPurchased: number;
  maxTryOnsPerMonth: number;
  hasUnlimitedTryOns: boolean;
  currentPeriodEnd: string;
}

export default function FloatingSubscriptionIndicator() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const response = await fetch("/api/subscription");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error("Failed to load subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "FREE":
        return <Zap className="h-3 w-3 text-gray-500" />;
      case "BASIC":
        return <Zap className="h-3 w-3 text-blue-500" />;
      case "PRO":
        return <Crown className="h-3 w-3 text-purple-500" />;
      case "PREMIUM":
        return <Crown className="h-3 w-3 text-yellow-500" />;
      default:
        return <Zap className="h-3 w-3 text-gray-500" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "FREE":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "BASIC":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "PRO":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "PREMIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "TRIALING":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "PAST_DUE":
      case "UNPAID":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "CANCELED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
  };

  const calculateUsagePercentage = () => {
    if (!subscription || subscription.hasUnlimitedTryOns) return 0;

    const used =
      subscription.tryOnPurchased - (subscription.tryOnRemaining || 0);
    return (used / subscription.tryOnPurchased) * 100;
  };

  const getRemainingDays = () => {
    if (!subscription) return 0;

    const endDate = new Date(subscription.currentPeriodEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  const getIndicatorColor = () => {
    if (!subscription) return "border-gray-500";

    if (subscription.hasUnlimitedTryOns) return "border-yellow-500";

    const remaining = subscription.tryOnRemaining || 0;
    if (remaining === 0) return "border-red-500";
    if (remaining <= 2) return "border-orange-500";
    return "border-green-500";
  };

  const shouldShowWarning = () => {
    if (!subscription || subscription.hasUnlimitedTryOns) return false;
    return (subscription.tryOnRemaining || 0) <= 2;
  };

  if (isLoading) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div className="glass-card p-3 rounded-xl shadow-lg animate-pulse">
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div className="glass-card p-3 rounded-xl shadow-lg border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 ">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={`glass-card p-3 rounded-xl shadow-md shadow-indigo-300/30 hover:shadow-xl transition-all duration-300 hover:scale-105 group border ${getIndicatorColor()} ${
              shouldShowWarning() ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Plan Info */}
              <div className="flex items-center gap-2">
                {getPlanIcon(subscription.plan)}
                <span className="text-sm font-medium text-foreground">
                  {subscription.plan}
                </span>
              </div>

              {/* Credits Info */}
              {subscription.hasUnlimitedTryOns ? (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  ∞
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {subscription.tryOnRemaining || 0}
                </Badge>
              )}

              {/* Expand Icon */}
              <ChevronUp
                className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-80 glass-card border-border/50 p-3 "
          sideOffset={20}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getPlanIcon(subscription.plan)}
                <h4 className="font-semibold text-indigo-600">Current Plan</h4>
              </div>
              <div className="flex gap-2">
                <Badge className={getPlanColor(subscription.plan)}>
                  {subscription.plan}
                </Badge>
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status.replace("_", " ")}
                </Badge>
              </div>
            </div>

            {/* Usage Stats */}
            {subscription.hasUnlimitedTryOns ? (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
                    Unlimited Try-Ons
                  </span>
                </div>
                <Check className="h-4 w-4 text-yellow-600" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Try-Ons This Month
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {subscription.tryOnPurchased -
                      (subscription.tryOnRemaining || 0)}{" "}
                    / {subscription.tryOnPurchased}
                  </span>
                </div>

                <Progress value={calculateUsagePercentage()} className="h-2" />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{subscription.tryOnRemaining || 0} remaining</span>
                  <span>{getRemainingDays()} days left</span>
                </div>
              </div>
            )}

            {/* Billing Period */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Renews{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>

            {/* Warnings */}
            {(subscription.tryOnRemaining || 0) === 0 &&
              !subscription.hasUnlimitedTryOns && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    No credits remaining. Upgrade or wait for next cycle.
                  </span>
                </div>
              )}

            {(subscription.tryOnRemaining || 0) <= 2 &&
              (subscription.tryOnRemaining || 0) > 0 &&
              !subscription.hasUnlimitedTryOns && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Running low on credits. Consider upgrading.
                  </span>
                </div>
              )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {(subscription.tryOnRemaining || 0) < 5 &&
                !subscription.hasUnlimitedTryOns && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Buy Credits
                  </Button>
                )}

              <Link
                href={"/billing"}
              className={cn("text-xs", buttonVariants
                ({"variant":"outline"})
              )}>
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Link>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
