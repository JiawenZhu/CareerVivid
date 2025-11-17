
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

export const ModernTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-10 text-gray-800 bg-white" style={bodyStyle}>
      <header className="text-left mb-8">
        <h1 className="text-5xl font-bold text-gray-900" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <h2 className="text-2xl font-light mt-1" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</h2>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-4">
            {personalDetails.email && <span>{personalDetails.email}</span>}
            {personalDetails.phone && <span>&bull; {personalDetails.phone}</span>}
            {personalDetails.city && <span>&bull; {personalDetails.city}, {personalDetails.country}</span>}
            {websites.map(site => (
                <a key={site.id} href={site.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600" style={{ color: themeColor }}>
                    &bull; {site.label}
                </a>
            ))}
        </div>
      </header>
      
      <hr className="mb-6"/>

      <main>
        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase text-gray-500 tracking-widest mb-3" style={titleStyle}>Profile</h3>
          <p className="text-sm leading-relaxed">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase text-gray-500 tracking-widest mb-3" style={titleStyle}>Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill.id} className="inline-flex items-center bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">{skill.name}</span>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase text-gray-500 tracking-widest mb-4" style={titleStyle}>Experience</h3>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-5">
              <div className="flex justify-between items-baseline">
                <h4 className="text-md font-bold text-gray-800" style={titleStyle}>{job.jobTitle}</h4>
                <p className="text-xs font-medium text-gray-500">{job.startDate} - {job.endDate}</p>
              </div>
              <p className="text-sm italic text-gray-600 mb-1">{job.employer}, {job.city}</p>
              <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase text-gray-500 tracking-widest mb-4" style={titleStyle}>Education</h3>
          {education.map(edu => (
            <div key={edu.id} className="mb-4">
               <div className="flex justify-between items-baseline">
                    <h4 className="text-md font-bold text-gray-800" style={titleStyle}>{edu.degree}</h4>
                    <p className="text-xs font-medium text-gray-500">{edu.startDate} - {edu.endDate}</p>
                </div>
              <p className="text-sm italic text-gray-600">{edu.school}, {edu.city}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};
