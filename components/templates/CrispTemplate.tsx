
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const CrispTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };
  
  return (
    <div className="p-8 bg-white text-gray-900" style={bodyStyle}>
      <header className="mb-6 pb-4 border-b-2 border-gray-800">
        <h1 className="text-4xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</h2>
            <p className="text-sm text-gray-600">{personalDetails.email} / {personalDetails.phone}</p>
        </div>
      </header>

      <main>
        <section className="mb-5">
          <h3 className="text-md font-bold uppercase text-gray-500 tracking-wider mb-2" style={titleStyle}>Summary</h3>
          <p className="text-sm leading-normal">{professionalSummary}</p>
        </section>
        
        <section className="mb-5">
          <h3 className="text-md font-bold uppercase text-gray-500 tracking-wider mb-2" style={titleStyle}>Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill.id} className="inline-flex items-center bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">{skill.name}</span>
            ))}
          </div>
        </section>

        <section className="mb-5">
          <h3 className="text-md font-bold uppercase text-gray-500 tracking-wider mb-3" style={titleStyle}>Work History</h3>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <div>
                    <h4 className="text-lg font-semibold" style={titleStyle}>{job.jobTitle}</h4>
                    <p className="text-sm text-gray-700">{job.employer}, {job.city}</p>
                </div>
                <p className="text-xs font-medium text-gray-500">{job.startDate} - {job.endDate}</p>
              </div>
              <p className="text-sm mt-1 leading-normal whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>

        <section>
          <h3 className="text-md font-bold uppercase text-gray-500 tracking-wider mb-3" style={titleStyle}>Education</h3>
          {education.map(edu => (
            <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                    <h4 className="text-lg font-semibold" style={titleStyle}>{edu.degree}</h4>
                    <p className="text-sm text-gray-700">{edu.school}, {edu.city}</p>
                </div>
                <p className="text-xs font-medium text-gray-500">{edu.startDate} - {edu.endDate}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};
