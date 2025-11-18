
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Star } from 'lucide-react';

export const OrionTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="flex min-h-full bg-white" style={bodyStyle}>
      <aside className="w-1/3 bg-gray-800 text-gray-200 p-8" style={{backgroundImage: 'radial-gradient(circle at top right, rgba(128,128,128,0.1), transparent 70%)'}}>
        {personalDetails.photo && (
          <div className="w-28 h-28 rounded-full mx-auto mb-6 overflow-hidden flex items-center justify-center">
            <img src={personalDetails.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-3xl font-bold text-white text-center" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-md text-gray-400 text-center" style={titleStyle}>{personalDetails.jobTitle}</p>
        
        <div className="w-full my-6 border-t border-gray-600"></div>

        <section className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white mb-3" style={titleStyle}>Contact</h2>
          <div className="space-y-2 text-xs">
            {personalDetails.email && <div className="flex items-center"><Mail size={14} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
            {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
            {personalDetails.address && <div className="flex items-center"><MapPin size={14} className="mr-3 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.address}</span></div>}
          </div>
        </section>
        
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white mb-3" style={titleStyle}>Skills</h2>
          <ul className="space-y-2 text-sm">
            {skills.map(skill => (
              <li key={skill.id} className="flex items-center"><Star size={12} className="mr-2" style={{color: themeColor}} />{skill.name}</li>
            ))}
          </ul>
        </section>
      </aside>

      <main className="w-2/3 p-8">
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-800 mb-2" style={titleStyle}>Objective</h2>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-700">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-800 mb-3" style={titleStyle}>Experience</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-800" style={titleStyle}>{job.jobTitle}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-500">{job.employer} | {job.startDate} - {job.endDate}</p>
              <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-700">{job.description}</p>
            </div>
          ))}
        </section>
        
        <section>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-800 mb-3" style={titleStyle}>Education</h2>
          {education.map(edu => (
            <div key={edu.id}>
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-800" style={titleStyle}>{edu.degree}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-500">{edu.school} | {edu.startDate} - {edu.endDate}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};
