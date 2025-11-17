
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const PinnacleTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="bg-white text-gray-800" style={bodyStyle}>
      <header className="p-8 border-b-4" style={{borderColor: themeColor}}>
        <h1 className="text-5xl font-bold" style={titleStyle}>{personalDetails.firstName.toUpperCase()}</h1>
        <h1 className="text-5xl font-bold" style={titleStyle}>{personalDetails.lastName.toUpperCase()}</h1>
        <p className="text-xl text-gray-600 mt-2" style={titleStyle}>{personalDetails.jobTitle}</p>
        <p className="text-sm text-gray-500 mt-2">{personalDetails.email} | {personalDetails.phone} | {personalDetails.address}</p>
      </header>

      <main className="p-8">
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{...titleStyle, color: themeColor}}>Professional Profile</h2>
          <p className="text-sm leading-relaxed">{professionalSummary}</p>
        </section>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{...titleStyle, color: themeColor}}>Work Experience</h2>
              {employmentHistory.map(job => (
                <div key={job.id} className="mb-4">
                  <h3 className="text-lg font-semibold" style={titleStyle}>{job.jobTitle}</h3>
                  <p className="text-md italic">{job.employer}</p>
                  <p className="text-xs text-gray-500">{job.startDate} - {job.endDate}</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{job.description}</p>
                </div>
              ))}
            </section>
          </div>
          <div>
            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{...titleStyle, color: themeColor}}>Skills</h2>
              <ul className="list-disc list-inside text-sm">
                {skills.map(skill => <li key={skill.id}>{skill.name}</li>)}
              </ul>
            </section>
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{...titleStyle, color: themeColor}}>Education</h2>
              {education.map(edu => (
                <div key={edu.id}>
                  <h3 className="text-lg font-semibold" style={titleStyle}>{edu.degree}</h3>
                  <p className="text-md italic">{edu.school}</p>
                  <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
