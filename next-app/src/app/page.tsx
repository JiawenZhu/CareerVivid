import type { Metadata } from "next";
import { HomePage } from "../components/public/HomePage";

export const metadata: Metadata = {
  title: {
    absolute: "CareerVivid | AI Job Search Workspace & Chrome Extension",
  },
  description:
    "CareerVivid is an AI job-search workspace for direct job links, resume tailoring, application tracking, interview prep, and Chrome extension workflows.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <HomePage />;
}
