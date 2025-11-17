
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const SimpleTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif`, color: themeColor };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-8 bg-white text-gray-800" style={bodyStyle}>
      <header className="mb-6">
        <h1 className="text-3xl font-bold" style={{fontFamily: `'${titleFont}', sans-serif`}}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-md text-gray-600">{personalDetails.jobTitle}</p>
        <p className="text-sm text-gray-500 mt-2">
          {personalDetails.email} | {personalDetails.phone} | {personalDetails.address}
        </p>
      </header>

      <main>
        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-1 mb-2" style={titleStyle}>Summary</h2>
          <p className="text-sm leading-relaxed">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-1 mb-2" style={titleStyle}>Work Experience</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-4">
              <h3 className="text-lg font-bold" style={{fontFamily: `'${titleFont}', sans-serif`}}>{job.jobTitle}</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{job.employer}, {job.city}</span>
                <span>{job.startDate} - {job.endDate}</span>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold border-b pb-1 mb-2" style={titleStyle}>Education</h2>
          {education.map(edu => (
            <div key={edu.id} className="mb-3">
              <h3 className="text-lg font-bold" style={{fontFamily: `'${titleFont}', sans-serif`}}>{edu.degree}</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{edu.school}, {edu.city}</span>
                <span>{edu.startDate} - {edu.endDate}</span>
              </div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-xl font-semibold border-b pb-1 mb-2" style={titleStyle}>Skills</h2>
          <p className="text-sm">
            {skills.map(skill => skill.name).join(', ')}
          </p>
        </section>
      </main>
    </div>
  );
};
