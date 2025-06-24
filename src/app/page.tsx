import {
  SignedIn,
  SignedOut,
  SignInButton
} from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Sparkles, ArrowRight, Zap, Palette, Camera, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default async function Home() {
  
  return (
    <div className="min-h-screen bg-background pattern-bg">
      {/* <SignedOut> */}
        <div className="relative overflow-hidden">
          {/* Hero Section */}
          <div className="relative px-6 lg:px-8">
            <div className="mx-auto max-w-3xl pt-20 pb-32 sm:pt-48 sm:pb-40">
              <div className="text-center">
                {/* Logo/Brand */}
                <div className="flex justify-center mb-8">
                  <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <span className="text-primary font-semibold">AI Fashion</span>
                  </div>
                </div>
                
                {/* Main Heading */}
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                  Virtual Try-On
                  <span className="block text-primary mt-2">Made Simple</span>
                </h1>
                
                {/* Subtitle */}
                <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
                  Experience the future of fashion with AI-powered virtual try-ons. 
                  Upload your photos and see how any outfit looks on you instantly.
                </p>
                
                {/* CTA Button */}
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <SignInButton mode="modal" >
                    {/* <button className="group relative bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2">
                      Dashboard
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button> */}
                    <Link
                      href={"/dashboard"}
                      className={cn(buttonVariants({"variant":"default"}))}>
                      Dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </SignInButton>
                  <button className="text-foreground hover:text-primary font-semibold py-3 px-4 transition-colors">
                    Learn more
                  </button>
                </div>
                
                {/* Features */}
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Instant Results</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      See how clothes fit in seconds
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Palette className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Any Style</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try on any clothing category
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">High Quality</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Photorealistic AI generation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary to-primary/50 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>
      {/* </SignedOut> */}

    
    </div>
  );
}