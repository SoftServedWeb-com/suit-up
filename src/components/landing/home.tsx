import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { TrialRoomStudio } from "@/lib/logo";
import Footer from "../footer";
import { Button } from "../ui/button";
import { getTodaysColorTheme} from "@/lib/colors-switch";
import { getSimpleColorOverlay } from "@/lib/svg-css-for-ios";
import { NoiseOverlay } from "@/lib/noise-overlay";
// import { getTodaysOverlayCSS } from "@/lib/svg-css-for-ios";

export default async function Home2() {
  const { userId } = await auth();

  // Get today's overlay

  const todaysTheme = getTodaysColorTheme();

  // Get today's overlay styles (CSS-based for iOS compatibility)
  // const todaysOverlayStyles = getTodaysOverlayCSS();

  return (
    <div className="h-fit overflow-hidden rounded-sm border border-border relative ">
      <div className="bg-background h-[92vh] md:h-[97vh] relative">
        <div className="absolute inset-0 top-0 bottom-0 z-5 w-full h-full">
          {" "}
          <video
            src={
              "https://res.cloudinary.com/duwh0ork4/video/upload/v1753200373/video_ycgfzh.mp4#t=0.001"
            }
            className="w-full h-full object-cover z-7"
            playsInline
            loop
            autoPlay
            muted
            // iOS specific attributes
            webkit-playsinline="true"
            x-webkit-airplay="allow"
            // Preload for better iOS performance
            preload="auto"
            // Add poster for fallback
            // poster="https://res.cloudinary.com/duwh0ork4/image/upload/v1753707205/fallback_rlsvmr.png"
            // Additional iOS compatibility
            controls={false}
            disablePictureInPicture
          />
          {/* <VideoPlayer
            src={"https://res.cloudinary.com/duwh0ork4/video/upload/v1753200373/video_ycgfzh.mp4"}
            poster="https://res.cloudinary.com/duwh0ork4/image/upload/v1753707205/fallback_rlsvmr.png"
            className="w-full h-full object-cover z-7"
          /> */}
          {/* <div className="absolute inset-0 w-full h-full object-contain z-8 overflow-hidden">
            {todaysOverlay}
          </div> */}
          {/* Simple CSS overlay with color and subtle texture */}
          {/* <div style={overlayStyles} /> */}
          <NoiseOverlay theme={todaysTheme} />
        </div>

        {/* Centered Logo */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
            <TrialRoomStudio className="text-white" />
          </div>
        </div>

        <div className="relative flex h-full z-[999] items-end-safe p-6 justify-between text-background">
          <div className="flex flex-col gap-2">
            {/* <h1 className="text-4xl tracking-tight font-serif">
              Elevate your Fashion Game
            </h1> */}
            <span className="font-medium text-md md:text-lg tracking-tight">
              Home to bespoke artists!
            </span>
          </div>
          <div className="flex items-center gap-4">
            {userId ? (
              <Link
                href={"/dashboard"}
                className="font-medium underline hover:no-underline cursor-pointer"
              >
                Live Try-On
              </Link>
            ) : (
              <Button
                className="btn btn-primary underline hover:no-underline cursor-pointer"
                variant={"secondary"}
              >
                Invite Only
              </Button>
              // <SignInButton mode="modal">
              // </SignInButton>
            )}
          </div>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}
