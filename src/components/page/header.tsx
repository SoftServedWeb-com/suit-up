"use client";

import { sswLogo } from "@/lib/logo";
import { UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="bg-card/50 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 flex items-center justify-center">
                {sswLogo}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Color-Swaap</h1>
                <p className="text-xs text-muted-foreground">Immersive Fashion</p>
              </div>
            </div>
          </div>
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-10 w-10",
                userButtonPopoverCard: "glass-card",
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}