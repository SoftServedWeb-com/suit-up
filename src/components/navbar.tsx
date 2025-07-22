import { SignInButton } from "@clerk/nextjs";
import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { TrialRoomLogowithText } from "@/lib/logo";

export default function Navbar({ userId }: { userId: boolean }) {
  return (
    <nav className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-5xl">
      {/* Minimal floating container */}
      <div className="bg-white/95 backdrop-blur-sm border border-gray-100 rounded-full px-8 py-4 transition-all duration-500 hover:shadow-md">
        <div className="flex h-fit items-center justify-between">
          {/* Minimal logo */}
          <div className="w-24 h-24 items-center object-contain flex ">
            {TrialRoomLogowithText}
          </div>


          {/* Minimal CTA */}
          {userId ? (
            <Link href="/dashboard">
              <button className="bg-black text-white px-6 py-2 rounded-full text-sm font-light tracking-wide transition-all duration-300 hover:bg-gray-900">
                Dashboard
              </button>
            </Link>
          ) : (
            <SignInButton mode="modal">
              <Button className="bg-black hover:bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-light tracking-wide transition-colors duration-300">
                Sign In
              </Button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}