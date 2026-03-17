import React from "react";
import { Providers } from "@next/components/Providers";
import { Metadata } from "next";

// Define the supported languages and pages for static export
const LANGS = ["es", "fr", "de", "zh", "ja", "ko"];
const PAGES = ["pricing", "blog", "contact", "signin", "signup", "about", "privacy", "terms"];

export async function generateStaticParams() {
    const params: { lang: string; slug: string }[] = [];
    for (const lang of LANGS) {
        for (const slug of PAGES) {
            params.push({ lang, slug });
        }
    }
    return params;
}

export async function generateMetadata({ params }: { params: { lang: string; slug: string } }): Promise<Metadata> {
    const { lang, slug } = await params;
    const title = `${slug.charAt(0).toUpperCase() + slug.slice(1)} | CareerVivid`;
    return {
        title,
        description: `CareerVivid ${slug} page in ${lang}`,
    };
}

export default async function LocalizedPage({ params }: { params: { lang: string; slug: string } }) {
    const { lang, slug } = await params;

    return (
        <Providers>
            <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
                <h1 className="text-4xl font-bold mb-4">
                    {slug.toUpperCase()} ({lang.toUpperCase()})
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    This is the localized {slug} page for {lang}.
                </p>
                <div className="p-8 border rounded-lg bg-gray-50 dark:bg-zinc-900">
                    <p>Static SEO Page for {lang}</p>
                    <a href="/" className="text-blue-500 hover:underline mt-4 inline-block">
                        Go to Main App
                    </a>
                </div>
            </div>
        </Providers>
    );
}
