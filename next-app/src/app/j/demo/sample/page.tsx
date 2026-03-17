import React from "react";
import { Providers } from "@next/components/Providers";

export default function DemoSamplePage() {
    return (
        <Providers>
            <div className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
                <h1 className="text-4xl font-bold mb-4">Demo Sample</h1>
                <p className="text-xl text-gray-600">This is a static sample demo fallback.</p>
            </div>
        </Providers>
    );
}
