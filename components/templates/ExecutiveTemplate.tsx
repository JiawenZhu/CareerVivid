import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import InlineEdit from '../InlineEdit';
import IconDisplay from '../IconDisplay';

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont, onFocus }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites, sectionTitles, customIcons } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="bg-white" style={bodyStyle}>
      <header className="bg-gray-800 text-white p-10 text-center">
        <div className="flex justify-center gap-3">
            <InlineEdit 
                value={personalDetails.firstName.toUpperCase()} 
                fieldId="personalDetails.firstName" 
                onFocus={onFocus} 
                className="text-5xl font-extrabold tracking-wider block"
                style={titleStyle}
                tagName="h1"
                placeholder="FIRST NAME"
            />
            <InlineEdit 
                value={personalDetails.lastName.toUpperCase()} 
                fieldId="personalDetails.lastName" 
                onFocus={onFocus} 
                className="text-5xl font-extrabold tracking-wider block"
                style={titleStyle}
                tagName="h1"
                placeholder="LAST NAME"
            />
        </div>
        <InlineEdit 
            value={personalDetails.jobTitle} 
            fieldId="personalDetails.jobTitle" 
            onFocus={onFocus} 
            className="text-xl font-light mt-2 block"
            style={{...titleStyle, color: themeColor }}
            tagName="h2"
            placeholder="JOB TITLE"
        />
      </header>

      <div className="p-10">
        <div className="grid grid-cols-3 gap-10">
          <div className="col-span-2">
            <section className="mb-8">
              <InlineEdit 
                value={(sectionTitles?.profile || 'Summary').toUpperCase()}
                fieldId="sectionTitles.profile"
                onFocus={onFocus}
                className="text-2xl font-bold text-gray-800 mb-4 border-b-4 pb-2 block"
                tagName="h3"
                style={{...titleStyle, borderColor: themeColor}}
              />
              <InlineEdit 
                value={professionalSummary} 
                fieldId="professionalSummary" 
                onFocus={onFocus} 
                className="text-gray-700 leading-relaxed block whitespace-pre-wrap"
                tagName="p"
                placeholder="Professional Summary..."
              />
            </section>

            <section className="mb-8">
              <InlineEdit 
                value={(sectionTitles?.experience || 'Professional Experience').toUpperCase()}
                fieldId="sectionTitles.experience"
                onFocus={onFocus}
                className="text-2xl font-bold text-gray-800 mb-4 border-b-4 pb-2 block"
                tagName="h3"
                style={{...titleStyle, borderColor: themeColor}}
              />
              {employmentHistory.map((job, index) => (
                <div key={job.id} className="mb-6">
                  <div className="flex justify-between items-center">
                    <InlineEdit 
                        value={job.jobTitle} 
                        fieldId={`employmentHistory[${index}].jobTitle`} 
                        onFocus={onFocus} 
                        className="text-xl font-semibold text-gray-900 block"
                        style={titleStyle}
                        tagName="h4"
                        placeholder="Job Title"
                    />
                    <div className="flex gap-1 text-gray-600 font-medium">
                        <InlineEdit value={job.startDate} fieldId={`employmentHistory[${index}].startDate`} onFocus={onFocus} placeholder="Start" />
                        <span>-</span>
                        <InlineEdit value={job.endDate} fieldId={`employmentHistory[${index}].endDate`} onFocus={onFocus} placeholder="End" />
                    </div>
                  </div>
                  <div className="flex gap-1 text-lg italic text-gray-700">
                      <InlineEdit value={job.employer} fieldId={`employmentHistory[${index}].employer`} onFocus={onFocus} placeholder="Employer" />
                      <span>|</span>
                      <InlineEdit value={job.city} fieldId={`employmentHistory[${index}].city`} onFocus={onFocus} placeholder="City" />
                  </div>
                  <InlineEdit 
                    value={job.description} 
                    fieldId={`employmentHistory[${index}].description`} 
                    onFocus={onFocus} 
                    className="mt-2 text-gray-700 leading-relaxed whitespace-pre-wrap block"
                    tagName="p"
                    placeholder="Description..."
                  />
                </div>
              ))}
            </section>
          </div>

          <div className="col-span-1">
            <section className="bg-gray-100 p-6 rounded-lg mb-8">
              <InlineEdit 
                value={(sectionTitles?.contact || 'Contact Details').toUpperCase()}
                fieldId="sectionTitles.contact"
                onFocus={onFocus}
                className="text-xl font-bold text-gray-800 mb-4 block"
                tagName="h3"
                style={titleStyle}
              />
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                    <IconDisplay iconName={customIcons?.email || 'mail'} size={14} className="mr-3 flex-shrink-0 transform translate-y-px" />
                    <InlineEdit value={personalDetails.email} fieldId="personalDetails.email" onFocus={onFocus} placeholder="Email" />
                </div>
                <div className="flex items-center">
                    <IconDisplay iconName={customIcons?.phone || 'phone'} size={14} className="mr-3 flex-shrink-0 transform translate-y-px" />
                    <InlineEdit value={personalDetails.phone} fieldId="personalDetails.phone" onFocus={onFocus} placeholder="Phone" />
                </div>
                <div className="flex items-center">
                    <IconDisplay iconName={customIcons?.location || 'map-pin'} size={14} className="mr-3 flex-shrink-0 transform translate-y-px" />
                    <InlineEdit value={personalDetails.address} fieldId="personalDetails.address" onFocus={onFocus} placeholder="Address" />
                </div>
                {websites.map((site, index) => (
                  <div key={site.id} className="flex items-center">
                    <IconDisplay iconName={site.icon || 'globe'} size={14} className="mr-3 flex-shrink-0 transform translate-y-px" />
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        <InlineEdit value={site.label} fieldId={`websites[${index}].label`} onFocus={onFocus} isLink />
                    </a>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gray-100 p-6 rounded-lg mb-8">
              <InlineEdit 
                value={(sectionTitles?.skills || 'Key Skills').toUpperCase()}
                fieldId="sectionTitles.skills"
                onFocus={onFocus}
                className="text-xl font-bold text-gray-800 mb-4 block"
                tagName="h3"
                style={titleStyle}
              />
              <ul className="space-y-2">
                {skills.map((skill, index) => (
                  <li key={skill.id} className="flex items-center">
                    <span className="w-2 h-2 rounded-full mr-3" style={{backgroundColor: themeColor}}></span>
                    <InlineEdit value={skill.name} fieldId={`skills[${index}].name`} onFocus={onFocus} placeholder="Skill" />
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-gray-100 p-6 rounded-lg">
              <InlineEdit 
                value={(sectionTitles?.education || 'Education').toUpperCase()}
                fieldId="sectionTitles.education"
                onFocus={onFocus}
                className="text-xl font-bold text-gray-800 mb-4 block"
                tagName="h3"
                style={titleStyle}
              />
              {education.map((edu, index) => (
                <div key={edu.id} className="mb-4">
                  <InlineEdit 
                    value={edu.degree} 
                    fieldId={`education[${index}].degree`} 
                    onFocus={onFocus} 
                    className="font-semibold block"
                    style={titleStyle}
                    tagName="h4"
                    placeholder="Degree"
                  />
                  <InlineEdit 
                    value={edu.school} 
                    fieldId={`education[${index}].school`} 
                    onFocus={onFocus} 
                    className="text-gray-700 block"
                    tagName="p"
                    placeholder="School"
                  />
                  <div className="flex gap-1 text-sm text-gray-500">
                      <InlineEdit value={edu.startDate} fieldId={`education[${index}].startDate`} onFocus={onFocus} placeholder="Start" />
                      <span>-</span>
                      <InlineEdit value={edu.endDate} fieldId={`education[${index}].endDate`} onFocus={onFocus} placeholder="End" />
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
