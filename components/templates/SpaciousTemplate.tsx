
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const SpaciousTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-16 bg-white text-gray-800" style={bodyStyle}>
      <header className="mb-12">
        <h1 className="text-5xl font-bold mb-2" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <h2 className="text-2xl text-gray-500" style={titleStyle}>{personalDetails.jobTitle}</h2>
      </header>

      <main className="grid grid-cols-3 gap-16">
        <aside className="col-span-1">
          <section className="mb-10">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4" style={titleStyle}>Contact</h3>
            <div className="space-y-2">
              <p>{personalDetails.email}</p>
              <p>{personalDetails.phone}</p>
              <p>{personalDetails.address}</p>
              {websites.map(site => <a key={site.id} href={site.url} className="block hover:underline" style={{color: themeColor}}>{site.label}</a>)}
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4" style={titleStyle}>Skills</h3>
            <ul className="space-y-2">
              {skills.map(skill => <li key={skill.id}>{skill.name}</li>)}
            </ul>
          </section>
        </aside>

        <div className="col-span-2">
          <section className="mb-10">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4" style={titleStyle}>Profile</h3>
            <p className="leading-relaxed">{professionalSummary}</p>
          </section>
          <section className="mb-10">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4" style={titleStyle}>Experience</h3>
            {employmentHistory.map(job => (
              <div key={job.id} className="mb-6">
                <h4 className="text-xl font-bold" style={titleStyle}>{job.jobTitle}</h4>
                <p className="text-md text-gray-600 mb-2">{job.employer} | {job.startDate} - {job.endDate}</p>
                <p className="leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            ))}
          </section>
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4" style={titleStyle}>Education</h3>
            {education.map(edu => (
              <div key={edu.id}>
                <h4 className="text-xl font-bold" style={titleStyle}>{edu.degree}</h4>
                <p className="text-md text-gray-600">{edu.school} | {edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};
