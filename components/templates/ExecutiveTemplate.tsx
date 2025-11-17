
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="bg-white" style={bodyStyle}>
      <header className="bg-gray-800 text-white p-10 text-center">
        <h1 className="text-5xl font-extrabold tracking-wider" style={titleStyle}>{personalDetails.firstName.toUpperCase()} {personalDetails.lastName.toUpperCase()}</h1>
        <h2 className="text-xl font-light mt-2" style={{...titleStyle, color: themeColor }}>{personalDetails.jobTitle}</h2>
      </header>

      <div className="p-10">
        <div className="grid grid-cols-3 gap-10">
          <div className="col-span-2">
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b-4 pb-2" style={{...titleStyle, borderColor: themeColor}}>SUMMARY</h3>
              <p className="text-gray-700 leading-relaxed">{professionalSummary}</p>
            </section>

            <section className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b-4 pb-2" style={{...titleStyle, borderColor: themeColor}}>PROFESSIONAL EXPERIENCE</h3>
              {employmentHistory.map(job => (
                <div key={job.id} className="mb-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-semibold text-gray-900" style={titleStyle}>{job.jobTitle}</h4>
                    <p className="text-gray-600 font-medium">{job.startDate} - {job.endDate}</p>
                  </div>
                  <p className="text-lg italic text-gray-700">{job.employer} | {job.city}</p>
                  <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                </div>
              ))}
            </section>
          </div>

          <div className="col-span-1">
            <section className="bg-gray-100 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={titleStyle}>CONTACT DETAILS</h3>
              <div className="space-y-3 text-sm">
                {personalDetails.email && <div className="flex items-center"><Mail size={14} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
                {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
                {personalDetails.address && <div className="flex items-center"><MapPin size={14} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.address}</span></div>}
                {websites.map(site => (
                  <div key={site.id} className="flex items-center">
                    <Globe size={14} className="mr-3 flex-shrink-0 transform translate-y-px" />
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{site.label}</a>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gray-100 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={titleStyle}>KEY SKILLS</h3>
              <ul className="space-y-2">
                {skills.map(skill => (
                  <li key={skill.id} className="flex items-center">
                    <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: themeColor}}></span>
                    <span>{skill.name}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-gray-100 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={titleStyle}>EDUCATION</h3>
              {education.map(edu => (
                <div key={edu.id} className="mb-4">
                  <h4 className="font-semibold" style={titleStyle}>{edu.degree}</h4>
                  <p className="text-gray-700">{edu.school}</p>
                  <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
