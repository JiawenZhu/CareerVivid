
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe, GitBranch, Code } from 'lucide-react';

export const TechnicalTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-8 bg-white text-gray-800" style={bodyStyle}>
      <style>{`
        .font-mono-special { font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace; }
      `}</style>
      <header className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
        <div>
          <h1 className="text-4xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
          <h2 className="text-xl font-mono-special" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</h2>
        </div>
        <div className="text-right text-xs space-y-1">
          {personalDetails.email && <div className="flex items-center justify-end"><span className="truncate max-w-[150px]">{personalDetails.email}</span><Mail size={12} className="ml-2 flex-shrink-0 transform translate-y-px" /></div>}
          {personalDetails.phone && <div className="flex items-center justify-end">{personalDetails.phone}<Phone size={12} className="ml-2 flex-shrink-0 transform translate-y-px" /></div>}
          {personalDetails.address && <div className="flex items-center justify-end">{personalDetails.address}<MapPin size={12} className="ml-2 flex-shrink-0 transform translate-y-px" /></div>}
          {websites.map(site => (
            <div key={site.id} className="flex items-center justify-end">
              <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{site.label}</a>
              <Globe size={12} className="ml-2 flex-shrink-0 transform translate-y-px" />
            </div>
          ))}
        </div>
      </header>

      <main className="mt-6">
        <section className="mb-6">
          <h3 className="text-lg font-mono-special text-gray-800 mb-2" style={titleStyle}>// SUMMARY</h3>
          <p className="text-sm leading-relaxed">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-mono-special text-gray-800 mb-2" style={titleStyle}>// SKILLS</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {skills.map(skill => (
              <div key={skill.id} className="flex items-center">
                <Code size={14} className="mr-2" style={{color: themeColor}}/>
                <span className="text-sm font-medium">{skill.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-mono-special text-gray-800 mb-2" style={titleStyle}>// EXPERIENCE</h3>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h4 className="text-md font-bold" style={titleStyle}>{job.jobTitle} @ {job.employer}</h4>
                <p className="text-xs text-gray-500 font-mono-special">{job.startDate} -> {job.endDate}</p>
              </div>
              <ul className="list-disc list-inside mt-2 pl-4">
                {job.description.split('\n').map((line, i) => line.trim() && <li key={i} className="text-sm leading-relaxed">{line.replace(/^- /, '')}</li>)}
              </ul>
            </div>
          ))}
        </section>

        <section>
          <h3 className="text-lg font-mono-special text-gray-800 mb-2" style={titleStyle}>// EDUCATION</h3>
          {education.map(edu => (
            <div key={edu.id} className="mb-2">
               <div className="flex justify-between items-baseline">
                <h4 className="text-md font-bold" style={titleStyle}>{edu.degree}</h4>
                <p className="text-xs text-gray-500 font-mono-special">{edu.startDate} -> {edu.endDate}</p>
              </div>
              <p className="text-sm">{edu.school}, {edu.city}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};
