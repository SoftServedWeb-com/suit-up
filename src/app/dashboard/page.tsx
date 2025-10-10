"use client";

import { FeatureCard } from "@/components/page/featured-card";
import { motion } from "motion/react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
  

      {/* Main Content */}
      <main className="max-w-5xl bg-white border border-y-0 border-x mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <FeatureCard
            title="Trial room"
            href="/dashboard/trialroom"
            imageSrc="https://res.cloudinary.com/duwh0ork4/image/upload/v1760119127/trialroom-wallpaper_ldjq5e.png"
            description="Experience virtual try-ons with AI-powered precision. See how garments fit before you commit."
          />

          <FeatureCard
            title="Studio"
            href="/dashboard/studio"
            imageSrc="https://res.cloudinary.com/duwh0ork4/image/upload/v1760119127/studio-wallpaper_mdvsfn.png"
            description="Create and annotate with professional tools. Transform your ideas into reality with AI assistance."
          />
        </div>

        {/* Bottom Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center">
          <p className="text-sm text-primary">
            Crafted for bespoke artists
          </p>
        </motion.div>
      </main>
    </div>
  );
}
