import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InstantWorker — Hire Your AI Employee in 1 Click",
  description:
    "Deploy a ready-to-work AI employee in 60 seconds. It browses the web, writes emails, does research. No setup, no coding. 7 days free.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "InstantWorker — Hire Your AI Employee in 1 Click",
    description:
      "Deploy a ready-to-work AI employee in 60 seconds. It browses the web, writes emails, does research. 7 days free.",
    url: "https://instantworker.ai",
    siteName: "InstantWorker",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://instantworker.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "InstantWorker — Hire Your AI Employee",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InstantWorker — Hire Your AI Employee in 1 Click",
    description: "Deploy a ready-to-work AI employee in 60 seconds. 7 days free.",
    images: ["https://instantworker.ai/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
