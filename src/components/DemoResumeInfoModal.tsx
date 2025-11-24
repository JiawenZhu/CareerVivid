import React, { useState, useEffect } from 'react';
import { X, Wand2, Loader2 } from 'lucide-react';

interface DemoResumeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (name: string, experience: string) => void;
  roleName: string;
  isLoading: boolean;
}

const getPlaceholderForRole = (role: string): string => {
    const lowerRole = role.toLowerCase();
    
    if (lowerRole.includes('product manager')) {
        return "e.g., With a background in business analysis, I'm passionate about user-centric design. I've led a small project team and want to transition into a full product management role.";
    }
    if (lowerRole.includes('nurse')) {
        return "e.g., I'm a newly licensed RN with clinical experience in a med-surg unit. I'm passionate about patient care and looking for my first full-time nursing position.";
    }
    if (lowerRole.includes('financial analyst')) {
        return "e.g., I have a degree in finance and experience with financial modeling and data analysis from my internship at a local firm. I'm proficient in Excel and seeking an entry-level analyst position.";
    }
    if (lowerRole.includes('designer')) {
        return "e.g., I'm a self-taught designer with a strong portfolio in branding and digital illustration. I'm proficient in the Adobe Creative Suite and looking for opportunities to grow in a creative agency.";
    }
    if (lowerRole.includes('marketing')) {
        return "e.g., I have 3 years of experience running social media campaigns and email marketing for a small e-commerce brand. I'm looking to take on a role with more strategic responsibility.";
    }
    // Default for software/tech roles
    if (lowerRole.includes('engineer') || lowerRole.includes('developer')) {
        return "e.g., I'm a recent computer science graduate with an internship in web development. I'm skilled in React and Node.js and want to find a full-stack role.";
    }
    
    // Generic fallback
    return "e.g., Describe your current experience, skills, and the type of role you're looking for. The more detail, the better your AI-generated resume will be!";
};


const DemoResumeInfoModal: React.FC<DemoResumeInfoModalProps> = ({ isOpen, onClose, onGenerate, roleName, isLoading }) => {
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [error, setError] = useState('');
  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setExperience('');
      setError('');
      setPlaceholder(getPlaceholderForRole(roleName));
    }
  }, [isOpen, roleName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!experience.trim()) {
      setError('Please provide some information about your experience.');
      return;
    }
    setError('');
    onGenerate(name, experience);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg shadow-xl relative">
        <button onClick={onClose} disabled={isLoading} className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
          <X size={20} />
        </button>
        <form onSubmit={handleSubmit}>
          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Personalize Your Resume</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Provide some details to help our AI create a resume tailored for a <strong className="text-primary-600 dark:text-primary-400">{roleName}</strong> role.</p>
          
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Doe"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Experience & Goals</label>
            <textarea
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder={placeholder}
              rows={5}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {isLoading ? 'Generating...' : 'Generate Resume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemoResumeInfoModal;