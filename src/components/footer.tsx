import { TrialRoomLogowithText } from "@/lib/logo";
import { WaitingList } from "./waiting-list";
import Link from "next/link";
import { getTodaysColor } from "@/lib/colors-switch";

export default function Footer() {
  // Get today's color for consistent theming
  const todaysColor = getTodaysColor();
  console.log(`Today's Color: text-[${todaysColor}]`);

  return (
    <div className="h-fit w-full bg-background">
      <div className="flex flex-col w-full items-center px-6 py-6 md:py-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex w-full items-center justify-between">
          <div className="w-42 max-h-26 h-full object-cover flex items-center justify-center">
            <TrialRoomLogowithText className={`text-[${todaysColor}]`} />
          </div>
          <div>
            <WaitingList />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col items-center gap-6 w-full">
          <div className="w-40 h-full object-cover flex items-center justify-center">
            <TrialRoomLogowithText className={`text-[${todaysColor}]`} />
          </div>
          <div className="w-full flex justify-center">
            <WaitingList />
          </div>
        </div>

        <p className="text-black italic font-medium mt-4 md:mt-0 text-sm md:text-base">
          A product of {" "} 
          <Link 
            href={"https://softservedweb.com"} 
            target="_blank"  
            className="hover:opacity-50"
            style={{ color: todaysColor }}
          >
            Soft Served Web
          </Link> 
        </p>
      </div>
    </div>
  );
}