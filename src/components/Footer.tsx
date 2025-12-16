
import React from 'react';
import Logo from './Logo';
import { navigate } from '../App';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Logo className="h-8 w-8" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">CareerVivid</span>
                    </div>
                    <div className="flex gap-6 text-gray-500 dark:text-gray-400">
                        <button onClick={() => navigate('/')} className="hover:text-primary-500 transition-colors">Features</button>
                        <button onClick={() => navigate('/pricing')} className="hover:text-primary-500 transition-colors">Pricing</button>
                        <button onClick={() => navigate('/contact')} className="hover:text-primary-500 transition-colors">Help Center</button>
                        <button onClick={() => navigate('/policy')} className="hover:text-primary-500 transition-colors">Policy</button>
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