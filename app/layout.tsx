import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://daromiaicha.com"),
  title: {
    default: "Dar Omi Aicha | Location bord de mer – Kerkouane, Tunisie",
    template: "%s | Dar Omi Aicha – Kerkouane",
  },
  description:
    "Louez nos maisons d'hôtes à Kerkouane, Cap Bon, Tunisie. Entre mer azur et site archéologique punique UNESCO. Réservation en ligne sécurisée.",
  keywords:
    "location Kerkouane, maison bord de mer Tunisie, Dar Omi Aicha, Hammam Ghézez, Dar Allouche, Kélibia, El Houaria, Cap Bon, vacances plage Tunisie",
  openGraph: {
    siteName: "Dar Omi Aicha",
    locale: "fr_FR",
    type: "website",
    title: "Dar Omi Aicha | Location bord de mer – Kerkouane, Tunisie",
    description:
      "Louez nos maisons d'hôtes à Kerkouane, Cap Bon, Tunisie. Entre mer azur et site archéologique punique UNESCO. Réservation en ligne sécurisée.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dar Omi Aicha | Location bord de mer – Kerkouane, Tunisie",
    description:
      "Louez nos maisons d'hôtes à Kerkouane, Cap Bon, Tunisie. Entre mer azur et site archéologique punique UNESCO.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col antialiased">{children}</body>
    </html>
  );
}
