import type { Metadata } from "next";
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
  title: "Scope – Der Business Check für klare Entscheidungen",
  description:
    "Scope analysiert Positionierung, Website und Wachstumschancen und übersetzt sie in einen klaren, direkt umsetzbaren Maßnahmenplan.",
  keywords: [
    "Business Check",
    "Unternehmensanalyse",
    "Website Audit",
    "Digitalisierung Mittelstand",
    "Wachstumsstrategie",
  ],
  openGraph: {
    title: "Scope – Sehen Sie Ihr Unternehmen mit neuen Augen",
    description: "Kostenloser Business Check mit klarer Scorecard und Maßnahmenplan.",
    type: "website",
    locale: "de_DE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
