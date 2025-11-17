
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const CompactTemplate: React.FC<TemplateProps> = ({ resume, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites } = resume;
  
  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-6 text-sm bg-white text-gray-800" style={bodyStyle}>
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
          <h2 className="text-lg text-gray-700" style={titleStyle}>{personalDetails.jobTitle}</h2>
        </div>
        <div className="text-right text-xs text-gray-600">
          <div>{personalDetails.email}</div>
          <div>{personalDetails.phone}</div>
          <div>{personalDetails.address}</div>
        </div>
      </header>

      <main>
        <section className="mb-3">
          <h3 className="text-md font-bold border-b border-gray-300 pb-1 mb-1" style={titleStyle}>SUMMARY</h3>
          <p className="text-xs leading-normal">{professionalSummary}</p>
        </section>
        
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
                <section className="mb-3">
                  <h3 className="text-md font-bold border-b border-gray-300 pb-1 mb-1" style={titleStyle}>EXPERIENCE</h3>
                  {employmentHistory.map(job => (
                    <div key={job.id} className="mb-2">
                      <div className="flex justify-between">
                        <h4 className="font-bold" style={titleStyle}>{job.jobTitle}</h4>
                        <p className="text-xs text-gray-500">{job.startDate} - {job.endDate}</p>
                      </div>
                      <p className="text-xs italic">{job.employer}, {job.city}</p>
                      <p className="text-xs mt-1 leading-normal whitespace-pre-wrap">{job.description}</p>
                    </div>
                  ))}
                </section>
            </div>
            <div className="col-span-4">
                 <section className="mb-3">
                  <h3 className="text-md font-bold border-b border-gray-300 pb-1 mb-1" style={titleStyle}>SKILLS</h3>
                  <ul className="text-xs list-disc list-inside">
                      {skills.map(skill => (
                        <li key={skill.id}>{skill.name}</li>
                      ))}
                  </ul>
                </section>
                <section>
                  <h3 className="text-md font-bold border-b border-gray-300 pb-1 mb-1" style={titleStyle}>EDUCATION</h3>
                  {education.map(edu => (
                    <div key={edu.id} className="mb-2">
                      <h4 className="font-bold" style={titleStyle}>{edu.degree}</h4>
                      <p className="text-xs italic">{edu.school}</p>
                      <p className="text-xs text-gray-500">{edu.startDate} - {edu.endDate}</p>
                    </div>
                  ))}
                </section>
            </div>
        </div>
      </main>
    </div>
  );
};
