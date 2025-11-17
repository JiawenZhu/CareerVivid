
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

export const SydneyTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="flex min-h-full bg-white" style={bodyStyle}>
      <aside className="w-1/3 bg-gray-800 text-white p-8">
        {personalDetails.photo && (
          <div
            className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-gray-600 bg-cover bg-center"
            style={{ backgroundImage: `url(${personalDetails.photo})` }}
          ></div>
        )}
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b-2 pb-2 mb-4" style={{...titleStyle, borderColor: themeColor }}>CONTACT</h2>
          <div className="space-y-3 text-sm">
            {personalDetails.email && <div className="flex items-center"><Mail size={16} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
            {personalDetails.phone && <div className="flex items-center"><Phone size={16} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
            {personalDetails.address && <div className="flex items-center"><MapPin size={16} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.address}, {personalDetails.city}</span></div>}
            {websites.map(site => (
              <div key={site.id} className="flex items-center">
                  {site.label.toLowerCase().includes('linkedin') ? <Linkedin size={16} className="mr-3 flex-shrink-0 transform translate-y-px" /> : <Globe size={16} className="mr-3 flex-shrink-0 transform translate-y-px" />}
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 break-all" style={{color: themeColor}}>{site.url}</a>
              </div>
            ))}
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-bold border-b-2 pb-2 mb-4" style={{...titleStyle, borderColor: themeColor}}>SKILLS</h2>
          <ul className="space-y-2">
            {skills.map(skill => (
              <li key={skill.id}>
                <p className="text-sm font-medium">{skill.name}</p>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                  <div className="h-2 rounded-full" style={{ width: `${{ Novice: '25%', Intermediate: '50%', Advanced: '75%', Expert: '100%' }[skill.level]}`, backgroundColor: themeColor }}></div>
                </div>
              </li>
            ))}
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-bold border-b-2 pb-2 mb-4" style={{...titleStyle, borderColor: themeColor}}>EDUCATION</h2>
          {education.map(edu => (
            <div key={edu.id} className="mb-4 text-sm">
              <h3 className="font-bold" style={titleStyle}>{edu.degree}</h3>
              <p className="text-gray-300">{edu.school}</p>
              <p className="text-gray-400 text-xs">{edu.startDate} - {edu.endDate}</p>
            </div>
          ))}
        </section>
      </aside>

      <main className="w-2/3 p-10">
        <header className="mb-10">
          <h1 className="text-5xl font-extrabold text-gray-800" style={titleStyle}>{personalDetails.firstName}</h1>
          <h1 className="text-5xl font-extrabold text-gray-800" style={titleStyle}>{personalDetails.lastName}</h1>
          <p className="text-2xl font-light mt-2" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</p>
        </header>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-gray-200 pb-2 mb-4" style={titleStyle}>PROFILE</h2>
          <p className="text-sm leading-relaxed text-gray-700">{professionalSummary}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-800 border-b-4 border-gray-200 pb-2 mb-4" style={titleStyle}>EXPERIENCE</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-6 relative pl-6">
               <div className="absolute left-0 top-1 w-3 h-3 bg-gray-800 rounded-full border-2 border-white" style={{backgroundColor: themeColor}}></div>
               <div className="absolute left-[5px] top-4 h-full w-px bg-gray-200"></div>
              <p className="text-xs font-bold text-gray-500">{job.startDate} - {job.endDate}</p>
              <h3 className="text-lg font-bold text-gray-900" style={titleStyle}>{job.jobTitle}</h3>
              <p className="text-md italic text-gray-700 mb-2">{job.employer}, {job.city}</p>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};
