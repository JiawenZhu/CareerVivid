import type { Metadata } from "next";
import { HomePage } from "../components/public/HomePage";

export const metadata: Metadata = {
  title: "AI Job Search Workspace",
  description:
    "CareerVivid helps job seekers manage resumes, saved jobs, interview prep, and application context in one workspace.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <HomePage />;
}
