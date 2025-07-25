import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { PLAN_LIMITS } from "@/lib/subscription";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId, redirectToSignIn } = await auth();

  // Protect the route by checking if the user is signed in
  if (!userId) {
    return redirectToSignIn();
  }
  // TODO For using dashboard change this.
  const user = await currentUser();

  if (user) {
    const dbuser = await db.user.findFirst({
      where: {
        id: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!dbuser) {
      // Create user and subscription in a single transaction
      await db.$transaction(async (tx) => {
        // Create user
        await tx.user.create({
          data: {
            id: user.id,
            name: user.firstName + " " + (user.lastName || ""),
            email: user.emailAddresses[0].emailAddress,
          },
        });

        // Create FREE subscription for new user
        const freePlanLimits = PLAN_LIMITS.FREE;
        const now = new Date();
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month

        await tx.subscription.create({
          data: {
            userId: user.id,
            plan: "FREE",
            status: "ACTIVE",
            dodoCustomerId: `free_${user.id}`, // Temporary for free users
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            tryOnRemaining: freePlanLimits.maxTryOnsPerMonth,
            tryOnPurchased: freePlanLimits.maxTryOnsPerMonth,
            maxTryOnsPerMonth: freePlanLimits.maxTryOnsPerMonth,
            hasUnlimitedTryOns: freePlanLimits.hasUnlimitedTryOns,
          },
        });
      });

      console.log(`New user created: ${user.id} with FREE subscription`);
    }
  }

  return (
    <div>{children}</div>
  );
}
