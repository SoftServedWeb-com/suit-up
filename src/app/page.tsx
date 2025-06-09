import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { redirect } from "next/navigation"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6 p-8">
            <h1 className="text-4xl font-bold text-gray-900">Fashion Try-On Dashboard</h1>
            <p className="text-xl text-gray-600 max-w-md">
              Experience AI-powered virtual clothing try-on. Upload your photos and see how clothes look on you
              instantly.
            </p>
            <SignInButton mode="modal">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
                Get Started
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      <SignedIn>{redirect("/dashboard")}</SignedIn>
    </div>
  )
}
