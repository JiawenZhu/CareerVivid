
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const MinimalistTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-12 bg-white text-gray-700" style={bodyStyle}>
      <header className="text-center mb-10">
        <h1 className="text-4xl font-light tracking-widest" style={titleStyle}>{personalDetails.firstName.toUpperCase()} {personalDetails.lastName.toUpperCase()}</h1>
        <p className="text-md mt-2" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</p>
      </header>

      <div className="text-center text-xs text-gray-500 mb-10">
        {personalDetails.email}
        <span className="mx-2">|</span>
        {personalDetails.phone}
        <span className="mx-2">|</span>
        {personalDetails.address}
        {websites.map(site => (
          <React.Fragment key={site.id}>
            <span className="mx-2">|</span>
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900" style={{color: themeColor}}>{site.label}</a>
          </React.Fragment>
        ))}
      </div>

      <main>
        <section className="mb-8">
          <p className="text-center leading-relaxed">{professionalSummary}</p>
        </section>

        <hr className="my-8" />

        <section className="mb-8">
          <h2 className="text-sm font-semibold tracking-widest text-gray-500 text-center mb-6" style={titleStyle}>EXPERIENCE</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="grid grid-cols-4 gap-4 mb-5">
              <div className="col-span-1 text-right">
                <p className="text-sm font-medium" style={titleStyle}>{job.employer}</p>
                <p className="text-xs text-gray-500">{job.startDate} - {job.endDate}</p>
              </div>
              <div className="col-span-3">
                <h3 className="text-lg font-medium" style={titleStyle}>{job.jobTitle}</h3>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>
          ))}
        </section>

        <hr className="my-8" />
        
        <section className="grid grid-cols-2 gap-8">
            <div>
                <h2 className="text-sm font-semibold tracking-widest text-gray-500 text-center mb-6" style={titleStyle}>EDUCATION</h2>
                 {education.map(edu => (
                    <div key={edu.id} className="text-center mb-4">
                        <h3 className="text-lg font-medium" style={titleStyle}>{edu.degree}</h3>
                        <p className="text-sm">{edu.school}</p>
                        <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p>
                    </div>
                ))}
            </div>
            <div>
                 <h2 className="text-sm font-semibold tracking-widest text-gray-500 text-center mb-6" style={titleStyle}>SKILLS</h2>
                 <div className="text-center">
                    {skills.map(skill => skill.name).join(' • ')}
                 </div>
            </div>
        </section>
      </main>
    </div>
  );
};
