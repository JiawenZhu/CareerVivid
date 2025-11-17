
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const AcademicTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-8 bg-white text-gray-900 leading-normal" style={bodyStyle}>
      <header className="text-center border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-lg" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</p>
        <div className="text-sm mt-2">
          {personalDetails.address} | {personalDetails.email} | {personalDetails.phone}
        </div>
      </header>

      <main>
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b mb-2 pb-1" style={titleStyle}>Summary</h2>
          <p className="text-sm">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b mb-2 pb-1" style={titleStyle}>Education</h2>
          {education.map(edu => (
            <div key={edu.id} className="text-sm mb-2">
              <div className="flex justify-between">
                <p><strong style={titleStyle}>{edu.school}</strong>, {edu.city}</p>
                <p>{edu.startDate} - {edu.endDate}</p>
              </div>
              <p><em>{edu.degree}</em></p>
              <p className="whitespace-pre-wrap">{edu.description}</p>
            </div>
          ))}
        </section>
        
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b mb-2 pb-1" style={titleStyle}>Research Experience</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="text-sm mb-2">
              <div className="flex justify-between">
                <p><strong style={titleStyle}>{job.employer}</strong>, {job.city}</p>
                <p>{job.startDate} - {job.endDate}</p>
              </div>
              <p><em>{job.jobTitle}</em></p>
              <p className="mt-1 whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>
        
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b mb-2 pb-1" style={titleStyle}>Skills</h2>
          <div className="text-sm">
            {skills.map(skill => (
                <div key={skill.id}><strong>{skill.name}:</strong> {skill.level}</div>
            ))}
          </div>
        </section>

        {/* This is a placeholder for sections common in academic CVs */}
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b mb-2 pb-1" style={titleStyle}>Publications</h2>
          <p className="text-sm italic text-gray-500">[This is a placeholder section. Add publications details in the employment/education description field.]</p>
        </section>
        
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest border-b mb-2 pb-1" style={titleStyle}>References</h2>
          <p className="text-sm italic text-gray-500">Available upon request.</p>
        </section>
      </main>
    </div>
  );
};
