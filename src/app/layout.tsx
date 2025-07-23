import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import {Toaster} from "sonner"
import Home from "./page";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const serif = Playfair_Display({
  subsets: [ "latin" ],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Trailroom.Studio",
  description: "Experience the future of fashion with AI-powered virtual try-ons",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <ClerkProvider>
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
