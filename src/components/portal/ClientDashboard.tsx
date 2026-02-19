import React from 'react';
import {
    CheckCircle, Circle, Clock, DollarSign, FileText,
    ExternalLink, Code, Database, Bot, ShieldCheck, Plus, Check
} from 'lucide-react';
import ProjectBoard from './ProjectBoard';

interface ServiceItem {
    name: string;
    status: string;
}

interface ClientData {
    id: string;
    businessName: string;
    contactName: string;
    currentStage: number;
    stages: string[];
    nextDeadline: string;
    financials: { total: number; paid: number };
    services: ServiceItem[];
}

interface ClientDashboardProps {
    data: ClientData;
    onUploadUpsell?: (serviceName: string) => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ data, onUploadUpsell }) => {

    // Calculate progress percentage for progress bar line
    const progressPercent = (data.currentStage / (data.stages.length - 1)) * 100;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Welcome back, {data.contactName} • <span className="font-medium text-emerald-600 dark:text-emerald-400">{data.businessName}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Project Active
                </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Phase</span>
                        <Clock size={18} className="text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {data.stages[data.currentStage]}
                    </div>
                    <p className="text-sm text-gray-500">On track for delivery</p>
                </div>

                {/* Next Milestone Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Milestone</span>
                        <CheckCircle size={18} className="text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {data.stages[data.currentStage + 1] || "Launch Complete"}
                    </div>
                    <p className="text-sm text-gray-500">Due: <span className="font-semibold text-gray-900 dark:text-white">{data.nextDeadline}</span></p>
                </div>

                {/* Financials Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Investment</span>
                        <DollarSign size={18} className="text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        ${data.financials.paid.toLocaleString()} <span className="text-sm text-gray-400 font-normal">pd / ${data.financials.total.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                            className="bg-purple-500 h-full rounded-full"
                            style={{ width: `${(data.financials.paid / data.financials.total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Progress Tracker (Stepper) */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-8">Project Roadmap</h3>
                <div className="relative">
                    {/* Connecting Line */}
                    <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full -z-0"></div>
                    <div
                        className="absolute top-5 left-0 h-1 bg-emerald-500 rounded-full transition-all duration-500 -z-0"
                        style={{ width: `${progressPercent}%` }}
                    ></div>

                    <div className="flex justify-between relative z-10 w-full">
                        {data.stages.map((stage, index) => {
                            const isCompleted = index < data.currentStage;
                            const isCurrent = index === data.currentStage;

                            return (
                                <div key={stage} className="flex flex-col items-center group">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300
                                        ${isCompleted
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : isCurrent
                                                ? 'bg-white dark:bg-gray-800 border-emerald-500 text-emerald-500 scale-110 shadow-lg shadow-emerald-500/20'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-300'}
                                    `}>
                                        {isCompleted ? <Check size={16} strokeWidth={3} /> : <span className="text-sm font-bold">{index + 1}</span>}
                                    </div>
                                    <span className={`
                                        mt-3 text-xs md:text-sm font-medium transition-colors duration-300
                                        ${isCompleted || isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-400'}
                                    `}>
                                        {stage}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Deliverables / Quick Links */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText size={20} className="text-blue-500" />
                        Project Artifacts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a href="#" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow group">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                <ExternalLink size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Figma Design</div>
                                <div className="text-xs text-gray-500">View Prototype</div>
                            </div>
                        </a>
                        <a href="#" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow group">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                                <Code size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">Staging Link</div>
                                <div className="text-xs text-gray-500">Live Preview</div>
                            </div>
                        </a>
                        <a href="#" className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow group">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                                <ShieldCheck size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">Contract PDF</div>
                                <div className="text-xs text-gray-500">Signed Feb 10</div>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Service List & Upsells */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Services</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data.services.map((service, index) => {
                            const isUpsell = service.status === "Not Purchased";

                            return (
                                <div key={index} className={`p-4 flex items-center justify-between ${isUpsell ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center
                                            ${isUpsell ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}
                                        `}>
                                            {isUpsell ? <Plus size={16} /> : <Check size={16} />}
                                        </div>
                                        <div>
                                            <div className={`font-medium ${isUpsell ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                {service.name}
                                            </div>
                                            {isUpsell && <div className="text-xs text-emerald-600 font-medium">Recommended Add-on</div>}
                                        </div>
                                    </div>

                                    {isUpsell ? (
                                        <button
                                            // Mock function for now
                                            onClick={() => window.alert(`Interested in ${service.name}? I'll add it to your plan!`)}
                                            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-xs font-semibold rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors shadow-sm"
                                        >
                                            Add +$50/mo
                                        </button>
                                    ) : (
                                        <span className="text-xs font-medium px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-md">
                                            Active
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Project Pipeline */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <ProjectBoard isAdmin={false} userName={data.contactName} projectId={data.id.toString()} />
            </div>
        </div>
    );
};

export default ClientDashboard;
