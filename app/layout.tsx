import Search from "@/components/search";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/theme-toggle";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Music App",
  description: "A modern music app built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <WebSocketProvider>
            <div className="min-h-screen bg-background text-foreground">
              <header className="container mx-auto p-4">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-bold">Music App</h1>
                  <Search />
                  <ModeToggle />
                </div>
              </header>
              <main className="container mx-auto p-4">{children}</main>
            </div>
          </WebSocketProvider>
          <Toaster richColors={true} />
        </ThemeProvider>
      </body>
    </html>
  );
}
