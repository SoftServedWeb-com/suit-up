"use client";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
];

export default function Header() {

  return (
    <header className="bg-card/50 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className=" flex items-center justify-center">
                <Image
                  src="/ssw_logo.svg"
                  height={40}
                  width={40}
                  alt="SSW Logo"
                  className="h-15 w-15"
                />
              </div>
            </div>
          </div>

          
 

          {/* User Button */}
          <div className="flex items-center space-x-4">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                  userButtonPopoverCard: "glass-card",
                  userButtonPopoverActions: "glass-card",
                },
              }}
            />
          </div>
        </div>
      </div>

    </header>
  );
}