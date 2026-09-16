import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Tu página profesional, lista en minutos. Sin programar, sin complicaciones. $25.000/mes con Mercado Pago.";

export const metadata: Metadata = {
  title: "weboficial — Tu página profesional, lista en minutos",
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "weboficial — Tu página profesional, lista en minutos",
    description: SITE_DESCRIPTION,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
