
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin } from 'lucide-react';

export const DynamicTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="bg-white text-gray-800 relative" style={bodyStyle}>
      <div className="absolute top-0 right-0 h-full w-1/3 bg-gray-100 dark:bg-gray-800/50 -z-1" style={{clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)'}}></div>
      <div className="p-8">
        <main className="flex gap-8 items-start">
            <div className="w-2/3">
                <section className="mb-6">
                    <h3 className="text-xl font-bold mb-2" style={titleStyle}>Summary</h3>
                    <p className="text-sm leading-relaxed">{professionalSummary}</p>
                </section>
                 <section>
                    <h3 className="text-xl font-bold mb-3" style={titleStyle}>Experience</h3>
                    {employmentHistory.map(job => (
                        <div key={job.id} className="mb-4">
                        <h4 className="text-lg font-semibold" style={titleStyle}>{job.jobTitle}</h4>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="italic text-gray-700">{job.employer}</span>
                            <span className="text-gray-500">{job.startDate} - {job.endDate}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{job.description}</p>
                        </div>
                    ))}
                </section>
            </div>
            <div className="w-1/3">
                 <header className="mb-8 text-right">
                    <h1 className="text-5xl font-extrabold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
                    <h2 className="text-2xl font-light" style={{...titleStyle, color: themeColor}}>{personalDetails.jobTitle}</h2>
                </header>
                <aside>
                    <section className="mb-6">
                        <h3 className="text-lg font-bold mb-2" style={titleStyle}>Contact</h3>
                         <div className="space-y-2 text-sm">
                            {personalDetails.email && <div className="flex items-center justify-end"><span className="text-right">{personalDetails.email}</span><Mail size={14} className="ml-2 flex-shrink-0 transform translate-y-px" /></div>}
                            {personalDetails.phone && <div className="flex items-center justify-end"><span>{personalDetails.phone}</span><Phone size={14} className="ml-2 flex-shrink-0 transform translate-y-px" /></div>}
                            {personalDetails.address && <div className="flex items-center justify-end"><span className="text-right">{personalDetails.address}</span><MapPin size={14} className="ml-2 flex-shrink-0 transform translate-y-px" /></div>}
                        </div>
                    </section>
                    <section className="mb-6 text-right">
                        <h3 className="text-lg font-bold mb-2" style={titleStyle}>Skills</h3>
                        <ul className="text-sm space-y-1">
                            {skills.map(skill => <li key={skill.id}>{skill.name}</li>)}
                        </ul>
                    </section>
                    <section className="text-right">
                        <h3 className="text-lg font-bold mb-2" style={titleStyle}>Education</h3>
                         {education.map(edu => (
                            <div key={edu.id} className="mb-2">
                            <h4 className="font-semibold text-sm" style={titleStyle}>{edu.degree}</h4>
                            <p className="text-xs italic">{edu.school}</p>
                            </div>
                        ))}
                    </section>
                </aside>
            </div>
        </main>
      </div>
    </div>
  );
};
