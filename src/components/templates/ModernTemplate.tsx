
import React, { useState, useEffect } from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import InlineEdit from '../InlineEdit';
import IconDisplay from '../IconDisplay';

export const ModernTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont, onUpdate, onFocus }) => {
  const { personalDetails, professionalSummary, employmentHistory, education, skills, websites, sectionTitles, customIcons } = resume;

  const titleStyle = { fontFamily: `'${titleFont}', sans-serif` };
  const bodyStyle = { fontFamily: `'${bodyFont}', sans-serif` };

  return (
    <div className="p-10 text-gray-800 bg-white" style={bodyStyle}>
      <header className="text-left mb-8">
        <div className="flex gap-4 items-end">
          <InlineEdit
            value={personalDetails.firstName}
            fieldId="personalDetails.firstName"
            onFocus={onFocus}
            className="text-5xl font-bold text-gray-900"
            tagName="h1"
            placeholder="First Name"
          />
          <InlineEdit
            value={personalDetails.lastName}
            fieldId="personalDetails.lastName"
            onFocus={onFocus}
            className="text-5xl font-bold text-gray-900"
            tagName="h1"
            placeholder="Last Name"
          />
        </div>
        <div style={{ color: themeColor }}>
          <InlineEdit
            value={personalDetails.jobTitle}
            fieldId="personalDetails.jobTitle"
            onFocus={onFocus}
            className="text-2xl font-light mt-1 block"
            tagName="h2"
            placeholder="Job Title"
          />
        </div>

        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm mt-4" style={{ color: themeColor }}>
          <div className="flex items-center gap-1">
            {personalDetails.email && <IconDisplay iconName={customIcons?.email || 'mail'} size={12} />}
            <InlineEdit value={personalDetails.email} fieldId="personalDetails.email" onFocus={onFocus} placeholder="Email" />
          </div>
          <div className="flex items-center gap-1">
            {personalDetails.phone && <IconDisplay iconName={customIcons?.phone || 'phone'} size={12} />}
            <InlineEdit value={personalDetails.phone} fieldId="personalDetails.phone" onFocus={onFocus} placeholder="Phone" />
          </div>
          <div className="flex items-center gap-1">
            {personalDetails.city && <IconDisplay iconName={customIcons?.location || 'map-pin'} size={12} />}
            <InlineEdit value={`${personalDetails.city}${personalDetails.country ? `, ${personalDetails.country}` : ''}`} fieldId="personalDetails.city" onFocus={onFocus} placeholder="City, Country" />
          </div>
          {websites.map((site, index) => (
            <a key={site.id} href={site.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 flex items-center gap-1">
              <IconDisplay iconName={site.icon || 'globe'} size={12} />
              <InlineEdit value={site.label} fieldId={`websites[${index}].label`} onFocus={onFocus} isLink />
            </a>
          ))}
        </div>
      </header>

      <hr className="mb-6" />

      <main>
        <section className="mb-6">
          <InlineEdit
            value={resume.sectionTitles?.profile || 'Profile'}
            fieldId="sectionTitles.profile"
            onFocus={onFocus}
            className="text-sm font-bold uppercase text-gray-500 tracking-widest mb-3 block"
            tagName="h3"
            style={titleStyle}
          />
          <InlineEdit
            value={professionalSummary}
            fieldId="professionalSummary"
            onFocus={onFocus}
            multiline
            className="text-sm leading-relaxed block"
            placeholder="Professional Summary..."
          />
        </section>

        <section className="mb-6">
          <InlineEdit
            value={resume.sectionTitles?.skills || 'Skills'}
            fieldId="sectionTitles.skills"
            onFocus={onFocus}
            className="text-sm font-bold uppercase text-gray-500 tracking-widest mb-3 block"
            tagName="h3"
            style={titleStyle}
          />
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span key={skill.id} className="inline-flex items-center bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                <InlineEdit
                  value={skill.name}
                  fieldId={`skills[${index}].name`}
                  onFocus={onFocus}
                />
              </span>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <InlineEdit
            value={resume.sectionTitles?.experience || 'Experience'}
            fieldId="sectionTitles.experience"
            onFocus={onFocus}
            className="text-sm font-bold uppercase text-gray-500 tracking-widest mb-4 block"
            tagName="h3"
            style={titleStyle}
          />
          {employmentHistory.map((job, index) => (
            <div key={job.id} className="mb-5">
              <div className="flex justify-between items-baseline">
                <InlineEdit
                  value={job.jobTitle}
                  fieldId={`employmentHistory[${index}].jobTitle`}
                  onFocus={onFocus}
                  className="text-md font-bold text-gray-800 block"
                  tagName="h4"
                />
                <div className="flex gap-1 text-xs font-medium text-gray-500">
                  <InlineEdit value={job.startDate} fieldId={`employmentHistory[${index}].startDate`} onFocus={onFocus} />
                  <span>-</span>
                  <InlineEdit value={job.endDate} fieldId={`employmentHistory[${index}].endDate`} onFocus={onFocus} />
                </div>
              </div>
              <div className="text-sm italic text-gray-600 mb-1 flex gap-1">
                <InlineEdit value={job.employer} fieldId={`employmentHistory[${index}].employer`} onFocus={onFocus} />
                <span>,</span>
                <InlineEdit value={job.city} fieldId={`employmentHistory[${index}].city`} onFocus={onFocus} />
              </div>
              <InlineEdit
                value={job.description}
                fieldId={`employmentHistory[${index}].description`}
                onFocus={onFocus}
                multiline
                className="text-sm mt-1 leading-relaxed whitespace-pre-wrap block"
              />
            </div>
          ))}
        </section>

        <section>
          <InlineEdit
            value={resume.sectionTitles?.education || 'Education'}
            fieldId="sectionTitles.education"
            onFocus={onFocus}
            className="text-sm font-bold uppercase text-gray-500 tracking-widest mb-4 block"
            tagName="h3"
            style={titleStyle}
          />
          {education.map((edu, index) => (
            <div key={edu.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <InlineEdit
                  value={edu.degree}
                  fieldId={`education[${index}].degree`}
                  onFocus={onFocus}
                  className="text-md font-bold text-gray-800 block"
                  tagName="h4"
                />
                <div className="flex gap-1 text-xs font-medium text-gray-500">
                  <InlineEdit value={edu.startDate} fieldId={`education[${index}].startDate`} onFocus={onFocus} />
                  <span>-</span>
                  <InlineEdit value={edu.endDate} fieldId={`education[${index}].endDate`} onFocus={onFocus} />
                </div>
              </div>
              <div className="text-sm italic text-gray-600 flex gap-1">
                <InlineEdit value={edu.school} fieldId={`education[${index}].school`} onFocus={onFocus} />
                <span>,</span>
                <InlineEdit value={edu.city} fieldId={`education[${index}].city`} onFocus={onFocus} />
              </div>
              <InlineEdit
                value={edu.description}
                fieldId={`education[${index}].description`}
                onFocus={onFocus}
                multiline
                className="text-sm mt-1 leading-relaxed whitespace-pre-wrap block"
                placeholder="Description..."
              />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};
