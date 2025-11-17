
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const SwissTemplate: React.FC<TemplateProps> = ({ resume, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', 'Helvetica Neue', Helvetica, Arial, sans-serif` };

  return (
    <div className="p-10 bg-white text-gray-900" style={bodyStyle}>
      <header className="mb-8">
        <h1 className="text-6xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-xl" style={titleStyle}>{personalDetails.jobTitle}</p>
      </header>

      <main className="grid grid-cols-12 gap-x-8 text-sm">
        <aside className="col-span-4">
          <section className="mb-6">
            <h2 className="font-bold mb-2" style={titleStyle}>Contact</h2>
            <p>{personalDetails.email}</p>
            <p>{personalDetails.phone}</p>
            <p>{personalDetails.address}</p>
          </section>
           <section className="mb-6">
            <h2 className="font-bold mb-2" style={titleStyle}>Skills</h2>
            {skills.map(skill => <p key={skill.id}>{skill.name}</p>)}
          </section>
          <section>
            <h2 className="font-bold mb-2" style={titleStyle}>Education</h2>
            {education.map(edu => (
              <div key={edu.id}>
                <p className="font-semibold">{edu.degree}</p>
                <p>{edu.school}</p>
                <p className="text-xs">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </section>
        </aside>

        <div className="col-span-8">
          <section className="mb-6">
            <p className="leading-relaxed">{professionalSummary}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3" style={titleStyle}>Experience</h2>
            {employmentHistory.map(job => (
              <div key={job.id} className="grid grid-cols-4 gap-x-4 mb-4">
                <div className="col-span-1 text-xs">
                  <p>{job.startDate} -</p>
                  <p>{job.endDate}</p>
                </div>
                <div className="col-span-3">
                  <h3 className="font-bold" style={titleStyle}>{job.jobTitle}</h3>
                  <p className="font-semibold">{job.employer}</p>
                  <p className="mt-1 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};
