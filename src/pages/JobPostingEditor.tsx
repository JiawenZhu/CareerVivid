import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const tEditor = (key: string, options?: Record<string, unknown>) => t(`job_posting_editor.${key}`, options);
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
            alert(tEditor('errors.failed_to_load'));
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
            alert(tEditor('errors.required_fields'));
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
                alert(tEditor('success.updated'));
            } else {
                // Create new job
                const newJobId = await createJobPosting(jobData);
                if (publish) {
                    await publishJobPosting(newJobId);
                }
                alert(tEditor('success.created'));
                navigate('/business-partner/dashboard');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            const errorMessage = error instanceof Error ? error.message : tEditor('errors.unknown_error');
            alert(tEditor('errors.failed_to_save', { errorMessage }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400">{tEditor('loading')}</div>
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
                            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-2">
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
                                {saving ? tEditor('actions.saving') : tEditor('actions.save_draft')}
                            </button>
                            <button
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                <Eye size={16} />
                                {tEditor('actions.publish')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                        {jobId ? tEditor('title.edit') : tEditor('title.create')}
                    </h1>

                    {/* Basic Information */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{tEditor('sections.basic_information')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {tEditor('fields.company_name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => handleChange('companyName', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    placeholder={tEditor('placeholders.company_name')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {tEditor('fields.job_title')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.jobTitle}
                                    onChange={(e) => handleChange('jobTitle', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    placeholder={tEditor('placeholders.job_title')}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {tEditor('fields.department')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => handleChange('department', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder={tEditor('placeholders.department')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {tEditor('fields.location')}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                        placeholder={tEditor('placeholders.location')}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {tEditor('fields.location_type')}
                                    </label>
                                    <select
                                        value={formData.locationType}
                                        onChange={(e) => handleChange('locationType', e.target.value as JobLocationType)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    >
                                        <option value="remote">{tEditor('options.location.remote')}</option>
                                        <option value="hybrid">{tEditor('options.location.hybrid')}</option>
                                        <option value="onsite">{tEditor('options.location.onsite')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {tEditor('fields.employment_type')}
                                    </label>
                                    <select
                                        value={formData.employmentType}
                                        onChange={(e) => handleChange('employmentType', e.target.value as JobEmploymentType)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    >
                                        <option value="full-time">{tEditor('options.employment.full_time')}</option>
                                        <option value="part-time">{tEditor('options.employment.part_time')}</option>
                                        <option value="contract">{tEditor('options.employment.contract')}</option>
                                        <option value="internship">{tEditor('options.employment.internship')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Job Description */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{tEditor('sections.job_description')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {tEditor('fields.description')}
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                    placeholder={tEditor('placeholders.description')}
                                />
                            </div>

                            {/* Responsibilities */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {tEditor('fields.responsibilities')}
                                </label>
                                {(formData.responsibilities || ['']).map((resp, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={resp}
                                            onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            placeholder={tEditor('placeholders.responsibility')}
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
                                    {tEditor('actions.add_responsibility')}
                                </button>
                            </div>

                            {/* Requirements */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {tEditor('fields.requirements')}
                                </label>
                                {(formData.requirements || ['']).map((req, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={req}
                                            onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            placeholder={tEditor('placeholders.requirement')}
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
                                    {tEditor('actions.add_requirement')}
                                </button>
                            </div>

                            {/* Nice to Have */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {tEditor('fields.nice_to_have')}
                                </label>
                                {(formData.niceToHave || ['']).map((nice, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={nice}
                                            onChange={(e) => handleArrayChange('niceToHave', index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            placeholder={tEditor('placeholders.nice_to_have')}
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
                                    {tEditor('actions.add_nice_to_have')}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Compensation */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{tEditor('sections.compensation_benefits')}</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {tEditor('fields.salary_min')}
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
                                        {tEditor('fields.salary_max')}
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
                                        {tEditor('fields.currency')}
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
                                    {tEditor('fields.benefits')}
                                </label>
                                {(formData.benefits || ['']).map((benefit, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={benefit}
                                            onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                            placeholder={tEditor('placeholders.benefit')}
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
                                    {tEditor('actions.add_benefit')}
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
