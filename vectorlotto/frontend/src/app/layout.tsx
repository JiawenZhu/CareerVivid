import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VectorLotto — Statistical Ensemble Research Engine",
  description:
    "Quantitative Mega Millions analysis using Thompson Sampling + Kelly Criterion. Simulate, research, and understand lottery probability distributions. Not a gambling platform.",
  keywords: ["lottery simulator", "mega millions statistics", "probability analysis", "monte carlo simulation"],
  openGraph: {
    title: "VectorLotto — Statistical Ensemble Research Engine",
    description:
      "Simulate & research lottery probability using multi-armed bandit algorithms and Monte Carlo methods.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
