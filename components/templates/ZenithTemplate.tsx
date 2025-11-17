
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin } from 'lucide-react';

export const ZenithTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-8 bg-white text-gray-800" style={bodyStyle}>
      <header className="mb-6">
        <h1 className="text-4xl font-extrabold text-center" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <h2 className="text-xl text-center text-gray-600" style={titleStyle}>{personalDetails.jobTitle}</h2>
      </header>

      <div className="bg-gray-100 p-3 rounded-lg flex justify-center items-center gap-x-6 text-sm mb-6">
         {personalDetails.email && <div className="flex items-center"><Mail size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
         {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
         {personalDetails.address && <div className="flex items-center"><MapPin size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.address}</span></div>}
      </div>

      <main>
        <section className="mb-6">
          <h3 className="text-lg font-bold border-b-2 pb-1 mb-2" style={{...titleStyle, borderColor: themeColor}}>PROFILE</h3>
          <p className="text-sm leading-relaxed">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-bold border-b-2 pb-1 mb-3" style={{...titleStyle, borderColor: themeColor}}>EXPERIENCE</h3>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-4">
              <h4 className="text-md font-bold" style={titleStyle}>{job.jobTitle}</h4>
              <p className="text-sm text-gray-600 mb-1">{job.employer} | {job.startDate} - {job.endDate}</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-2 gap-6">
            <div>
                <h3 className="text-lg font-bold border-b-2 pb-1 mb-2" style={{...titleStyle, borderColor: themeColor}}>EDUCATION</h3>
                {education.map(edu => (
                    <div key={edu.id} className="mb-2">
                        <h4 className="text-md font-bold" style={titleStyle}>{edu.degree}</h4>
                        <p className="text-sm text-gray-600">{edu.school}</p>
                    </div>
                ))}
            </div>
            <div>
                <h3 className="text-lg font-bold border-b-2 pb-1 mb-2" style={{...titleStyle, borderColor: themeColor}}>SKILLS</h3>
                <p className="text-sm">{skills.map(s => s.name).join(' / ')}</p>
            </div>
        </section>
      </main>
    </div>
  );
};
