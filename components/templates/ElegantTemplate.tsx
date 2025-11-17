
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const ElegantTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  // Elegant template often looks best with specific serif fonts, so we use the selected ones.
  const titleStyle = { fontFamily: `'${titleFont}', serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', serif` };

  return (
    <div className="p-10 bg-white text-gray-800" style={bodyStyle}>
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-lg tracking-widest" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle.toUpperCase()}</p>
      </header>

      <div className="text-center text-sm text-gray-600 mb-8 pb-2 border-b-2 border-t-2 border-gray-300 py-3">
        {personalDetails.email} &nbsp;&bull;&nbsp; {personalDetails.phone} &nbsp;&bull;&nbsp; {personalDetails.address}
      </div>

      <main>
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-4" style={titleStyle}>Summary</h2>
          <p className="text-center text-lg leading-relaxed italic">{professionalSummary}</p>
        </section>
        
        <div className="w-24 h-px bg-gray-300 mx-auto my-10"></div>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-6" style={titleStyle}>Experience</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-6">
              <h3 className="text-xl font-bold" style={titleStyle}>{job.jobTitle}</h3>
              <div className="flex justify-between text-sm text-gray-600 italic mb-2">
                <span>{job.employer}, {job.city}</span>
                <span>{job.startDate} &ndash; {job.endDate}</span>
              </div>
              <p className="text-md leading-loose whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>

        <div className="w-24 h-px bg-gray-300 mx-auto my-10"></div>

        <section className="grid grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-center mb-6" style={titleStyle}>Education</h2>
            {education.map(edu => (
              <div key={edu.id} className="mb-4 text-center">
                <h3 className="text-xl font-bold" style={titleStyle}>{edu.school}</h3>
                <p className="text-md italic">{edu.degree}</p>
                <p className="text-sm text-gray-600">{edu.startDate} &ndash; {edu.endDate}</p>
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-center mb-6" style={titleStyle}>Skills</h2>
            <ul className="text-center columns-2">
              {skills.map(skill => (
                <li key={skill.id} className="mb-1">{skill.name}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};
