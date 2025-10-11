import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import {Toaster} from "sonner"

export const metadata: Metadata = {
  title: "Trailroom.Studio",
  description: "Experience the future of fashion with TrialRoom.Studio",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en">
        <body
            className={`antialiased `}
        >
          <Toaster richColors closeButton/>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
