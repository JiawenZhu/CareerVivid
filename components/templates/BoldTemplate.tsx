
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin } from 'lucide-react';

export const BoldTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="bg-white text-gray-800" style={bodyStyle}>
      <header className="bg-gray-900 text-white p-8 flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black uppercase" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
          <h2 className="text-2xl font-semibold" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</h2>
        </div>
        <div className="text-right text-sm space-y-1">
          {personalDetails.email && <div className="flex items-center justify-end"><span className="truncate max-w-[150px]">{personalDetails.email}</span><Mail size={14} className="ml-2 flex-shrink-0 transform translate-y-px" /></div>}
          {personalDetails.phone && <div className="flex items-center justify-end">{personalDetails.phone}<Phone size={14} className="ml-2 flex-shrink-0 transform translate-y-px" /></div>}
          {personalDetails.address && <div className="flex items-center justify-end">{personalDetails.address}<MapPin size={14} className="ml-2 flex-shrink-0 transform translate-y-px" /></div>}
        </div>
      </header>
      
      <div className="p-8">
        <main className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <section className="mb-6">
              <h3 className="text-lg font-extrabold uppercase tracking-wider mb-2" style={titleStyle}>Profile</h3>
              <p className="text-sm leading-relaxed">{professionalSummary}</p>
            </section>
            <section>
              <h3 className="text-lg font-extrabold uppercase tracking-wider mb-3" style={titleStyle}>Experience</h3>
              {employmentHistory.map(job => (
                <div key={job.id} className="mb-4">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-md font-bold" style={titleStyle}>{job.jobTitle}</h4>
                    <p className="text-xs text-gray-500 font-semibold">{job.startDate} - {job.endDate}</p>
                  </div>
                  <p className="text-sm italic text-gray-700">{job.employer}</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{job.description}</p>
                </div>
              ))}
            </section>
          </div>
          <div className="col-span-1">
            <section className="mb-6">
              <h3 className="text-lg font-extrabold uppercase tracking-wider mb-3" style={titleStyle}>Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <span key={skill.id} className="inline-flex items-center text-sm font-semibold text-white px-3 py-1" style={{ backgroundColor: themeColor }}>{skill.name}</span>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-lg font-extrabold uppercase tracking-wider mb-3" style={titleStyle}>Education</h3>
              {education.map(edu => (
                <div key={edu.id} className="mb-4">
                  <h4 className="text-md font-bold" style={titleStyle}>{edu.degree}</h4>
                  <p className="text-sm italic">{edu.school}</p>
                  <p className="text-xs text-gray-500 font-semibold">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};
