import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { navigate } from '../utils/navigation';
import { Save, Eye, ArrowLeft, Plus, X } from 'lucide-react';
import { JobPosting, JobLocationType, JobEmploymentType } from '../types';
import { createJobPosting, updateJobPosting, getJobPosting, publishJobPosting } from '../services/jobService';
import Logo from '../components/Logo';

interface JobPostingEditorProps {
    jobId?: string; // If editing existing job
}

const JobPostingEditor: React.FC<JobPostingEditorProps> = ({ jobId }) => {
    const { currentUser, userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<JobPosting>>({
        companyName: '',
        jobTitle: '',
        department: '',
        location: '',
        locationType: 'remote',
        employmentType: 'full-time',
        description: '',
        responsibilities: [''],
        requirements: [''],
        niceToHave: [''],
        salaryMin: undefined,
        salaryMax: undefined,
        salaryCurrency: 'USD',
        benefits: [''],
        status: 'draft',
    });

    useEffect(() => {
        const hasBusinessRole = userProfile?.roles?.includes('business_partner') || userProfile?.role === 'business_partner';
        if (!currentUser || !hasBusinessRole) {
            navigate('/');
            return;
        }

        if (jobId) {
            loadJob();
        }
    }, [currentUser, userProfile, jobId]);

    const loadJob = async () => {
        if (!jobId) return;

        setLoading(true);
        try {
            const job = await getJobPosting(jobId);
            if (job) {
                setFormData(job);
            }
        } catch (error) {
            console.error('Error loading job:', error);
            alert('Failed to load job posting');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof JobPosting, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field: keyof JobPosting, index: number, value: string) => {
        const array = [...(formData[field] as string[] || [])];
        array[index] = value;
        setFormData(prev => ({ ...prev, [field]: array }));
    };

    const addArrayItem = (field: keyof JobPosting) => {
        const array = [...(formData[field] as string[] || []), ''];
        setFormData(prev => ({ ...prev, [field]: array }));
    };

    const removeArrayItem = (field: keyof JobPosting, index: number) => {
        const array = (formData[field] as string[] || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [field]: array }));
    };

    const handleSave = async (publish: boolean = false) => {
        if (!currentUser) return;

        // Validation
        if (!formData.jobTitle || !formData.companyName) {
            alert('Please fill in required fields: Job Title and Company Name');
            return;
        }

        setSaving(true);
        try {
            // Create base job data
            const baseJobData = {
                ...formData,
                hrUserId: currentUser.uid,
                // Mark this job as an internal business-partner listing.
                // This ensures the "Apply Now" button (not "Apply Externally") is shown
                // on the Job Market page and no false "Partner" badges appear on scraped jobs.
                isPartnerJob: true,
                source: 'internal' as const,
                // Filter out empty strings from arrays
                responsibilities: (formData.responsibilities || []).filter(r => r.trim()),
                requirements: (formData.requirements || []).filter(r => r.trim()),
                niceToHave: (formData.niceToHave || []).filter(n => n.trim()),
                benefits: (formData.benefits || []).filter(b => b.trim()),
            };

            // Remove undefined fields
            const jobData = Object.fromEntries(
                Object.entries(baseJobData).filter(([_, v]) => v !== undefined)
            );

            if (jobId) {
                // Update existing job
                await updateJobPosting(jobId, jobData);
                if (publish) {
                    await publishJobPosting(jobId);
                }
                alert('Job posting updated successfully!');
            } else {
                // Create new job
                const newJobId = await createJobPosting(jobData);
                if (publish) {
                    await publishJobPosting(newJobId);
                }
                alert('Job posting created successfully!');
                navigate('/business-partner/dashboard');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to save job posting: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/business-partner/dashboard')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <a href="/" className="flex items-center gap-2">
                                <Logo className="h-8 w-8" />
                                <span className="text-xl font-bold text-gray-900 dark:text-white">CareerVivid</span>
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                <Save size={16} />
                                {saving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                <Eye size={16} />
                                Publish
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                        {jobId ? 'Edit Job Posting' : 'Create New Job Posting'}
                    </h1>

                    {/* Basic Information */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => handleChange('companyName', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    placeholder="e.g., CareerVivid Inc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Job Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.jobTitle}
                                    onChange={(e) => handleChange('jobTitle', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    placeholder="e.g., Senior Software Engineer"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => handleChange('department', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="e.g., Engineering"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="e.g., San Francisco, CA"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Location Type
                                    </label>
                                    <select
                                        value={formData.locationType}
                                        onChange={(e) => handleChange('locationType', e.target.value as JobLocationType)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    >
                                        <option value="remote">Remote</option>
                                        <option value="hybrid">Hybrid</option>
                                        <option value="onsite">On-site</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Employment Type
                                    </label>
                                    <select
                                        value={formData.employmentType}
                                        onChange={(e) => handleChange('employmentType', e.target.value as JobEmploymentType)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    >
                                        <option value="full-time">Full-time</option>
                                        <option value="part-time">Part-time</option>
                                        <option value="contract">Contract</option>
                                        <option value="internship">Internship</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Job Description */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Description</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    placeholder="Provide a detailed description of the role..."
                                />
                            </div>

                            {/* Responsibilities */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Responsibilities
                                </label>
                                {(formData.responsibilities || ['']).map((resp, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={resp}
                                            onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            placeholder="e.g., Design and implement new features"
                                        />
                                        {(formData.responsibilities || []).length > 1 && (
                                            <button
                                                onClick={() => removeArrayItem('responsibilities', index)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => addArrayItem('responsibilities')}
                                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mt-2"
                                >
                                    <Plus size={16} />
                                    Add Responsibility
                                </button>
                            </div>

                            {/* Requirements */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Requirements
                                </label>
                                {(formData.requirements || ['']).map((req, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={req}
                                            onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            placeholder="e.g., 5+ years of experience in React"
                                        />
                                        {(formData.requirements || []).length > 1 && (
                                            <button
                                                onClick={() => removeArrayItem('requirements', index)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => addArrayItem('requirements')}
                                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mt-2"
                                >
                                    <Plus size={16} />
                                    Add Requirement
                                </button>
                            </div>

                            {/* Nice to Have */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nice to Have (Optional)
                                </label>
                                {(formData.niceToHave || ['']).map((nice, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={nice}
                                            onChange={(e) => handleArrayChange('niceToHave', index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            placeholder="e.g., Experience with TypeScript"
                                        />
                                        {(formData.niceToHave || []).length > 1 && (
                                            <button
                                                onClick={() => removeArrayItem('niceToHave', index)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => addArrayItem('niceToHave')}
                                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mt-2"
                                >
                                    <Plus size={16} />
                                    Add Nice to Have
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Compensation */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compensation & Benefits</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Salary Min (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.salaryMin || ''}
                                        onChange={(e) => handleChange('salaryMin', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="80000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Salary Max (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.salaryMax || ''}
                                        onChange={(e) => handleChange('salaryMax', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder="120000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Currency
                                    </label>
                                    <select
                                        value={formData.salaryCurrency}
                                        onChange={(e) => handleChange('salaryCurrency', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="CAD">CAD</option>
                                    </select>
                                </div>
                            </div>

                            {/* Benefits */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Benefits
                                </label>
                                {(formData.benefits || ['']).map((benefit, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={benefit}
                                            onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            placeholder="e.g., Health insurance, 401(k) matching"
                                        />
                                        {(formData.benefits || []).length > 1 && (
                                            <button
                                                onClick={() => removeArrayItem('benefits', index)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => addArrayItem('benefits')}
                                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mt-2"
                                >
                                    <Plus size={16} />
                                    Add Benefit
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default JobPostingEditor;
