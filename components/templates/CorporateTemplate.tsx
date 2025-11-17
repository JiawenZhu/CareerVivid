
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';

export const CorporateTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };
  const getTextColorForBackground = (hexColor: string): string => {
    if (!hexColor) return '#000000';
    try {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    } catch (e) {
        return '#FFFFFF'; // Fallback for invalid color
    }
  };
  const headerTextColor = getTextColorForBackground(themeColor);

  return (
    <div className="bg-white text-gray-800" style={bodyStyle}>
      <header className="p-8" style={{ backgroundColor: themeColor, color: headerTextColor }}>
        <h1 className="text-4xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <h2 className="text-xl font-light">{personalDetails.jobTitle}</h2>
      </header>

      <div className="p-8 grid grid-cols-12 gap-8">
        <aside className="col-span-4 border-r pr-8">
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{...titleStyle, color: themeColor}}>Contact</h3>
            <div className="space-y-2 text-sm">
              {personalDetails.email && <div className="flex items-center"><Mail size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
              {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
              {personalDetails.address && <div className="flex items-center"><MapPin size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.address}</span></div>}
              {websites.map(site => (
                <div key={site.id} className="flex items-center">
                  <Globe size={14} className="mr-2 flex-shrink-0 transform translate-y-px" />
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{site.label}</a>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{...titleStyle, color: themeColor}}>Education</h3>
            {education.map(edu => (
              <div key={edu.id} className="mb-4">
                <h4 className="text-md font-semibold" style={titleStyle}>{edu.degree}</h4>
                <p className="text-sm">{edu.school}</p>
                <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{...titleStyle, color: themeColor}}>Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <span key={skill.id} className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>{skill.name}</span>
              ))}
            </div>
          </section>
        </aside>

        <main className="col-span-8">
          <section className="mb-6">
            <h3 className="text-lg font-bold uppercase tracking-wider mb-3" style={{...titleStyle, color: themeColor}}>Profile</h3>
            <p className="text-sm leading-relaxed">{professionalSummary}</p>
          </section>

          <section>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-3" style={{...titleStyle, color: themeColor}}>Experience</h3>
            {employmentHistory.map(job => (
              <div key={job.id} className="mb-5">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-lg font-semibold" style={titleStyle}>{job.jobTitle}</h4>
                  <p className="text-sm text-gray-500">{job.startDate} - {job.endDate}</p>
                </div>
                <p className="text-md font-medium text-gray-700">{job.employer}, {job.city}</p>
                <p className="text-sm mt-2 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};
