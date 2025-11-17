
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const ClassicTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-10 bg-white text-gray-900" style={bodyStyle}>
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-lg text-gray-700 mt-1" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</p>
        <p className="text-sm text-gray-600 mt-3">
          {personalDetails.address} | {personalDetails.phone} | {personalDetails.email}
        </p>
      </header>

      <div className="w-full h-px bg-gray-300 my-6"></div>

      <main>
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2" style={titleStyle}>Summary</h2>
          <p className="text-base leading-relaxed">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3" style={titleStyle}>Experience</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" style={titleStyle}>{job.jobTitle}</h3>
                <p className="text-sm text-gray-600 font-medium">{job.startDate} - {job.endDate}</p>
              </div>
              <p className="text-md italic text-gray-700">{job.employer}, {job.city}</p>
              <p className="text-sm mt-2 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3" style={titleStyle}>Education</h2>
          {education.map(edu => (
            <div key={edu.id} className="mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold" style={titleStyle}>{edu.degree}</h3>
                <p className="text-sm text-gray-600 font-medium">{edu.startDate} - {edu.endDate}</p>
              </div>
              <p className="text-md italic text-gray-700">{edu.school}, {edu.city}</p>
            </div>
          ))}
        </section>
        
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3" style={titleStyle}>Skills</h2>
          <p className="text-sm leading-relaxed">
            {skills.map(skill => skill.name).join(' • ')}
          </p>
        </section>
      </main>
    </div>
  );
};
