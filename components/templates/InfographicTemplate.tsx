
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, User, Briefcase, GraduationCap, Star } from 'lucide-react';

export const InfographicTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;
  
  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  const getSkillWidth = (level: string) => {
    switch(level) {
      case 'Novice': return 'w-1/4';
      case 'Intermediate': return 'w-2/4';
      case 'Advanced': return 'w-3/4';
      case 'Expert': return 'w-full';
      default: return 'w-2/4';
    }
  };

  return (
    <div className="flex min-h-full bg-white" style={bodyStyle}>
      <aside className="w-1/3 bg-gray-100 dark:bg-gray-800 p-6 flex flex-col items-center">
        {personalDetails.photo && (
          <div className="w-32 h-32 rounded-full mb-4 overflow-hidden flex items-center justify-center">
            <img src={personalDetails.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-md text-gray-600 dark:text-gray-400 text-center" style={titleStyle}>{personalDetails.jobTitle}</p>
        
        <div className="w-full my-6 border-t border-gray-300 dark:border-gray-600"></div>

        <section className="w-full mb-6">
          <h2 className="text-sm font-bold uppercase mb-3" style={{...titleStyle, color: themeColor}}>CONTACT</h2>
          <div className="space-y-2 text-xs text-gray-800 dark:text-gray-200">
            {personalDetails.email && <div className="flex"><Mail size={14} className="mr-2 shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
            {personalDetails.phone && <div className="flex"><Phone size={14} className="mr-2 shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
            {personalDetails.address && <div className="flex"><MapPin size={14} className="mr-2 shrink-0 transform translate-y-px" /><span>{personalDetails.address}</span></div>}
          </div>
        </section>
        
        <section className="w-full">
          <h2 className="text-sm font-bold uppercase mb-3" style={{...titleStyle, color: themeColor}}>SKILLS</h2>
          <div className="space-y-3">
            {skills.map(skill => (
              <div key={skill.id}>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{skill.name}</p>
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                  <div className={`h-1.5 rounded-full ${getSkillWidth(skill.level)}`} style={{backgroundColor: themeColor}}></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <main className="w-2/3 p-8">
        <section className="mb-6">
          <div className="flex items-center mb-3">
            <div className="text-white rounded-full p-2 mr-3" style={{backgroundColor: themeColor}}><User size={20} /></div>
            <h2 className="text-xl font-bold uppercase text-gray-800 dark:text-gray-800" style={titleStyle}>Profile</h2>
          </div>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-700">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <div className="flex items-center mb-3">
            <div className="text-white rounded-full p-2 mr-3" style={{backgroundColor: themeColor}}><Briefcase size={20} /></div>
            <h2 className="text-xl font-bold uppercase text-gray-800 dark:text-gray-800" style={titleStyle}>Experience</h2>
          </div>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-4 pl-10 relative">
              <div className="absolute left-2 top-0 h-full w-0.5 bg-gray-200"></div>
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white" style={{backgroundColor: themeColor}}></div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-500">{job.startDate} - {job.endDate}</p>
              <h3 className="text-md font-bold text-gray-800 dark:text-gray-800" style={titleStyle}>{job.jobTitle}</h3>
              <p className="text-sm italic text-gray-600 dark:text-gray-600">{job.employer}</p>
              <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-700">{job.description}</p>
            </div>
          ))}
        </section>
        
        <section>
          <div className="flex items-center mb-3">
            <div className="text-white rounded-full p-2 mr-3" style={{backgroundColor: themeColor}}><GraduationCap size={20} /></div>
            <h2 className="text-xl font-bold uppercase text-gray-800 dark:text-gray-800" style={titleStyle}>Education</h2>
          </div>
          {education.map(edu => (
            <div key={edu.id} className="mb-4 pl-10 relative">
              <div className="absolute left-2 top-0 h-full w-0.5 bg-gray-200"></div>
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white" style={{backgroundColor: themeColor}}></div>
               <p className="text-xs font-bold text-gray-500 dark:text-gray-500">{edu.startDate} - {edu.endDate}</p>
              <h3 className="font-bold text-md text-gray-800 dark:text-gray-800" style={titleStyle}>{edu.degree}</h3>
              <p className="text-sm italic text-gray-600 dark:text-gray-600">{edu.school}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};
