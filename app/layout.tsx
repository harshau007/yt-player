"use client";

import Search from "@/components/search";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/theme-toggle";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { Inter } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRoom = pathname.startsWith("/room");
  const router = useRouter();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Music App</title>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="min-h-screen bg-background text-foreground">
            <header className="container mx-auto p-4">
              <div className="flex justify-between items-center select-none">
                <h1
                  className="text-2xl font-bold hover:cursor-pointer"
                  onClick={() => router.replace("/")}
                >
                  Music App
                </h1>
                {!isRoom && <Search />}
                <ModeToggle />
              </div>
            </header>
            <main className="container mx-auto p-4">
              {isRoom ? (
                <WebSocketProvider>{children}</WebSocketProvider>
              ) : (
                children
              )}
            </main>
          </div>
          <Toaster richColors={true} />
        </ThemeProvider>
      </body>
    </html>
  );
}
