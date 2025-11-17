
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

export const SlateTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="flex min-h-full bg-white" style={bodyStyle}>
      <aside className="w-1/3 bg-slate-700 text-white p-8">
        {personalDetails.photo && (
          <div
            className="w-32 h-32 rounded-full mx-auto mb-6 bg-cover bg-center"
            style={{ backgroundImage: `url(${personalDetails.photo})` }}
          ></div>
        )}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b-2 pb-2 mb-4" style={{...titleStyle, borderColor: themeColor}}>CONTACT</h2>
          <div className="space-y-3 text-sm">
            {personalDetails.email && <div className="flex items-center"><Mail size={16} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
            {personalDetails.phone && <div className="flex items-center"><Phone size={16} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
            {websites.map(site => (
              <div key={site.id} className="flex items-center"><Globe size={16} className="mr-3 flex-shrink-0 transform translate-y-px" /><a href={site.url} className="hover:text-slate-300 break-all">{site.label}</a></div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-bold border-b-2 pb-2 mb-4" style={{...titleStyle, borderColor: themeColor}}>SKILLS</h2>
          <ul className="space-y-2 text-sm">
            {skills.map(skill => <li key={skill.id}>{skill.name}</li>)}
          </ul>
        </section>
      </aside>

      <main className="w-2/3 p-10">
        <header className="mb-10">
          <h1 className="text-5xl font-extrabold text-slate-800" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
          <p className="text-2xl font-light text-slate-600 mt-2" style={titleStyle}>{personalDetails.jobTitle}</p>
        </header>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 border-b-4 pb-2 mb-4" style={{...titleStyle, borderColor: themeColor}}>PROFILE</h2>
          <p className="text-sm leading-relaxed text-gray-700">{professionalSummary}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 border-b-4 pb-2 mb-4" style={{...titleStyle, borderColor: themeColor}}>EXPERIENCE</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-6">
              <h3 className="text-lg font-bold text-gray-900" style={titleStyle}>{job.jobTitle}</h3>
              <p className="text-md italic text-gray-700 mb-2">{job.employer} | {job.startDate} - {job.endDate}</p>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>
        
        <section>
          <h2 className="text-2xl font-bold text-slate-800 border-b-4 pb-2 mb-4" style={{...titleStyle, borderColor: themeColor}}>EDUCATION</h2>
          {education.map(edu => (
            <div key={edu.id} className="mb-4">
              <h3 className="font-bold text-lg" style={titleStyle}>{edu.degree}</h3>
              <p className="text-md italic text-gray-700">{edu.school}</p>
              <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};
