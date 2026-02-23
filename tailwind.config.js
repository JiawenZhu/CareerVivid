/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#49e619",
                "primary-dark": "#3bc512",
                "background-light": "#f6f8f6",
                "background-dark": "#152111",
                "surface-light": "#ffffff",
                "surface-dark": "#1e2e1a",
                "card-light": "#ffffff",
                "card-dark": "#1f2b1b",
                "text-main": "#111b0e",
                "text-main-light": "#111b0e",
                "text-main-dark": "#f0f5ef",
                "text-secondary": "#5f974e",
                "text-secondary-light": "#5f974e",
                "text-secondary-dark": "#9abf8f",
                "text-light": "#f6f8f6",
                "border-light": "#d5e7d0",
                "border-dark": "#2a3d25",
            },
            fontFamily: {
                "display": ["Manrope", "sans-serif"],
                "body": ["Noto Sans", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
            },
        },
    },
    plugins: [
        require('@tailwindcss/container-queries'),
        require('@tailwindcss/forms'),
    ],
};
