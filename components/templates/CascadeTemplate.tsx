
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const CascadeTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="bg-white text-gray-800" style={bodyStyle}>
      <header className="p-8 bg-gray-100 text-center">
        <h1 className="text-4xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-xl" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</p>
        <p className="text-sm text-gray-500 mt-2">{personalDetails.email} | {personalDetails.phone}</p>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8">
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3" style={titleStyle}>Summary</h2>
              <p className="text-sm leading-relaxed">{professionalSummary}</p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold mb-3" style={titleStyle}>Experience</h2>
              {employmentHistory.map(job => (
                <div key={job.id} className="mb-4">
                  <h3 className="text-lg font-bold" style={titleStyle}>{job.jobTitle}</h3>
                  <p className="text-md italic text-gray-700">{job.employer} | {job.startDate} - {job.endDate}</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{job.description}</p>
                </div>
              ))}
            </section>
          </div>
          <aside className="col-span-4">
            <section className="bg-gray-100 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2" style={titleStyle}>Skills</h2>
              <ul className="space-y-1 text-sm">
                {skills.map(skill => <li key={skill.id}>{skill.name}</li>)}
              </ul>
            </section>
            <section className="bg-gray-100 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2" style={titleStyle}>Education</h2>
              {education.map(edu => (
                <div key={edu.id} className="text-sm">
                  <h3 className="font-bold" style={titleStyle}>{edu.degree}</h3>
                  <p>{edu.school}</p>
                  <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};
