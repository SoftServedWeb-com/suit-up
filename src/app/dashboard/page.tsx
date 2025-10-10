"use client";

import Header from "@/components/page/header";
import FloatingSubscriptionIndicator from "@/components/subscription-data";
import { getTodaysColorTheme } from "@/lib/colors-switch";
import { NoiseOverlay } from "@/lib/noise-overlay";
import Link from "next/link";
import { useState } from "react";

export default function Dashboard() {
  const todaysTheme = getTodaysColorTheme();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
  

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground mb-4">
            Welcome to Your Creative Space
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose your creative tool to get started
          </p>
        </div>

        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Trial Room Card */}
          <Link 
            href="/dashboard/trialroom"
            onMouseEnter={() => setHoveredCard("trialroom")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div 
              className={`
                relative overflow-hidden rounded-lg border-2 
                h-[400px] md:h-[500px]
                transition-all duration-300 cursor-pointer
                bg-muted/30
                ${hoveredCard === "trialroom" 
                  ? "border-primary shadow-2xl scale-[1.02]" 
                  : "border-border shadow-lg hover:border-primary/50"
                }
              `}
            >
              {/* Subtle Overlay */}
              <div className="absolute inset-0 opacity-30">
                <NoiseOverlay theme={todaysTheme} />
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-8 z-10">
                <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
                  Trial room
                </h2>
              </div>
            </div>
          </Link>

          {/* Studio Card */}
          <Link 
            href="/dashboard/studio"
            onMouseEnter={() => setHoveredCard("studio")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div 
              className={`
                relative overflow-hidden rounded-lg border-2 
                h-[400px] md:h-[500px]
                transition-all duration-300 cursor-pointer
                bg-muted/30
                ${hoveredCard === "studio" 
                  ? "border-primary shadow-2xl scale-[1.02]" 
                  : "border-border shadow-lg hover:border-primary/50"
                }
              `}
            >
              {/* Subtle Overlay */}
              <div className="absolute inset-0 opacity-30">
                <NoiseOverlay theme={todaysTheme} />
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-8 z-10">
                <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground">
                  studio
                </h2>
              </div>
            </div>
          </Link>
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Need help getting started? Check out our{" "}
            <Link href="/demo" className="text-primary hover:underline">
              demo
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
