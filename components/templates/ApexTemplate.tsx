
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin } from 'lucide-react';

export const ApexTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };
  const getTextColorForBackground = (hexColor: string): string => {
    try {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    } catch (e) {
        return '#FFFFFF';
    }
  };
  const headerTextColor = getTextColorForBackground(themeColor);

  return (
    <div className="bg-white text-gray-800" style={bodyStyle}>
      <header className="p-8" style={{ backgroundColor: themeColor, color: headerTextColor }}>
        <div className="flex justify-between items-center">
            <div>
                 <h1 className="text-4xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
                 <h2 className="text-xl font-light">{personalDetails.jobTitle}</h2>
            </div>
            {personalDetails.photo && (
                <div
                    className="w-24 h-24 rounded-full border-4 bg-cover bg-center"
                    style={{
                        borderColor: 'rgba(255,255,255,0.7)',
                        backgroundImage: `url(${personalDetails.photo})`
                    }}
                ></div>
            )}
        </div>
      </header>

      <main className="p-8">
        <section className="mb-6 text-center">
            <p className="text-md leading-relaxed max-w-3xl mx-auto">{professionalSummary}</p>
        </section>

        <div className="grid grid-cols-3 gap-8">
            <aside className="col-span-1">
                <section className="mb-6">
                    <h3 className="text-lg font-bold border-b-2 pb-1 mb-2" style={{...titleStyle, borderColor: themeColor}}>Contact</h3>
                     <div className="space-y-2 text-sm">
                        {personalDetails.email && <div className="flex items-center"><Mail size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.email}</span></div>}
                        {personalDetails.phone && <div className="flex items-center"><Phone size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.phone}</span></div>}
                        {personalDetails.address && <div className="flex items-center"><MapPin size={14} className="mr-2 flex-shrink-0 transform translate-y-px" /><span>{personalDetails.address}</span></div>}
                    </div>
                </section>
                <section className="mb-6">
                    <h3 className="text-lg font-bold border-b-2 pb-1 mb-2" style={{...titleStyle, borderColor: themeColor}}>Skills</h3>
                     <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                            <span key={skill.id} className="inline-flex items-center text-xs bg-gray-200 font-semibold px-3 py-1 rounded">{skill.name}</span>
                        ))}
                    </div>
                </section>
                 <section>
                    <h3 className="text-lg font-bold border-b-2 pb-1 mb-2" style={{...titleStyle, borderColor: themeColor}}>Education</h3>
                    {education.map(edu => (
                        <div key={edu.id} className="mb-2">
                            <h4 className="font-bold text-sm" style={titleStyle}>{edu.degree}</h4>
                            <p className="text-xs italic">{edu.school}</p>
                        </div>
                    ))}
                </section>
            </aside>
            <div className="col-span-2">
                <section>
                    <h3 className="text-lg font-bold border-b-2 pb-1 mb-3" style={{...titleStyle, borderColor: themeColor}}>Experience</h3>
                     {employmentHistory.map(job => (
                        <div key={job.id} className="mb-4">
                            <h4 className="text-lg font-semibold" style={titleStyle}>{job.jobTitle}</h4>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">{job.employer}</span>
                                <span className="text-gray-500">{job.startDate} - {job.endDate}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{job.description}</p>
                        </div>
                    ))}
                </section>
            </div>
        </div>
      </main>
    </div>
  );
};
