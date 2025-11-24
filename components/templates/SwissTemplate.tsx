import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import InlineEdit from '../InlineEdit';

export const SwissTemplate: React.FC<TemplateProps> = ({ resume, titleFont, bodyFont, onFocus, themeColor }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, sectionTitles } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', 'Helvetica Neue', Helvetica, Arial, sans-serif` };

  return (
    <div className="p-10 bg-white text-gray-900" style={bodyStyle}>
      <header className="mb-8">
        <div className="flex gap-3">
            <InlineEdit 
                value={personalDetails.firstName} 
                fieldId="personalDetails.firstName" 
                onFocus={onFocus} 
                className="text-6xl font-bold" 
                style={titleStyle}
                tagName="h1"
                placeholder="First Name"
            />
            <InlineEdit 
                value={personalDetails.lastName} 
                fieldId="personalDetails.lastName" 
                onFocus={onFocus} 
                className="text-6xl font-bold" 
                style={titleStyle}
                tagName="h1"
                placeholder="Last Name"
            />
        </div>
        <InlineEdit 
            value={personalDetails.jobTitle} 
            fieldId="personalDetails.jobTitle" 
            onFocus={onFocus} 
            className="text-xl block" 
            style={titleStyle}
            tagName="p"
            placeholder="Job Title"
        />
      </header>

      <main className="grid grid-cols-12 gap-x-8 text-sm">
        <aside className="col-span-4">
          <section className="mb-6">
            <InlineEdit 
                value={sectionTitles?.contact || 'Contact'} 
                fieldId="sectionTitles.contact" 
                onFocus={onFocus} 
                className="font-bold mb-2 block" 
                tagName="h2" 
                style={titleStyle}
            />
            <InlineEdit value={personalDetails.email} fieldId="personalDetails.email" onFocus={onFocus} placeholder="Email" className="block" />
            <InlineEdit value={personalDetails.phone} fieldId="personalDetails.phone" onFocus={onFocus} placeholder="Phone" className="block" />
            <InlineEdit value={personalDetails.address} fieldId="personalDetails.address" onFocus={onFocus} placeholder="Address" className="block" />
          </section>
           <section className="mb-6">
            <InlineEdit 
                value={sectionTitles?.skills || 'Skills'}
                fieldId="sectionTitles.skills" 
                onFocus={onFocus} 
                className="font-bold mb-2 block" 
                tagName="h2" 
                style={titleStyle}
            />
            {skills.map((skill, index) => (
                <InlineEdit key={skill.id} value={skill.name} fieldId={`skills[${index}].name`} onFocus={onFocus} placeholder="Skill" className="block" />
            ))}
          </section>
          <section>
            <InlineEdit 
                value={sectionTitles?.education || 'Education'}
                fieldId="sectionTitles.education" 
                onFocus={onFocus} 
                className="font-bold mb-2 block" 
                tagName="h2" 
                style={titleStyle}
            />
            {education.map((edu, index) => (
              <div key={edu.id}>
                <InlineEdit 
                    value={edu.degree} 
                    fieldId={`education[${index}].degree`} 
                    onFocus={onFocus} 
                    className="font-semibold block" 
                    tagName="p"
                    placeholder="Degree"
                />
                <InlineEdit 
                    value={edu.school} 
                    fieldId={`education[${index}].school`} 
                    onFocus={onFocus} 
                    className="block" 
                    tagName="p"
                    placeholder="School"
                />
                <div className="flex gap-1 text-xs">
                    <InlineEdit value={edu.startDate} fieldId={`education[${index}].startDate`} onFocus={onFocus} placeholder="Start" />
                    <span>-</span>
                    <InlineEdit value={edu.endDate} fieldId={`education[${index}].endDate`} onFocus={onFocus} placeholder="End" />
                </div>
              </div>
            ))}
          </section>
        </aside>

        <div className="col-span-8">
          <section className="mb-6">
            <InlineEdit 
                value={professionalSummary} 
                fieldId="professionalSummary" 
                onFocus={onFocus} 
                className="leading-relaxed block whitespace-pre-wrap"
                tagName="p"
                placeholder="Summary..."
            />
          </section>
          <section>
            <InlineEdit 
                value={sectionTitles?.experience || 'Experience'}
                fieldId="sectionTitles.experience" 
                onFocus={onFocus} 
                className="text-xl font-bold mb-3 block" 
                tagName="h2" 
                style={titleStyle}
            />
            {employmentHistory.map((job, index) => (
              <div key={job.id} className="grid grid-cols-4 gap-x-4 mb-4">
                <div className="col-span-1 text-xs flex flex-col">
                  <InlineEdit value={job.startDate} fieldId={`employmentHistory[${index}].startDate`} onFocus={onFocus} placeholder="Start" />
                  <span>-</span>
                  <InlineEdit value={job.endDate} fieldId={`employmentHistory[${index}].endDate`} onFocus={onFocus} placeholder="End" />
                </div>
                <div className="col-span-3">
                  <InlineEdit 
                    value={job.jobTitle} 
                    fieldId={`employmentHistory[${index}].jobTitle`} 
                    onFocus={onFocus} 
                    className="font-bold block" 
                    style={titleStyle}
                    tagName="h3"
                    placeholder="Job Title"
                  />
                  <InlineEdit 
                    value={job.employer} 
                    fieldId={`employmentHistory[${index}].employer`} 
                    onFocus={onFocus} 
                    className="font-semibold block" 
                    tagName="p"
                    placeholder="Employer"
                  />
                  <InlineEdit 
                    value={job.description} 
                    fieldId={`employmentHistory[${index}].description`} 
                    onFocus={onFocus} 
                    className="mt-1 leading-relaxed whitespace-pre-wrap block"
                    tagName="p"
                    placeholder="Description..."
                  />
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};
