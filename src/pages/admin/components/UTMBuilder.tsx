import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Copy, Trash2, ExternalLink, QrCode, RefreshCw, CheckCircle } from 'lucide-react';
import Toast from '../../../components/Toast';

interface UTMLink {
    id: string;
    destination: string;
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
    fullUrl: string;
    createdAt: number;
}

const UTMBuilder: React.FC = () => {
    const [destination, setDestination] = useState('');
    const [source, setSource] = useState('google');
    const [medium, setMedium] = useState('cpc');
    const [campaign, setCampaign] = useState('');
    const [term, setTerm] = useState('');
    const [content, setContent] = useState('');
    const [history, setHistory] = useState<UTMLink[]>([]);
    const [copied, setCopied] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const generatedUrl = (() => {
        if (!destination) return '';
        try {
            const url = new URL(destination.startsWith('http') ? destination : `https://${destination}`);
            url.searchParams.set('utm_source', source);
            url.searchParams.set('utm_medium', medium);
            url.searchParams.set('utm_campaign', campaign || 'unnamed_campaign');
            if (term) url.searchParams.set('utm_term', term);
            if (content) url.searchParams.set('utm_content', content);
            return url.toString();
        } catch (e) {
            return 'Invalid Destination URL';
        }
    })();

    useEffect(() => {
        const saved = localStorage.getItem('utm_history');
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    const handleSave = () => {
        if (!generatedUrl || generatedUrl === 'Invalid Destination URL') return;
        const newItem: UTMLink = {
            id: Math.random().toString(36).substr(2, 9),
            destination,
            source,
            medium,
            campaign,
            term,
            content,
            fullUrl: generatedUrl,
            createdAt: Date.now()
        };
        const newHistory = [newItem, ...history].slice(0, 20);
        setHistory(newHistory);
        localStorage.setItem('utm_history', JSON.stringify(newHistory));
    };

    const handleCopy = () => {
        if (!generatedUrl) return;
        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        handleSave();
    };

    const deleteItem = (id: string) => {
        const newHistory = history.filter(h => h.id !== id);
        setHistory(newHistory);
        localStorage.setItem('utm_history', JSON.stringify(newHistory));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b dark:border-gray-700 pb-4">
                <LinkIcon className="h-6 w-6 text-primary-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">UTM Tracking Link Builder</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Builder Form */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination URL</label>
                        <input 
                            type="text" 
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            placeholder="e.g. careervivid.app/pricing"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Source</label>
                            <select 
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                            >
                                <option value="google">Google</option>
                                <option value="facebook">Facebook</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="sms">SMS</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="newsletter">Newsletter</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Medium</label>
                            <select 
                                value={medium}
                                onChange={(e) => setMedium(e.target.value)}
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                            >
                                <option value="cpc">CPC (Paid Ads)</option>
                                <option value="social">Social</option>
                                <option value="email">Email</option>
                                <option value="referral">Referral</option>
                                <option value="organic">Organic</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name</label>
                        <input 
                            type="text" 
                            value={campaign}
                            onChange={(e) => setCampaign(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g. spring_promo_2026"
                        />
                    </div>

                    {/* Generated Output */}
                    <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/30">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">Generated URL</h4>
                            {copied && <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10} /> Copied!</span>}
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 p-2.5 bg-white dark:bg-gray-900 border border-primary-200 dark:border-primary-800 rounded-lg text-xs font-mono break-all line-clamp-2">
                                {generatedUrl || 'Waiting for input...'}
                            </div>
                            <button 
                                onClick={handleCopy}
                                disabled={!generatedUrl || generatedUrl.includes('Invalid')}
                                className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <Copy size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* History & Preview */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Link History</h3>
                            <button onClick={() => { setHistory([]); localStorage.removeItem('utm_history'); }} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                                <RefreshCw size={12} /> Clear All
                            </button>
                        </div>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {history.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 italic text-sm">No links generated yet.</div>
                            ) : history.map((item) => (
                                <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 group">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{item.campaign}</h4>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setDestination(item.destination); setSource(item.source); setMedium(item.medium); setCampaign(item.campaign); }} className="text-primary-500 p-1"><RefreshCw size={14} /></button>
                                            <button onClick={() => deleteItem(item.id)} className="text-red-500 p-1"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-2">
                                        <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded uppercase">{item.source}</span>
                                        <span className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded uppercase">{item.medium}</span>
                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </p>
                                    <div className="mt-2 text-[10px] text-primary-600 truncate">{item.fullUrl}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center gap-6">
                        <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center aspect-square w-24 overflow-hidden relative">
                            {generatedUrl && generatedUrl !== 'Invalid Destination URL' ? (
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(generatedUrl)}`} alt="QR Code" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply dark:mix-blend-lighten" />
                            ) : (
                                <>
                                    <QrCode size={32} className="text-gray-300" />
                                    <span className="text-[8px] text-gray-400 mt-1 uppercase font-bold tracking-widest">QR CODE</span>
                                </>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold mb-1">Visual Touchpoints</h4>
                            <p className="text-xs text-gray-500">Every UTM link automatically generates a downloadable QR code for physical collateral (flyers, dealer posters).</p>
                            <button 
                                onClick={() => {
                                    if (!generatedUrl || generatedUrl === 'Invalid Destination URL') {
                                        setToastMessage("Generate a valid URL first.");
                                        return;
                                    }
                                    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedUrl)}`, '_blank');
                                }}
                                className={`mt-3 text-xs font-bold text-primary-500 flex items-center gap-1 transition-colors ${(!generatedUrl || generatedUrl === 'Invalid Destination URL') ? 'opacity-50 cursor-not-allowed' : 'hover:text-primary-700'}`}
                            >
                                Download PNG <ExternalLink size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </div>
    );
};

export default UTMBuilder;
