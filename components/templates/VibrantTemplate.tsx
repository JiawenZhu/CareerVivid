
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe, Star } from 'lucide-react';

export const VibrantTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="flex min-h-full bg-white" style={bodyStyle}>
      <aside className="w-1/3 text-white p-8" style={{backgroundColor: themeColor}}>
        {personalDetails.photo && (
          <div className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white overflow-hidden flex items-center justify-center">
            <img src={personalDetails.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-center" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-md text-center mt-1" style={{color: 'rgba(255,255,255,0.8)'}}>{personalDetails.jobTitle}</p>
        
        <hr className="my-6" style={{borderColor: 'rgba(255,255,255,0.3)'}} />

        <section className="mb-6">
          <h2 className="text-lg font-semibold uppercase tracking-wider mb-3" style={titleStyle}>Contact</h2>
          <div className="space-y-2 text-sm">
            {personalDetails.email && <div className="flex items-center break-all"><Mail size={14} className="mr-3 shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
            {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-3 shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold uppercase tracking-wider mb-3" style={titleStyle}>Skills</h2>
          <ul className="space-y-1">
            {skills.map(skill => (
              <li key={skill.id} className="text-sm">{skill.name}</li>
            ))}
          </ul>
        </section>
      </aside>

      <main className="w-2/3 p-8">
        <section className="mb-6">
          <h2 className="text-2xl font-bold border-b-2 pb-2 mb-3" style={{...titleStyle, color: themeColor, borderColor: `${themeColor}40`}}>Summary</h2>
          <p className="text-sm leading-relaxed text-gray-700">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold border-b-2 pb-2 mb-3" style={{...titleStyle, color: themeColor, borderColor: `${themeColor}40`}}>Experience</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="text-lg font-bold text-gray-800" style={titleStyle}>{job.jobTitle}</h3>
                <p className="text-sm font-medium text-gray-500">{job.startDate} - {job.endDate}</p>
              </div>
              <p className="text-md italic text-gray-600">{job.employer}</p>
              <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>
        
        <section>
          <h2 className="text-2xl font-bold border-b-2 pb-2 mb-3" style={{...titleStyle, color: themeColor, borderColor: `${themeColor}40`}}>Education</h2>
          {education.map(edu => (
            <div key={edu.id} className="mb-4">
              <h3 className="font-bold text-lg" style={titleStyle}>{edu.degree}</h3>
              <p className="text-md italic text-gray-600">{edu.school}</p>
              <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};
