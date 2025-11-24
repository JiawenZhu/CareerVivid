

import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import InlineEdit from '../InlineEdit';

export const TimelineTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont, onFocus }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, sectionTitles } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  // Combine and sort employment and education for the timeline
  const timelineItems = [
    ...employmentHistory.map(item => ({ ...item, type: 'job' })),
    ...education.map(item => ({ ...item, type: 'edu' })),
  ].sort((a, b) => {
    // A proper sort would parse dates, but for this template, a simple string sort is okay
    return (b.endDate || '').localeCompare(a.endDate || '');
  });

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
          
          <h2 className="text-center text-lg font-bold uppercase tracking-widest bg-white px-4 relative z-10 mb-8 inline-block left-1/2 -translate-x-1/2" style={{...titleStyle, color: themeColor}}>
             <InlineEdit value={sectionTitles?.experienceAndEducation || 'Experience & Education'} fieldId="sectionTitles.experienceAndEducation" onFocus={onFocus} />
          </h2>

          {timelineItems.map((item, index) => {
            const isJob = item.type === 'job';
            const isLeft = index % 2 === 0;

            return (
              <div key={item.id} className={`flex ${isLeft ? 'flex-row-reverse' : ''} items-center w-full mb-8`}>
                <div className="w-5/12">
                  <div className={`${isLeft ? 'text-right' : 'text-left'}`}>
                    <div className="text-xs text-gray-500 flex gap-1" style={{justifyContent: isLeft ? 'flex-end' : 'flex-start'}}>
                        <InlineEdit value={item.startDate} fieldId={`${isJob ? 'employmentHistory' : 'education'}[${index}].startDate`} onFocus={onFocus} placeholder="Start" />
                        <span>-</span>
                        <InlineEdit value={item.endDate} fieldId={`${isJob ? 'employmentHistory' : 'education'}[${index}].endDate`} onFocus={onFocus} placeholder="End" />
                    </div>
                    <InlineEdit 
                        value={isJob ? (item as any).jobTitle : (item as any).degree} 
                        fieldId={`${isJob ? 'employmentHistory' : 'education'}[${index}].${isJob ? 'jobTitle' : 'degree'}`}
                        onFocus={onFocus}
                        className="text-lg font-semibold block"
                        style={titleStyle}
                        tagName="h3"
                        placeholder={isJob ? 'Job Title' : 'Degree'}
                    />
                    <InlineEdit 
                        value={isJob ? (item as any).employer : (item as any).school} 
                        fieldId={`${isJob ? 'employmentHistory' : 'education'}[${index}].${isJob ? 'employer' : 'school'}`}
                        onFocus={onFocus}
                        className="text-sm italic text-gray-700 block"
                        tagName="p"
                        placeholder={isJob ? 'Employer' : 'School'}
                    />
                    <InlineEdit 
                        value={item.description}
                        fieldId={`${isJob ? 'employmentHistory' : 'education'}[${index}].description`}
                        onFocus={onFocus}
                        className="text-sm mt-1 whitespace-pre-wrap block"
                        tagName="p"
                        placeholder="Description..."
                    />
                  </div>
                </div>
                <div className="w-2/12 flex justify-center">
                    <div className="w-4 h-4 rounded-full border-4 border-white ring-4 ring-gray-300 z-10" style={{backgroundColor: themeColor}}></div>
                </div>
                <div className="w-5/12"></div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};