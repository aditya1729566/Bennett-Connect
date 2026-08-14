import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bennettconnect.vercel.app"),
  title: "Bennett Connect",
  description: "Find the Bennett University students you should know.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bennett Connect",
    description: "Find the people on campus you should know.",
    url: "/",
    siteName: "Bennett Connect",
    images: [
      {
        url: "/bennett-connect-preview.png",
        width: 1200,
        height: 630,
        alt: "Bennett Connect logo and campus discovery tagline",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bennett Connect",
    description: "Find the people on campus you should know.",
    images: ["/bennett-connect-preview.png"],
  },
  icons: {
    icon: [
      { url: "/bennett-connect-logo.png", sizes: "512x512", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f7fb]">{children}</body>
    </html>
  );
}
