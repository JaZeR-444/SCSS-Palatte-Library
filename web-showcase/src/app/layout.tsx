import { StudioProvider } from "@/components/studio/studio-context";
import type { Metadata, Viewport } from "next";
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

const BASE_URL = "https://app-pallates.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Palattes — 3,000+ Color Palettes",
    template: "%s | Palattes",
  },
  description:
    "Browse, search, and export 3,000+ production-ready SCSS & CSS color palettes. Built for designers and developers who care about precision.",
  keywords: [
    "color palette",
    "SCSS palette",
    "CSS variables",
    "design system",
    "color library",
    "web design",
    "tailwind colors",
  ],
  authors: [{ name: "JaZeR-444", url: "https://github.com/JaZeR-444" }],
  creator: "JaZeR-444",
  applicationName: "Palattes",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Palattes",
    title: "Palattes — 3,000+ Color Palettes",
    description:
      "Browse, search, and export 3,000+ production-ready SCSS & CSS color palettes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Palattes — Color Palette Library",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Palattes — 3,000+ Color Palettes",
    description:
      "Browse, search, and export 3,000+ production-ready SCSS & CSS color palettes.",
    images: ["/og-image.png"],
    creator: "@JaZeR_444",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9FAFB" },
    { media: "(prefers-color-scheme: dark)",  color: "#020617" },
  ],
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
