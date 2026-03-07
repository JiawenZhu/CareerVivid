import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Loader2, Zap } from 'lucide-react';
import { navigate } from '../../utils/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_PLAN_CREDIT_LIMIT, PRO_PLAN_CREDIT_LIMIT, PRO_MAX_PLAN_CREDIT_LIMIT, ENTERPRISE_PLAN_CREDIT_LIMIT } from '../../config/creditCosts';

interface PricingComparisonProps {
    onCloudUpgrade?: () => void;
    isLoading?: boolean;
}

export const PricingComparison: React.FC<PricingComparisonProps> = ({ onCloudUpgrade, isLoading }) => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const handleUpgradeClick = () => {
        if (currentUser) {
            navigate('/subscription');
        } else {
            navigate('/signup?redirect=/subscription');
        }
    };

    const features = [
        { name: 'CLI Publish (Markdown/Mermaid)', free: '0 Credits', pro: '0 Credits', proMax: '0 Credits', enterprise: '0 Credits' },
        { name: 'ReactFlow UI Conversion', free: '5 Credits', pro: '5 Credits', proMax: '5 Credits', enterprise: '5 Credits' },
        { name: 'Architecture Auto-Gen', free: '10 Credits', pro: '10 Credits', proMax: '10 Credits', enterprise: '10 Credits' },
        { name: 'Living Documentation Sync', free: false, pro: true, proMax: true, enterprise: true },
        { name: 'Private Team Workspaces', free: false, pro: false, proMax: false, enterprise: true },
        { name: 'Nano Banana 2 (Iterative)', free: false, pro: false, proMax: '20 Credits', enterprise: '20 Credits' },
        { name: 'Technical Voice Interviews', free: '15 Credits', pro: '15 Credits', proMax: '15 Credits', enterprise: '15 Credits' },
        { name: 'Portfolio Review Analysis', free: '5 Credits', pro: '5 Credits', proMax: '5 Credits', enterprise: '5 Credits' },
        { name: 'Advanced RBAC & SSO', free: false, pro: false, proMax: false, enterprise: true },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
                <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-4">
                    Scale with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">DevTool Credits</span>
                </h2>
                <p className="max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400 font-medium">
                    Built for high-volume developers. Publish architectures for free,
                    and use automated intelligence when precision matters.
                </p>
            </div>

            {/* 4-Tier Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                {/* Community */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Community</h3>
                        <p className="text-sm text-gray-500 mt-1">For hobbyists & open-source.</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">$0</span>
                        <div className="text-xs text-green-600 font-bold tracking-widest mt-2 uppercase">
                            50 Credits / mo
                        </div>
                    </div>
                    <ul className="space-y-3 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2"><Check className="text-green-500 flex-shrink-0" size={18} /> Public CLI Publishing</li>
                        <li className="flex items-start gap-2"><Check className="text-green-500 flex-shrink-0" size={18} /> Mermaid.js Rendering</li>
                        <li className="flex items-start gap-2"><Check className="text-green-500 flex-shrink-0" size={18} /> Community Feed</li>
                    </ul>
                    <button onClick={() => navigate('/signup')} className="w-full py-3 rounded-xl font-bold border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Join Community
                    </button>
                </div>

                {/* Pro */}
                <div className="bg-white dark:bg-gray-900 border-2 border-primary-500/20 rounded-3xl p-6 shadow-lg flex flex-col relative overflow-hidden">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pro</h3>
                        <p className="text-sm text-gray-500 mt-1">For active developers.</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">$6</span>
                        <span className="text-gray-500 text-sm font-bold">/mo</span>
                        <div className="text-xs text-primary-600 font-bold tracking-widest mt-2 uppercase">
                            666 Credits / mo
                        </div>
                    </div>
                    <ul className="space-y-3 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2"><Check className="text-primary-500 flex-shrink-0" size={18} /> Unlisted Posts</li>
                        <li className="flex items-start gap-2"><Check className="text-primary-500 flex-shrink-0" size={18} /> Custom Domains</li>
                        <li className="flex items-start gap-2"><Check className="text-primary-500 flex-shrink-0" size={18} /> Living Doc Sync</li>
                    </ul>
                    <button onClick={handleUpgradeClick} className="w-full py-3 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20">
                        Try Pro
                    </button>
                </div>

                {/* Pro Max */}
                <div className="bg-white dark:bg-gray-900 border-2 border-purple-500 rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden">
                    <div className="absolute -right-8 top-4 rotate-45 bg-purple-500 text-white text-[10px] font-black px-10 py-1">POWER</div>
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pro Max</h3>
                        <p className="text-sm text-gray-500 mt-1">For power users.</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-4xl font-black text-gray-900 dark:text-white">$8</span>
                        <span className="text-gray-500 text-sm font-bold">/mo</span>
                        <div className="text-xs text-purple-600 font-bold tracking-widest mt-2 uppercase">
                            888 Credits / mo
                        </div>
                    </div>
                    <ul className="space-y-3 mb-8 flex-grow text-sm font-medium text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2"><Check className="text-purple-500 flex-shrink-0" size={18} /> Private Posts</li>
                        <li className="flex items-start gap-2"><Check className="text-purple-500 flex-shrink-0" size={18} /> Advanced ReactFlow</li>
                        <li className="flex items-start gap-2"><Check className="text-purple-500 flex-shrink-0" size={18} /> Nano Banana 2</li>
                    </ul>
                    <button onClick={handleUpgradeClick} className="w-full py-3 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20">
                        Get Pro Max
                    </button>
                </div>

                {/* Enterprise */}
                <div className="bg-gray-900 text-white rounded-3xl p-6 shadow-2xl flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold">Enterprise</h3>
                        <p className="text-sm text-gray-400 mt-1">For engineering teams.</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-4xl font-black">$12</span>
                        <span className="text-gray-400 text-sm font-bold">/seat</span>
                        <div className="text-xs text-amber-400 font-bold tracking-widest mt-2 uppercase">
                            1200 Pooled Credits
                        </div>
                    </div>
                    <ul className="space-y-3 mb-8 flex-grow text-sm font-medium text-gray-300">
                        <li className="flex items-start gap-2"><Check className="text-amber-400 flex-shrink-0" size={18} /> Private Workspaces</li>
                        <li className="flex items-start gap-2"><Check className="text-amber-400 flex-shrink-0" size={18} /> SSO & SCIM</li>
                        <li className="flex items-start gap-2"><Check className="text-amber-400 flex-shrink-0" size={18} /> Team RBAC</li>
                    </ul>
                    <button onClick={handleUpgradeClick} className="w-full py-3 rounded-xl font-bold bg-white text-gray-900 hover:bg-gray-100 transition-colors">
                        Enterprise
                    </button>
                </div>
            </div>

            {/* Feature Table */}
            <div className="mt-20 overflow-hidden bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <th className="p-6 border-b border-gray-200 dark:border-gray-800">Capabilities</th>
                                <th className="p-6 border-b border-gray-200 dark:border-gray-800 text-center">Community</th>
                                <th className="p-6 border-b border-gray-200 dark:border-gray-800 text-center">Pro</th>
                                <th className="p-6 border-b border-gray-200 dark:border-gray-800 text-center">Pro Max</th>
                                <th className="p-6 border-b border-gray-200 dark:border-gray-800 text-center">Enterprise</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {features.map((f, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="p-6 font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800/50">{f.name}</td>
                                    <td className="p-6 text-center border-b border-gray-100 dark:border-gray-800/50 font-medium">
                                        {typeof f.free === 'string' ? f.free : f.free ? <Check className="mx-auto text-green-500" /> : <X className="mx-auto text-gray-300" />}
                                    </td>
                                    <td className="p-6 text-center border-b border-gray-100 dark:border-gray-800/50 font-medium text-primary-600">
                                        {typeof f.pro === 'string' ? f.pro : f.pro ? <Check className="mx-auto" /> : <X className="mx-auto text-gray-300" />}
                                    </td>
                                    <td className="p-6 text-center border-b border-gray-100 dark:border-gray-800/50 font-medium text-purple-600">
                                        {typeof f.proMax === 'string' ? f.proMax : f.proMax ? <Check className="mx-auto" /> : <X className="mx-auto text-gray-300" />}
                                    </td>
                                    <td className="p-6 text-center border-b border-gray-100 dark:border-gray-800/50 font-medium text-amber-500">
                                        {typeof f.enterprise === 'string' ? f.enterprise : f.enterprise ? <Check className="mx-auto" /> : <X className="mx-auto text-gray-300" />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
