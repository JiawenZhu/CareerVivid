import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src="https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/logo.png?alt=media&token=3d2f7db5-96db-4dce-ba00-43d8976da3a1" alt="CareerVivid Logo" className="h-8 w-8" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">CareerVivid</span>
                    </div>
                    <div className="flex gap-6 text-gray-500 dark:text-gray-400">
                        <a href="#/" className="hover:text-primary-500 transition-colors">Features</a>
                        <a href="#/pricing" className="hover:text-primary-500 transition-colors">Pricing</a>
                        <a href="mailto:support@careervivid.com" className="hover:text-primary-500 transition-colors">Contact</a>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} CareerVivid. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
export default Footer;