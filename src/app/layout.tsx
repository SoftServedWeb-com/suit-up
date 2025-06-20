import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import {Toaster} from "sonner"

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
  title: "Immersive Cloth Tryon",
  description: "Made by Aniz - SSW",
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
          className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} antialiased`}
        >
          <Toaster richColors closeButton/>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
