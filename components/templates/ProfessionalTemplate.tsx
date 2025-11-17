
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

export const ProfessionalTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;
  
  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };
  const themeColorStyle = { color: themeColor };

  return (
    <div className="p-8 bg-white text-gray-800" style={bodyStyle}>
      <header className="flex items-center mb-8">
        {personalDetails.photo && (
          <div
            className="w-24 h-24 rounded-full mr-6 shrink-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${personalDetails.photo})` }}
          ></div>
        )}
        <div>
          <h1 className="text-4xl font-bold text-gray-900" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
          <h2 className="text-xl font-medium mt-1" style={{...titleStyle, ...themeColorStyle}}>{personalDetails.jobTitle}</h2>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <main className="col-span-8">
          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-3" style={titleStyle}>PROFESSIONAL SUMMARY</h3>
            <p className="text-sm leading-relaxed">{professionalSummary}</p>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-3" style={titleStyle}>WORK EXPERIENCE</h3>
            {employmentHistory.map(job => (
              <div key={job.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-md font-bold" style={titleStyle}>{job.jobTitle}</h4>
                  <p className="text-sm text-gray-500">{job.startDate} - {job.endDate}</p>
                </div>
                <p className="text-sm font-medium text-gray-700">{job.employer}, {job.city}</p>
                <p className="text-sm mt-2 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            ))}
          </section>
        </main>

        <aside className="col-span-4">
          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-3" style={titleStyle}>CONTACT</h3>
            <div className="space-y-2 text-sm">
                {personalDetails.email && <div className="flex items-center"><Mail size={14} className="mr-3 flex-shrink-0 transform translate-y-px" style={themeColorStyle} /><span>{personalDetails.email}</span></div>}
                {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-3 flex-shrink-0 transform translate-y-px" style={themeColorStyle} /><span>{personalDetails.phone}</span></div>}
                {personalDetails.address && <div className="flex items-center"><MapPin size={14} className="mr-3 flex-shrink-0 transform translate-y-px" style={themeColorStyle} /><span>{personalDetails.address}</span></div>}
                {websites.map(site => (
                    <div key={site.id} className="flex items-center">
                        {site.label.toLowerCase().includes('linkedin') ? <Linkedin size={14} className="mr-3 flex-shrink-0 transform translate-y-px" style={themeColorStyle} /> : <Globe size={14} className="mr-3 flex-shrink-0 transform translate-y-px" style={themeColorStyle} />}
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline break-all">{site.url}</a>
                    </div>
                ))}
            </div>
          </section>

          <section className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-3" style={titleStyle}>SKILLS</h3>
            <ul className="space-y-1">
              {skills.map(skill => (
                <li key={skill.id} className="text-sm bg-gray-100 rounded-md px-3 py-1 flex items-center">{skill.name}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-3" style={titleStyle}>EDUCATION</h3>
            {education.map(edu => (
              <div key={edu.id} className="mb-4">
                <h4 className="text-md font-bold" style={titleStyle}>{edu.degree}</h4>
                <p className="text-sm font-medium">{edu.school}</p>
                <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
};
