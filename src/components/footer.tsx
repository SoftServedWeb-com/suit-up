import { TrialRoomLogowithText } from "@/lib/logo";
import { WaitingList } from "./waiting-list";

export default function Footer() {
  return (
    <div className="h-fit w-full bg-background">
      <div className="flex flex-col w-full items-center px-6 py-6 md:py-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex w-full items-center justify-between">
          <div className="w-42 max-h-26 h-full object-cover flex items-center justify-center">
            <TrialRoomLogowithText className="text-[#982E83]"/>
          </div>
          <div>
            <WaitingList />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col items-center gap-6 w-full">
          <div className="w-40 h-full object-cover flex items-center justify-center">
            <TrialRoomLogowithText className="text-[#982E83]"/>
          </div>
          <div className="w-full flex justify-center">
            <WaitingList />
          </div>
        </div>

        <p className="text-black tracking-tight font-medium mt-4 md:mt-0 text-sm md:text-base">
          ©️ 2025 Soft Served Web
        </p>
      </div>
    </div>
  );
}