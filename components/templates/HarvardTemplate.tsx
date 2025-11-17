
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const HarvardTemplate: React.FC<TemplateProps> = ({ resume, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  const Section: React.FC<{title: string; children: React.ReactNode;}> = ({title, children}) => (
    <section className="mb-4">
        <h2 className="text-sm font-bold border-b border-black pb-px mb-2" style={titleStyle}>{title.toUpperCase()}</h2>
        {children}
    </section>
  );

  return (
    <div className="p-8 bg-white text-black text-sm" style={bodyStyle}>
      <header className="text-center mb-4">
        <h1 className="text-3xl font-bold" style={titleStyle}>{personalDetails.firstName.toUpperCase()} {personalDetails.lastName.toUpperCase()}</h1>
        <p className="text-xs">{personalDetails.address} • {personalDetails.phone} • {personalDetails.email}</p>
      </header>

      <main>
        <Section title="Education">
          {education.map(edu => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between">
                <p className="font-bold">{edu.school}</p>
                <p className="font-bold">{edu.city}</p>
              </div>
              <div className="flex justify-between">
                <p className="italic">{edu.degree}</p>
                <p>{edu.startDate} - {edu.endDate}</p>
              </div>
              <p className="text-xs whitespace-pre-wrap">{edu.description}</p>
            </div>
          ))}
        </Section>
        
        <Section title="Experience">
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-3">
              <div className="flex justify-between">
                <p className="font-bold">{job.employer}</p>
                <p>{job.city}</p>
              </div>
              <div className="flex justify-between">
                <p className="italic">{job.jobTitle}</p>
                <p>{job.startDate} - {job.endDate}</p>
              </div>
              <ul className="list-disc pl-5 mt-1 text-xs">
                {job.description.split('\n').map((line, i) => line.trim() && <li key={i}>{line.replace(/^- /, '')}</li>)}
              </ul>
            </div>
          ))}
        </Section>

        <Section title="Skills">
           <p className="text-xs">{skills.map(skill => skill.name).join(', ')}</p>
        </Section>
      </main>
    </div>
  );
};
