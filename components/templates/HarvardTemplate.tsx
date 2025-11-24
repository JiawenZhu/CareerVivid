

import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import InlineEdit from '../InlineEdit';

export const HarvardTemplate: React.FC<TemplateProps> = ({ resume, titleFont, bodyFont, onFocus }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, sectionTitles } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  const Section: React.FC<{title: string; fieldId: string; children: React.ReactNode;}> = ({title, fieldId, children}) => (
    <section className="mb-4">
        <h2 className="text-sm font-bold border-b border-black pb-px mb-2" style={titleStyle}>
           <InlineEdit value={title.toUpperCase()} fieldId={`sectionTitles.${fieldId}`} onFocus={onFocus} />
        </h2>
        {children}
    </section>
  );

  return (
    <div className="p-8 bg-white text-black text-sm" style={bodyStyle}>
      <header className="text-center mb-4">
        <div className="flex justify-center gap-1">
            <InlineEdit 
                value={personalDetails.firstName.toUpperCase()} 
                fieldId="personalDetails.firstName" 
                onFocus={onFocus} 
                className="text-3xl font-bold" 
                style={titleStyle}
                tagName="h1"
                placeholder="FIRST NAME"
            />
            <InlineEdit 
                value={personalDetails.lastName.toUpperCase()} 
                fieldId="personalDetails.lastName" 
                onFocus={onFocus} 
                className="text-3xl font-bold" 
                style={titleStyle}
                tagName="h1"
                placeholder="LAST NAME"
            />
        </div>
        <div className="flex justify-center gap-1 text-xs">
            <InlineEdit value={personalDetails.address} fieldId="personalDetails.address" onFocus={onFocus} placeholder="Address" />
            <span>•</span>
            <InlineEdit value={personalDetails.phone} fieldId="personalDetails.phone" onFocus={onFocus} placeholder="Phone" />
            <span>•</span>
            <InlineEdit value={personalDetails.email} fieldId="personalDetails.email" onFocus={onFocus} placeholder="Email" />
        </div>
      </header>

      <main>
        <Section title={sectionTitles?.education || 'Education'} fieldId="education">
          {education.map((edu, index) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between">
                <InlineEdit value={edu.school} fieldId={`education[${index}].school`} onFocus={onFocus} placeholder="School" className="font-bold" />
                <InlineEdit value={edu.city} fieldId={`education[${index}].city`} onFocus={onFocus} placeholder="City" className="font-bold" />
              </div>
              <div className="flex justify-between">
                <InlineEdit value={edu.degree} fieldId={`education[${index}].degree`} onFocus={onFocus} placeholder="Degree" className="italic" />
                <div className="flex gap-1">
                    <InlineEdit value={edu.startDate} fieldId={`education[${index}].startDate`} onFocus={onFocus} placeholder="Start" />
                    <span>-</span>
                    <InlineEdit value={edu.endDate} fieldId={`education[${index}].endDate`} onFocus={onFocus} placeholder="End" />
                </div>
              </div>
              <InlineEdit 
                value={edu.description} 
                fieldId={`education[${index}].description`} 
                onFocus={onFocus} 
                className="text-xs whitespace-pre-wrap block"
                tagName="p"
                placeholder="Description..."
              />
            </div>
          ))}
        </Section>
        
        <Section title={sectionTitles?.experience || 'Experience'} fieldId="experience">
          {employmentHistory.map((job, index) => (
            <div key={job.id} className="mb-3">
              <div className="flex justify-between">
                <InlineEdit value={job.employer} fieldId={`employmentHistory[${index}].employer`} onFocus={onFocus} placeholder="Employer" className="font-bold" />
                <InlineEdit value={job.city} fieldId={`employmentHistory[${index}].city`} onFocus={onFocus} placeholder="City" />
              </div>
              <div className="flex justify-between">
                <InlineEdit value={job.jobTitle} fieldId={`employmentHistory[${index}].jobTitle`} onFocus={onFocus} placeholder="Job Title" className="italic" />
                <div className="flex gap-1">
                    <InlineEdit value={job.startDate} fieldId={`employmentHistory[${index}].startDate`} onFocus={onFocus} placeholder="Start" />
                    <span>-</span>
                    <InlineEdit value={job.endDate} fieldId={`employmentHistory[${index}].endDate`} onFocus={onFocus} placeholder="End" />
                </div>
              </div>
              <ul className="list-disc pl-5 mt-1 text-xs">
                <InlineEdit 
                    value={job.description} 
                    fieldId={`employmentHistory[${index}].description`} 
                    onFocus={onFocus} 
                    multiline
                    className="block"
                    placeholder="Description..."
                />
              </ul>
            </div>
          ))}
        </Section>

        <Section title={sectionTitles?.skills || 'Skills'} fieldId="skills">
           <div className="text-xs flex flex-wrap gap-1">
                {skills.map((skill, index) => (
                    <React.Fragment key={skill.id}>
                        <InlineEdit value={skill.name} fieldId={`skills[${index}].name`} onFocus={onFocus} placeholder="Skill" />
                        {index < skills.length - 1 && <span>,</span>}
                    </React.Fragment>
                ))}
           </div>
        </Section>
      </main>
    </div>
  );
};