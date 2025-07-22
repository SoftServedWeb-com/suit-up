import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Sparkles, Camera, Zap, Users } from "lucide-react";
import Link from "next/link";
import { pinkOverlay, TrailRoom } from "@/lib/logo";
import Footer from "../footer";
import { Button } from "../ui/button";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

export default async function Home2() {
  const { userId } = await auth();

  // if (userId) {
  //   return (`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`);
  // }

  return (
    <div className="h-fit overflow-hidden rounded-sm ring ring-ring/70 relative ">
      <div className="bg-background h-[97vh] relative">
        <div className="absolute inset-0 top-0 bottom-0 z-5 w-full h-full">
          {" "}
          <video
            src={"/video.mp4"}
            className="w-full h-full object-cover z-7"
            playsInline
            loop
            autoPlay
            muted
          ></video>
          <div className="absolute inset-0 w-full h-full object-contain z-8 overflow-hidden">
            {pinkOverlay}
          </div>
        </div>

        {/* Centered Logo */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
            <TrailRoom className="text-white" />
          </div>
        </div>

        <div className="relative flex h-full z-[999] items-end-safe p-6 justify-between text-background">
          <div className="flex flex-col gap-2">
            {/* <h1 className="text-4xl tracking-tight font-serif">
              Elevate your Fashion Game
            </h1> */}
            <span className="font-medium text-md tracking-tight">
              Welcome Artists!
            </span>
          </div>
          <div className="flex items-center gap-4">
            {userId ? (
              <Link href={"/dashboard"} className="font-medium underline hover:no-underline cursor-pointer">
                Live Try-On
              </Link>
            ) : (
              <SignInButton mode="modal">
                <Button className="btn btn-primary underline hover:no-underline cursor-pointer" variant={"ghost"}>Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}
