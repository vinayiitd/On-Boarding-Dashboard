import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { StoreProvider } from "@/lib/store";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const serif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sentinel — AI Compliance Officer",
  description:
    "The AI compliance officer for Australian accountants, lawyers and real estate agencies. Onboard clients under Tranche 2 in minutes, not weeks.",
  applicationName: "Sentinel",
  authors: [{ name: "Sentinel" }],
  keywords: [
    "KYC",
    "AML",
    "Tranche 2",
    "AUSTRAC",
    "Compliance",
    "AI",
    "Accountants",
    "Lawyers",
    "Real Estate",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${serif.variable} ${mono.variable} antialiased`}
      >
        <ThemeProvider>
          <StoreProvider>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  className:
                    "rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-[var(--shadow-elevated)]",
                }}
              />
            </TooltipProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
