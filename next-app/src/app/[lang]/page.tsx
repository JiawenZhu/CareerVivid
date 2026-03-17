import React from "react";
import { Providers } from "@next/components/Providers";
import { Metadata } from "next";

const LANGS = ["es", "fr", "de", "zh", "ja", "ko"];

export async function generateStaticParams() {
    return LANGS.map(lang => ({ lang }));
}

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    const { lang } = await params;
    return {
        title: `CareerVivid | ${lang.toUpperCase()}`,
        description: `CareerVivid home page in ${lang}`,
    };
}

export default async function LocalizedHome({ params }: { params: { lang: string } }) {
    const { lang } = await params;

    return (
        <Providers>
            <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
                <h1 className="text-4xl font-bold mb-4">
                    CareerVivid ({lang.toUpperCase()})
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Welcome to the specialized localized version of CareerVivid for {lang}.
                </p>
                <div className="p-8 border rounded-lg bg-gray-50 dark:bg-zinc-900">
                    <p>Static SEO optimized landing page.</p>
                    <a href="/" className="text-blue-500 hover:underline mt-4 inline-block">
                        Continue to Main App
                    </a>
                </div>
            </div>
        </Providers>
    );
}
