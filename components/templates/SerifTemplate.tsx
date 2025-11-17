
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const SerifTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', serif`, color: themeColor };
  const bodyStyle = { fontFamily: `'${bodyFont}', serif` };
  const headingStyle = { fontFamily: `'${titleFont}', serif` };

  return (
    <div className="p-10 bg-white text-gray-800" style={bodyStyle}>
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-center" style={headingStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-lg text-center text-gray-600" style={headingStyle}>{personalDetails.jobTitle}</p>
      </header>
      
      <p className="text-xs text-center border-t border-b py-2 mb-6">{personalDetails.email} | {personalDetails.phone} | {personalDetails.address}</p>

      <main>
        <section className="mb-6">
          <p className="text-center italic leading-relaxed">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-3 border-b pb-1" style={titleStyle}>Experience</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-4">
              <h3 className="text-xl font-semibold" style={headingStyle}>{job.jobTitle}</h3>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <p className="italic">{job.employer}, {job.city}</p>
                <p>{job.startDate} - {job.endDate}</p>
              </div>
              <p className="mt-1 leading-relaxed whitespace-pre-wrap text-sm">{job.description}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-2 gap-8">
            <div>
                <h2 className="text-2xl font-bold mb-3 border-b pb-1" style={titleStyle}>Education</h2>
                {education.map(edu => (
                    <div key={edu.id} className="mb-3">
                    <h3 className="text-xl font-semibold" style={headingStyle}>{edu.degree}</h3>
                    <p className="italic">{edu.school}</p>
                    <p className="text-sm text-gray-700">{edu.startDate} - {edu.endDate}</p>
                    </div>
                ))}
            </div>
             <div>
                <h2 className="text-2xl font-bold mb-3 border-b pb-1" style={titleStyle}>Skills</h2>
                <ul className="list-disc list-inside text-sm">
                    {skills.map(skill => <li key={skill.id}>{skill.name}</li>)}
                </ul>
            </div>
        </section>
      </main>
    </div>
  );
};
