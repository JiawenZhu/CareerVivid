
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const MonochromeTemplate: React.FC<TemplateProps> = ({ resume, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-8 bg-white text-black" style={bodyStyle}>
      <header className="text-center mb-8 pb-4 border-b-4 border-black">
        <h1 className="text-5xl font-extrabold tracking-tighter" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-lg font-medium tracking-widest text-gray-600 mt-1" style={titleStyle}>{personalDetails.jobTitle.toUpperCase()}</p>
      </header>

      <main className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <section className="mb-6">
            <h2 className="text-xl font-bold tracking-wider mb-3" style={titleStyle}>PROFILE</h2>
            <p className="text-sm leading-relaxed">{professionalSummary}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-wider mb-3" style={titleStyle}>EXPERIENCE</h2>
            {employmentHistory.map(job => (
              <div key={job.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-lg font-bold" style={titleStyle}>{job.jobTitle}</h3>
                  <p className="text-xs font-semibold text-gray-600">{job.startDate} - {job.endDate}</p>
                </div>
                <p className="text-md font-medium text-gray-700">{job.employer}</p>
                <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            ))}
          </section>
        </div>

        <aside className="col-span-1 pl-8 border-l-2 border-gray-200">
          <section className="mb-6">
            <h2 className="text-xl font-bold tracking-wider mb-3" style={titleStyle}>CONTACT</h2>
            <div className="text-sm space-y-1">
              <p>{personalDetails.email}</p>
              <p>{personalDetails.phone}</p>
              <p>{personalDetails.address}</p>
              {websites.map(site => (
                <a key={site.id} href={site.url} className="block hover:underline">{site.label}</a>
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-bold tracking-wider mb-3" style={titleStyle}>SKILLS</h2>
            <ul className="text-sm space-y-1">
              {skills.map(skill => (
                <li key={skill.id}>{skill.name}</li>
              ))}
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold tracking-wider mb-3" style={titleStyle}>EDUCATION</h2>
            {education.map(edu => (
              <div key={edu.id} className="mb-4">
                <h3 className="text-lg font-bold" style={titleStyle}>{edu.degree}</h3>
                <p className="text-md font-medium">{edu.school}</p>
                <p className="text-xs font-semibold text-gray-600">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </section>
        </aside>
      </main>
    </div>
  );
};
