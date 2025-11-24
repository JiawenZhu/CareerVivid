
import React from 'react';
import { ResumeData, TemplateProps } from '../../types';
import { Mail, Phone, MapPin } from 'lucide-react';
import InlineEdit from '../InlineEdit';

export const ApexTemplate: React.FC<TemplateProps> = ({ resume, themeColor, titleFont, bodyFont, onFocus }) => {
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
                 <div className="flex gap-2 items-end">
                    <InlineEdit 
                        value={personalDetails.firstName} 
                        fieldId="personalDetails.firstName" 
                        onFocus={onFocus} 
                        className="text-4xl font-bold" 
                        style={titleStyle}
                        tagName="h1"
                        placeholder="First Name"
                    />
                    <InlineEdit 
                        value={personalDetails.lastName} 
                        fieldId="personalDetails.lastName" 
                        onFocus={onFocus} 
                        className="text-4xl font-bold" 
                        style={titleStyle}
                        tagName="h1"
                        placeholder="Last Name"
                    />
                 </div>
                 <InlineEdit 
                    value={personalDetails.jobTitle} 
                    fieldId="personalDetails.jobTitle" 
                    onFocus={onFocus} 
                    className="text-xl font-light block" 
                    tagName="h2"
                    placeholder="Job Title"
                />
            </div>
            {personalDetails.photo && (
                <div
                    className="w-24 h-24 rounded-full border-4 overflow-hidden flex items-center justify-center"
                    style={{ borderColor: 'rgba(255,255,255,0.7)' }}
                >
                  <img src={personalDetails.photo} alt="Profile" className="w-full h-full object-cover" />
                </div>
            )}
        </div>
      </header>

      <main className="p-8">
        <section className="mb-6 text-center">
            <InlineEdit 
                value={professionalSummary} 
                fieldId="professionalSummary" 
                onFocus={onFocus} 
                className="text-md leading-relaxed max-w-3xl mx-auto block whitespace-pre-wrap"
                tagName="p"
                placeholder="Summary..."
            />
        </section>

        <div className="grid grid-cols-3 gap-8">
            <aside className="col-span-1">
                <section className="mb-6">
                    <h3 className="text-lg font-bold border-b-2 pb-1 mb-2" style={{...titleStyle, borderColor: themeColor}}>Contact</h3>
                     <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                            <Mail size={14} className="mr-2 flex-shrink-0 transform translate-y-px" />
                            <InlineEdit value={personalDetails.email} fieldId="personalDetails.email" onFocus={onFocus} placeholder="Email" />
                        </div>
                        <div className="flex items-center">
                            <Phone size={14} className="mr-2 flex-shrink-0 transform translate-y-px" />
                            <InlineEdit value={personalDetails.phone} fieldId="personalDetails.phone" onFocus={onFocus} placeholder="Phone" />
                        </div>
                        <div className="flex items-center">
                            <MapPin size={14} className="mr-2 flex-shrink-0 transform translate-y-px" />
                            <InlineEdit value={personalDetails.address} fieldId="personalDetails.address" onFocus={onFocus} placeholder="Address" />
                        </div>
                    </div>
                </section>
                <section className="mb-6">
                    <h3 className="text-lg font-bold border-b-2 pb-1 mb-2" style={{...titleStyle, borderColor: themeColor}}>Skills</h3>
                     <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                            <span key={skill.id} className="inline-flex items-center text-xs bg-gray-200 font-semibold px-3 py-1 rounded">
                                <InlineEdit value={skill.name} fieldId={`skills[${index}].name`} onFocus={onFocus} placeholder="Skill" />
                            </span>
                        ))}
                    </div>
                </section>
                 <section>
                    <h3 className="text-lg font-bold border-b-2 pb-1 mb-2" style={{...titleStyle, borderColor: themeColor}}>Education</h3>
                    {education.map((edu, index) => (
                        <div key={edu.id} className="mb-2">
                            <InlineEdit 
                                value={edu.degree} 
                                fieldId={`education[${index}].degree`} 
                                onFocus={onFocus} 
                                className="font-bold text-sm block" 
                                style={titleStyle}
                                tagName="h4"
                                placeholder="Degree"
                            />
                            <InlineEdit 
                                value={edu.school} 
                                fieldId={`education[${index}].school`} 
                                onFocus={onFocus} 
                                className="text-xs italic block" 
                                tagName="p"
                                placeholder="School"
                            />
                        </div>
                    ))}
                </section>
            </aside>
            <div className="col-span-2">
                <section>
                    <h3 className="text-lg font-bold border-b-2 pb-1 mb-3" style={{...titleStyle, borderColor: themeColor}}>Experience</h3>
                     {employmentHistory.map((job, index) => (
                        <div key={job.id} className="mb-4">
                            <InlineEdit 
                                value={job.jobTitle} 
                                fieldId={`employmentHistory[${index}].jobTitle`} 
                                onFocus={onFocus} 
                                className="text-lg font-semibold block" 
                                style={titleStyle}
                                tagName="h4"
                                placeholder="Job Title"
                            />
                            <div className="flex justify-between text-sm mb-1">
                                <InlineEdit value={job.employer} fieldId={`employmentHistory[${index}].employer`} onFocus={onFocus} placeholder="Employer" className="font-medium text-gray-700" />
                                <div className="flex gap-1 text-gray-500">
                                    <InlineEdit value={job.startDate} fieldId={`employmentHistory[${index}].startDate`} onFocus={onFocus} placeholder="Start" />
                                    <span>-</span>
                                    <InlineEdit value={job.endDate} fieldId={`employmentHistory[${index}].endDate`} onFocus={onFocus} placeholder="End" />
                                </div>
                            </div>
                            <InlineEdit 
                                value={job.description} 
                                fieldId={`employmentHistory[${index}].description`} 
                                onFocus={onFocus} 
                                className="text-sm whitespace-pre-wrap block"
                                tagName="p"
                                placeholder="Description..."
                            />
                        </div>
                    ))}
                </section>
            </div>
        </div>
      </main>
    </div>
  );
};
