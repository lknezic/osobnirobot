import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OsobniRobot — Tvoj osobni AI asistent",
  description:
    "Pokreni svog osobnog AI asistenta za 60 sekundi. Bez tehničkog znanja. Na hrvatskom.",
  openGraph: {
    title: "OsobniRobot — Tvoj osobni AI asistent",
    description:
      "Jednim klikom pokreni 24/7 AI asistenta na Telegramu. Fiksna cijena, bez iznenađenja.",
    url: "https://osobnirobot.com",
    siteName: "OsobniRobot",
    locale: "hr_HR",
    type: "website",
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
