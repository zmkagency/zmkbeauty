import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://zmkbeauty.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ZMK Beauty | Güzellik Randevu Platformu",
    template: "%s | ZMK Beauty",
  },
  description:
    "Türkiye'nin güzellik ve kişisel bakım randevu platformu. Kuaför, güzellik merkezi, lazer epilasyon randevunuzu online olarak kolayca oluşturun.",
  keywords: [
    "güzellik merkezi",
    "kuaför randevu",
    "lazer epilasyon",
    "online randevu",
    "güzellik randevu",
    "Kırıkkale kuaför",
  ],
  applicationName: "ZMK Beauty",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZMK Beauty",
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [{ url: "/icon-192.svg", type: "image/svg+xml" }],
    shortcut: ["/icon-192.svg"],
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "ZMK Beauty",
    url: SITE_URL,
    title: "ZMK Beauty | Güzellik Randevu Platformu",
    description:
      "Kuaför, güzellik merkezi ve lazer epilasyon için online randevu — Türkiye'nin yeni nesil rezervasyon platformu.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZMK Beauty",
    description:
      "Kuaför, güzellik merkezi ve lazer epilasyon için online randevu.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-white antialiased">
        {children}
      </body>
    </html>
  );
}
