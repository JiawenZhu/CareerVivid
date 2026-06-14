import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://careervivid.app"),
  title: {
    template: "%s | CareerVivid",
    default: "CareerVivid | AI Job Search Workspace & Chrome Extension",
  },
  description:
    "CareerVivid is an AI job-search workspace for resumes, job tracking, interview prep, portfolios, and Chrome extension autofill.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://careervivid.app/",
    siteName: "CareerVivid",
    title: "CareerVivid | AI Job Search Workspace & Chrome Extension",
    description:
      "Build resumes, save job context, prepare interviews, and keep every application moving from one workspace.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
