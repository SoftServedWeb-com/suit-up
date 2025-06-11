"use client";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default function Header() {
  return (
    <header className="bg-card/50 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="h-15 w-15 flex items-center justify-center">
                <Image
                  src="/ssw_logo.svg"
                  height={1080}
                  width={1080}
                  alt="SSW Logo"
                />
              </div>
            </div>
          </div>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-10 w-10",
                userButtonPopoverCard: "glass-card",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
