
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

export const GeometricTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;
  
  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="bg-gray-100 text-gray-800" style={bodyStyle}>
      <div className="bg-white p-8">
        <header className="relative flex items-center justify-between pb-8">
          <div className="z-10">
            <h1 className="text-5xl font-extrabold" style={titleStyle}>{personalDetails.firstName}</h1>
            <h1 className="text-5xl font-extrabold" style={titleStyle}>{personalDetails.lastName}</h1>
            <p className="text-xl font-light mt-2" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</p>
          </div>
          <div className="absolute top-0 right-0 h-40 w-40 clip-poly-triangle z-0" style={{backgroundColor: themeColor}}></div>
           <div className="absolute -top-4 -right-4 h-24 w-24 border-4 border-gray-800 z-0"></div>
          <style>{`.clip-poly-triangle { clip-path: polygon(0 0, 100% 0, 100% 100%); }`}</style>
        </header>
        
        <div className="grid grid-cols-12 gap-8">
            <main className="col-span-8">
                <section className="mb-6">
                    <p className="text-sm leading-relaxed">{professionalSummary}</p>
                </section>
                 <section>
                    <h2 className="text-lg font-bold uppercase tracking-wider mb-3" style={{...titleStyle, color: themeColor}}>Experience</h2>
                    {employmentHistory.map(job => (
                    <div key={job.id} className="mb-5 border-l-4 border-gray-800 pl-4">
                        <p className="text-xs text-gray-500">{job.startDate} - {job.endDate}</p>
                        <h4 className="text-lg font-semibold" style={titleStyle}>{job.jobTitle}</h4>
                        <p className="text-md font-medium text-gray-700">{job.employer}, {job.city}</p>
                        <p className="text-sm mt-2 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                    </div>
                    ))}
                </section>
            </main>
            <aside className="col-span-4">
                 <section className="mb-6">
                    <h3 className="text-lg font-bold uppercase tracking-wider mb-3" style={{...titleStyle, color: themeColor}}>Contact</h3>
                    <div className="space-y-2 text-sm">
                        {personalDetails.email && <div className="flex items-center"><Mail size={14} className="mr-2 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
                        {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-2 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
                    </div>
                </section>
                 <section className="mb-6">
                    <h3 className="text-lg font-bold uppercase tracking-wider mb-3" style={{...titleStyle, color: themeColor}}>Skills</h3>
                    <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                        <span key={skill.id} className="inline-flex items-center text-xs bg-gray-800 text-white font-semibold px-3 py-1">{skill.name}</span>
                    ))}
                    </div>
                </section>
                <section className="mb-6">
                    <h3 className="text-lg font-bold uppercase tracking-wider mb-3" style={{...titleStyle, color: themeColor}}>Education</h3>
                    {education.map(edu => (
                    <div key={edu.id} className="mb-4">
                        <h4 className="text-md font-semibold" style={titleStyle}>{edu.degree}</h4>
                        <p className="text-sm">{edu.school}</p>
                        <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p>
                    </div>
                    ))}
                </section>
            </aside>
        </div>
      </div>
    </div>
  );
};
