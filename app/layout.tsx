import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OsobniRobot — Tvoj osobni AI asistent",
  description:
    "Pokreni svog osobnog AI asistenta za 60 sekundi. Bez tehničkog znanja. Na hrvatskom.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "OsobniRobot — Tvoj osobni AI asistent",
    description:
      "Jednim klikom pokreni 24/7 AI asistenta na Telegramu. Fiksna cijena, bez iznenađenja.",
    url: "https://osobnirobot.com",
    siteName: "OsobniRobot",
    locale: "hr_HR",
    type: "website",
    images: [
      {
        url: "https://osobnirobot.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "OsobniRobot — Tvoj osobni AI asistent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OsobniRobot — Tvoj osobni AI asistent",
    description: "Pokreni AI asistenta za 60 sekundi. Fiksna cijena od $19/mj.",
    images: ["https://osobnirobot.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr">
      <body>{children}</body>
    </html>
  );
}
