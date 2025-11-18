
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Globe, Brush } from 'lucide-react';

export const ArtisticTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };
  // A secondary color is derived for this template for better aesthetics
  const secondaryColor = '#4a5568'; // A slate gray, works with most colors

  return (
    <div className="bg-white text-gray-800 relative p-8" style={bodyStyle}>
      <div className="absolute top-0 left-0 w-1/3 h-full -z-1" style={{backgroundColor: `${themeColor}20`}}></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-full -z-1" style={{backgroundColor: `${secondaryColor}20`}}></div>

      <header className="text-left mb-10">
        <h1 className="text-6xl font-black" style={{...titleStyle, color: themeColor}}>{personalDetails.firstName}</h1>
        <h1 className="text-6xl font-black text-gray-800 -mt-4 ml-8" style={titleStyle}>{personalDetails.lastName}</h1>
        <p className="text-lg font-semibold mt-2 ml-10" style={{...titleStyle, color: secondaryColor}}>{personalDetails.jobTitle}</p>
      </header>

      <main className="grid grid-cols-3 gap-8">
        <aside className="col-span-1">
          {personalDetails.photo && (
            <div className="w-40 h-40 rounded-lg shadow-lg mb-6 overflow-hidden flex items-center justify-center">
              <img src={personalDetails.photo} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <section className="mb-6">
            <h2 className="font-bold text-lg mb-3" style={{...titleStyle, color: secondaryColor}}>CONTACT</h2>
            <div className="space-y-2 text-sm">
              {personalDetails.email && <div className="flex items-center"><Mail size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
              {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
              {websites.map(site => (
                <div key={site.id} className="flex items-center">
                  <Globe size={14} className="mr-2 flex-shrink-0 transform translate-y-px" />
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{site.label}</a>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-bold text-lg mb-3" style={{...titleStyle, color: secondaryColor}}>SKILLS</h2>
            <ul className="space-y-1">
              {skills.map(skill => (
                <li key={skill.id} className="text-sm flex items-center"><Brush size={12} className="mr-2" style={{color: themeColor}}/>{skill.name}</li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="col-span-2">
          <section className="mb-6">
            <h2 className="font-bold text-lg mb-3" style={{...titleStyle, color: themeColor}}>ABOUT ME</h2>
            <p className="text-sm leading-relaxed">{professionalSummary}</p>
          </section>
          <section className="mb-6">
            <h2 className="font-bold text-lg mb-3" style={{...titleStyle, color: themeColor}}>EXPERIENCE</h2>
            {employmentHistory.map(job => (
              <div key={job.id} className="mb-4">
                <h3 className="text-md font-bold" style={titleStyle}>{job.jobTitle}</h3>
                <p className="text-sm italic text-gray-600">{job.employer} / {job.startDate} - {job.endDate}</p>
                <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            ))}
          </section>
          <section>
            <h2 className="font-bold text-lg mb-3" style={{...titleStyle, color: themeColor}}>EDUCATION</h2>
            {education.map(edu => (
              <div key={edu.id}>
                <h3 className="text-md font-bold" style={titleStyle}>{edu.degree}</h3>
                <p className="text-sm italic text-gray-600">{edu.school}</p>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};
