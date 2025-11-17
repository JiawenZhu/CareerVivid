
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';

export const TimelineTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-8 bg-white text-gray-800" style={bodyStyle}>
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold" style={titleStyle}>{personalDetails.firstName} {personalDetails.lastName}</h1>
        <p className="text-xl text-gray-600 mt-1" style={titleStyle}>{personalDetails.jobTitle}</p>
        <p className="text-sm mt-2">{personalDetails.email} | {personalDetails.phone}</p>
        <p className="mt-4 text-md leading-relaxed max-w-2xl mx-auto">{professionalSummary}</p>
      </header>
      
      <main className="px-4">
        <div className="relative">
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-300 -ml-px"></div>

          {employmentHistory.map((job, index) => (
            <div key={job.id} className={`flex items-center w-full mb-6 ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}>
              <div className="w-1/2"></div>
              <div className="w-12 h-12 rounded-full text-white flex items-center justify-center font-bold z-10" style={{backgroundColor: themeColor}}>{index + 1}</div>
              <div className={`w-1/2 px-4 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                <p className="text-sm text-gray-500">{job.startDate} - {job.endDate}</p>
                <h3 className="text-lg font-bold" style={titleStyle}>{job.jobTitle}</h3>
                <p className="text-md italic">{job.employer}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
            <h2 className="text-2xl font-bold mb-4" style={titleStyle}>Education & Skills</h2>
            <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-bold mb-2" style={titleStyle}>Education</h3>
                    {education.map(edu => (
                        <div key={edu.id} className="text-sm">
                            <p className="font-semibold">{edu.degree}</p>
                            <p>{edu.school}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-bold mb-2" style={titleStyle}>Skills</h3>
                    <p className="text-sm">{skills.map(s => s.name).join(', ')}</p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};
