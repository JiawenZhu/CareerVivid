
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import InlineEdit from '../InlineEdit';

export const TimelineTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont, onFocus }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-8 bg-white text-gray-800" style={bodyStyle}>
      <header className="text-center mb-8">
        <div className="flex justify-center gap-2">
            <InlineEdit 
                value={personalDetails.firstName} 
                fieldId="personalDetails.firstName" 
                onFocus={onFocus} 
                className="text-4xl font-bold" 
                style={titleStyle}
                tagName="h1"
                placeholder="First Name"
            />
            <InlineEdit 
                value={personalDetails.lastName} 
                fieldId="personalDetails.lastName" 
                onFocus={onFocus} 
                className="text-4xl font-bold" 
                style={titleStyle}
                tagName="h1"
                placeholder="Last Name"
            />
        </div>
        <InlineEdit 
            value={personalDetails.jobTitle} 
            fieldId="personalDetails.jobTitle" 
            onFocus={onFocus} 
            className="text-xl text-gray-600 mt-1 block" 
            style={titleStyle}
            tagName="p"
            placeholder="Job Title"
        />
        <div className="text-sm mt-2 flex justify-center gap-1">
            <InlineEdit value={personalDetails.email} fieldId="personalDetails.email" onFocus={onFocus} placeholder="Email" />
            <span>|</span>
            <InlineEdit value={personalDetails.phone} fieldId="personalDetails.phone" onFocus={onFocus} placeholder="Phone" />
        </div>
        <InlineEdit 
            value={professionalSummary} 
            fieldId="professionalSummary" 
            onFocus={onFocus} 
            className="mt-4 text-md leading-relaxed max-w-2xl mx-auto block whitespace-pre-wrap"
            tagName="p"
            placeholder="Summary..."
        />
      </header>
      
      <main className="px-4">
        <div className="relative">
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-300 -ml-px"></div>