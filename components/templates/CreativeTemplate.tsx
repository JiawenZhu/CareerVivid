
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe, Star } from 'lucide-react';

export const CreativeTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="flex min-h-full bg-white" style={bodyStyle}>
      <aside className="w-1/3 text-white p-8 flex flex-col items-center text-center" style={{ backgroundColor: themeColor }}>
        {personalDetails.photo && (
          <div
            className="w-36 h-36 rounded-full mb-6 border-4 overflow-hidden flex items-center justify-center"
            style={{ borderColor: 'rgba(255,255,255,0.5)' }}
          >
            <img src={personalDetails.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-bold" style={titleStyle}>{personalDetails.firstName}</h1>
        <h1 className="text-3xl font-bold" style={titleStyle}>{personalDetails.lastName}</h1>
        <p className="text-lg font-light mt-2" style={{ ...titleStyle, color: 'rgba(255,255,255,0.8)' }}>{personalDetails.jobTitle}</p>
        
        <hr className="w-1/2 my-8" style={{ borderColor: 'rgba(255,255,255,0.5)' }} />

        <section className="text-left w-full">
          <h2 className="text-lg font-semibold tracking-widest uppercase mb-4" style={titleStyle}>Contact</h2>
          <div className="space-y-3 text-sm">
            {personalDetails.email && <div className="flex items-center"><Mail size={14} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
            {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
            {personalDetails.address && <div className="flex items-center"><MapPin size={14} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.address}</span></div>}
            {websites.map(site => (
              <div key={site.id} className="flex items-center">
                  {site.label.toLowerCase().includes('linkedin') ? <Linkedin size={14} className="mr-3 flex-shrink-0 transform translate-y-px" /> : <Globe size={14} className="mr-3 flex-shrink-0 transform translate-y-px" />}
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-300 break-all">{site.url}</a>
              </div>
            ))}
          </div>
        </section>
        
        <hr className="w-full my-8" style={{ borderColor: 'rgba(255,255,255,0.5)' }} />

        <section className="text-left w-full">
            <h2 className="text-lg font-semibold tracking-widest uppercase mb-4" style={titleStyle}>Skills</h2>
            <ul className="space-y-2">
                {skills.map(skill => (
                <li key={skill.id} className="text-sm font-medium">{skill.name}</li>
                ))}
            </ul>
        </section>
      </aside>

      <main className="w-2/3 p-10 text-gray-800">
        <section className="mb-8">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-3" style={{...titleStyle, color: themeColor}}>Profile</h2>
          <p className="text-sm leading-relaxed">{professionalSummary}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-4" style={{...titleStyle, color: themeColor}}>Experience</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-6">
              <div className="flex justify-between items-baseline">
                <h3 className="text-lg font-bold" style={titleStyle}>{job.jobTitle}</h3>
                <p className="text-sm font-medium text-gray-500">{job.startDate} - {job.endDate}</p>
              </div>
              <p className="text-md italic text-gray-600 mb-2">{job.employer}, {job.city}</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-widest mb-4" style={{...titleStyle, color: themeColor}}>Education</h2>
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
