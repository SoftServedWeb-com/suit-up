import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { TrailRoom } from "@/lib/logo";
import Footer from "../footer";
import { Button } from "../ui/button";
import { redirect } from "next/navigation";
import { getTodaysOverlay } from "@/lib/colors-switch";

export default async function Home2() {
  const { userId } = await auth();

  // Get today's overlay
  const todaysOverlay = getTodaysOverlay();


  // if (userId) {
  //   return redirect(`/dashboard`);
  // }

  return (
    <div className="h-fit overflow-hidden rounded-sm border border-border relative ">
      <div className="bg-background h-[92vh] md:h-[97vh] relative">
        <div className="absolute inset-0 top-0 bottom-0 z-5 w-full h-full">
          {" "}
          <video
            src={"https://res.cloudinary.com/duwh0ork4/video/upload/v1753200373/video_ycgfzh.mp4"}
            className="w-full h-full object-cover z-7"
            playsInline
            loop
            autoPlay
            muted
          ></video>
          <div className="absolute inset-0 w-full h-full object-contain z-8 overflow-hidden">
            {todaysOverlay}
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
            <span className="font-medium text-md md:text-lg tracking-tight">
              Welcome Bespoke Artists!
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