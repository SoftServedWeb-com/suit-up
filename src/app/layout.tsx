import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";

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
  const { userId, redirectToSignIn } = await auth();

  // Protect the route by checking if the user is signed in
  if (!userId) {
    return redirectToSignIn();
  }
  // TODO For using dashboard change this.
  const user = await currentUser();

  if (user) {
    const dbuser = await db.user.findUnique({
      where: {
        id: user.id!,
      },
      select: {
        id: true,
      },
    });

    if (!dbuser) {
      await db.user.create({
        data: {
          id: user.id,
          email: user.emailAddresses[0].emailAddress,
          name: user.firstName + " " + user.lastName,
        },
      });
    }
  }
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
