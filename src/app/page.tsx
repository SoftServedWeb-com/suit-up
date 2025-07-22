import { AuroraBackground } from "@/components/aurora-bg";
import Home2 from "@/components/landing/home";
export default async function Page() {
  
  return (
    <div className="min-h-screen  bg-border p-2">
      {/* <AuroraBackground> */}
         <Home2/>
      {/* </AuroraBackground> */}
    </div>
  );
}