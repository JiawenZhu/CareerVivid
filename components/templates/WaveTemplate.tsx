import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const WaveTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="bg-white text-gray-800 relative" style={bodyStyle}>
       <div className="absolute top-0 left-0 w-full h-48" style={{backgroundColor: themeColor, clipPath: 'ellipse(100% 55% at 40% 45%)'}}></div>
      <div className="relative p-8 z-10">
        <header className="mb-16 ml-4">
            <h1 className="text-5xl font-extrabold text-white" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
            <h2 className="text-2xl font-light" style={{...titleStyle, color: 'rgba(255,255,255,0.8)'}}>{personalDetails.jobTitle}</h2>
            <p className="text-sm mt-2" style={{color: 'rgba(255,255,255,0.7)'}}>{personalDetails.email} | {personalDetails.phone}</p>
        </header>

        <main className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
                <section className="mb-6">
                    <h3 className="text-xl font-bold mb-2" style={{...titleStyle, color: themeColor}}>Summary</h3>
                    <p className="text-sm leading-relaxed">{professionalSummary}</p>
                </section>
                <section>
                    <h3 className="text-xl font-bold mb-3" style={{...titleStyle, color: themeColor}}>Experience</h3>
                    {employmentHistory.map(job => (
                        <div key={job.id} className="mb-4">
                            <h4 className="text-lg font-semibold" style={titleStyle}>{job.jobTitle}</h4>
                            <p className="text-sm text-gray-600">{job.employer} | {job.startDate} - {job.endDate}</p>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{job.description}</p>
                        </div>
                    ))}
                </section>
            </div>
            <aside className="col-span-1">
                 <section className="mb-6">
                    <h3 className="text-xl font-bold mb-2" style={{...titleStyle, color: themeColor}}>Skills</h3>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                        {skills.map(skill => <li key={skill.id}>{skill.name}</li>)}
                    </ul>
                </section>
                <section>
                    <h3 className="text-xl font-bold mb-2" style={{...titleStyle, color: themeColor}}>Education</h3>
                     {education.map(edu => (
                        <div key={edu.id} className="mb-2">
                            <h4 className="font-semibold text-sm" style={titleStyle}>{edu.degree}</h4>
                            <p className="text-xs italic">{edu.school}</p>
                        </div>
                    ))}
                </section>
            </aside>
        </main>
      </div>
    </div>
  );
};
