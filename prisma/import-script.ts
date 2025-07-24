// // scripts/importUsers.ts

import { db } from "@/db";
import fs from "fs";

const importUsers = async () => {
  const rawData = fs.readFileSync("prisma/users.json", "utf-8");
  const users = JSON.parse(rawData);

  for (const user of users) {
    try {
      const existing = await db.user.findUnique({ where: { id: user.id } });

      if (!existing) {
        await db.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
        console.log(`✅ Inserted user ${user.email}`);
      } else {
        console.log(`⏭️ Skipped existing user ${user.email}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert user ${user.email}:`, error);
    }
  }

  await db.$disconnect();
};



const importSubscriptions = async () => {
  const rawData = fs.readFileSync("prisma/Subscription.json", "utf-8");
  const subscriptions = JSON.parse(rawData);

  for (const sub of subscriptions) {
    try {
      // Ensure user exists
      const user = await db.user.findUnique({ where: { id: sub.userId } });
      if (!user) {
        console.warn(`⚠️ Skipping subscription for unknown userId: ${sub.userId}`);
        continue;
      }

      const existing = await db.subscription.findUnique({ where: { userId: sub.userId } });

      if (!existing) {
        await db.subscription.create({
          data: {
            id: sub.id,
            userId: sub.userId,
            plan: sub.plan,
            status: sub.status,
            dodoCustomerId: sub.dodoCustomerId,
            dodoSubscriptionId: sub.dodoSubscriptionId || null,
            currentPeriodStart: new Date(sub.currentPeriodStart),
            currentPeriodEnd: new Date(sub.currentPeriodEnd),
            tryOnRemaining: sub.tryOnRemaining ?? 10,
            tryOnPurchased: sub.tryOnPurchased ?? 10,
            maxTryOnsPerMonth: sub.maxTryOnsPerMonth ?? 10,
            hasUnlimitedTryOns: sub.hasUnlimitedTryOns ?? false,
            createdAt: new Date(sub.createdAt),
            updatedAt: new Date(sub.updatedAt),
          },
        });
        console.log(`✅ Inserted subscription for userId: ${sub.userId}`);
      } else {
        console.log(`⏭️ Skipped existing subscription for userId: ${sub.userId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert subscription for userId: ${sub.userId}`, error);
    }
  }

  await db.$disconnect();
};




const importTryOnRequests = async () => {
  const rawData = fs.readFileSync("prisma/try_on_requests.json", "utf-8");
  const requests = JSON.parse(rawData);

  for (const req of requests) {
    try {
      // Ensure user exists
      const user = await db.user.findUnique({ where: { id: req.userId } });
      if (!user) {
        console.warn(`⚠️ Skipping TryOnRequest with unknown userId: ${req.userId}`);
        continue;
      }

      const existing = await db.tryOnRequest.findUnique({
        where: { predictionId: req.predictionId },
      });

      if (!existing) {
        await db.tryOnRequest.create({
          data: {
            id: req.id,
            predictionId: req.predictionId,
            userId: req.userId,
            modelImageUrl: req.modelImageUrl,
            garmentImageUrl: req.garmentImageUrl,
            category: req.category,
            status: req.status,
            resultImageUrl: req.resultImageUrl ?? null,
            errorMessage: req.errorMessage ?? null,
            processingTime: req.processingTime ?? null,
            creditsUsed: req.creditsUsed ?? 1,
            createdAt: new Date(req.createdAt),
            updatedAt: new Date(req.updatedAt),
          },
        });
        console.log(`✅ Inserted TryOnRequest ${req.predictionId}`);
      } else {
        console.log(`⏭️ Skipped existing TryOnRequest ${req.predictionId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to insert TryOnRequest ${req.predictionId}:`, error);
    }
  }

  await db.$disconnect();
};

// importTryOnRequests();
// importSubscriptions();
// importUsers();