import { TrialRoomLogowithText } from "@/lib/logo";
import { WaitingList } from "./waiting-list";
import { Copyright } from "lucide-react";

export default function Footer() {
  return (
    <div className="h-fit w-full bg-background">
      <div className="flex flex-col w-full items-center px-6 py-3">
        <div className="flex w-full items-center justify-between ">
          <div className="w-52 max-h-26 h-full object-cover flex items-center justify-center ">
            {TrialRoomLogowithText}
          </div>
          <div className="w">
            <WaitingList />
          </div>
        </div>
        <p className="text-black tracking-tight font-medium" > ©️ 2025 Soft Served Web</p>
      </div>
    </div>
  );
}
