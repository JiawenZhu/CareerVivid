
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const VertexTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
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
    } catch (e) { return '#FFFFFF'; }
  };
  const headerTextColor = getTextColorForBackground(themeColor);

  return (
    <div className="p-8 bg-white text-gray-800" style={bodyStyle}>
      <header className="mb-6 text-center">
        <div className="inline-block px-8 py-4" style={{ backgroundColor: themeColor, color: headerTextColor }}>
          <h1 className="text-4xl font-extrabold tracking-widest" style={titleStyle}>{personalDetails.firstName.toUpperCase()} {personalDetails.lastName.toUpperCase()}</h1>
        </div>
        <p className="text-lg text-gray-600 mt-4" style={titleStyle}>{personalDetails.jobTitle}</p>
        <p className="text-sm text-gray-500 mt-2">{personalDetails.email} | {personalDetails.phone}</p>
      </header>
      
      <main className="max-w-3xl mx-auto">
        <section className="mb-6">
          <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-1 mb-2" style={titleStyle}>Summary</h2>
          <p className="text-sm leading-relaxed">{professionalSummary}</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-1 mb-3" style={titleStyle}>Experience</h2>
          {employmentHistory.map(job => (
            <div key={job.id} className="mb-4">
              <h3 className="text-lg font-bold" style={titleStyle}>{job.jobTitle}</h3>
              <p className="text-sm text-gray-600">{job.employer} | {job.startDate} - {job.endDate}</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{job.description}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-2 gap-6">
            <div>
                <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-1 mb-2" style={titleStyle}>Education</h2>
                {education.map(edu => (
                    <div key={edu.id} className="mb-2">
                    <h3 className="font-bold" style={titleStyle}>{edu.degree}</h3>
                    <p className="text-sm text-gray-600">{edu.school}</p>
                    </div>
                ))}
            </div>
            <div>
                <h2 className="text-xl font-bold border-b-2 border-gray-300 pb-1 mb-2" style={titleStyle}>Skills</h2>
                <ul className="text-sm space-y-1">
                    {skills.map(skill => <li key={skill.id}>{skill.name}</li>)}
                </ul>
            </div>
        </section>
      </main>
    </div>
  );
};
