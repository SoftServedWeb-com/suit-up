"use client";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const pathname = usePathname();

  return (
    <header className="bg-card/50 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 flex items-center justify-center">
                <Image
                  src="/ssw_logo.svg"
                  height={40}
                  width={40}
                  alt="SSW Logo"
                  className="h-8 w-8"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-serif font-medium text-foreground">
                  Fashion Try-On
                </h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center gap-1 px-2",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only text-xs">
                      {item.name}
                    </span>
                  </Button>
                </Link>
              );
            })}
          </nav>

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

      {/* Mobile Navigation Fallback */}
      <div className="md:hidden border-t border-border/50 bg-card/30">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex justify-center space-x-8 py-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}