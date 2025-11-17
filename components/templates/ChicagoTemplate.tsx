
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

export const ChicagoTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };
  const themeColorStyle = { color: themeColor };

  return (
    <div className="p-10 text-gray-800 bg-white" style={bodyStyle}>
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold tracking-widest uppercase" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <h2 className="text-xl font-light tracking-wider text-gray-600 mt-2" style={{...titleStyle, ...themeColorStyle}}>{personalDetails.jobTitle}</h2>
      </header>

      <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-6 border-y-2 border-gray-800 py-2">
        {personalDetails.email && <div className="flex items-center"><Mail size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
        {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
        {personalDetails.city && <div className="flex items-center"><MapPin size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.city}, {personalDetails.country}</span></div>}
        {websites.map(site => (
            <div key={site.id} className="flex items-center">
                {site.label.toLowerCase().includes('linkedin') ? <Linkedin size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /> : <Globe size={14} className="mr-2 flex-shrink-0 transform translate-y-px" />}
                <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{site.url}</a>
            </div>
        ))}
      </div>

      <main className="grid grid-cols-3 gap-10">
        <div className="col-span-2">
          <section className="mb-8">
            <h3 className="text-sm font-bold border-b-2 border-gray-300 pb-1 mb-3 tracking-widest" style={titleStyle}>PROFESSIONAL SUMMARY</h3>
            <p className="text-sm leading-relaxed">{professionalSummary}</p>
          </section>

          <section>
            <h3 className="text-sm font-bold border-b-2 border-gray-300 pb-1 mb-3 tracking-widest" style={titleStyle}>WORK EXPERIENCE</h3>
            {employmentHistory.map(job => (
              <div key={job.id} className="mb-5">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-lg font-semibold" style={titleStyle}>{job.jobTitle}</h4>
                  <p className="text-xs text-gray-500 font-medium">{job.startDate} - {job.endDate}</p>
                </div>
                <p className="text-sm italic text-gray-700">{job.employer}, {job.city}</p>
                <p className="text-sm mt-2 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            ))}
          </section>
        </div>

        <div className="col-span-1 pl-6 border-l border-gray-200">
          <section className="mb-8">
            <h3 className="text-sm font-bold border-b-2 border-gray-300 pb-1 mb-3 tracking-widest" style={titleStyle}>SKILLS</h3>
            <ul className="list-none space-y-1">
              {skills.map(skill => (
                <li key={skill.id} className="text-sm">{skill.name}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold border-b-2 border-gray-300 pb-1 mb-3 tracking-widest" style={titleStyle}>EDUCATION</h3>
            {education.map(edu => (
              <div key={edu.id} className="mb-4">
                <h4 className="text-lg font-semibold" style={titleStyle}>{edu.degree}</h4>
                <p className="text-sm italic">{edu.school}</p>
                <p className="text-xs text-gray-500 mt-1">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};
