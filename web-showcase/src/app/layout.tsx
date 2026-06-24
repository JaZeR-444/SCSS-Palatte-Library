import { StudioProvider } from "@/components/studio/studio-context";
import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "SCSS Palette Library | 2,500+ Curated Palettes",
  description:
    "A professional design system of themed, production-ready SCSS and CSS color palettes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bricolage.variable} ${dmMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StudioProvider>
            {children}
            <Toaster />
          </StudioProvider>
        </ThemeProvider>

        {/* Global SVG colorblind simulation filters */}
        <svg className="hidden" aria-hidden="true" focusable="false">
          <defs>
            <filter id="filter-protanopia">
              <feColorMatrix
                type="matrix"
                values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"
              />
            </filter>
            <filter id="filter-deuteranopia">
              <feColorMatrix
                type="matrix"
                values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"
              />
            </filter>
            <filter id="filter-tritanopia">
              <feColorMatrix
                type="matrix"
                values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"
              />
            </filter>
            <filter id="filter-achromatopsia">
              <feColorMatrix
                type="matrix"
                values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"
              />
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  );
}
