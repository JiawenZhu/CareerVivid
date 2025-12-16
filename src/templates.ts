import { TemplateInfo } from './types';

const professionalColors = ['#2c3e50', '#34495e', '#217ca3', '#95a5a6', '#7f8c8d'];
const creativeColors = ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c'];
const corporateColors = ['#003366', '#004080', '#336699', '#6699CC', '#99CCFF'];
const elegantColors = ['#3a3a3a', '#5a2a27', '#6d6d6d', '#ab8f7c'];
const minimalistColors = ['#000000', '#555555', '#888888', '#aaaaaa'];
const techColors = ['#007acc', '#005f9e', '#333333', '#f0db4f', '#43853d'];
const slateColors = ['#4a5568', '#718096', '#2d3748', '#a0aec0'];
const boldColors = ['#ff4757', '#e84118', '#3c40c6', '#000000'];
const vibrantColors = ['#000000', '#1abc9c', '#e74c3c', '#f1c40f'];


export const TEMPLATES: TemplateInfo[] = [
  { id: 'Modern', name: 'Modern', availableColors: professionalColors },
  { id: 'Sydney', name: 'Sydney', availableColors: creativeColors },
  { id: 'Creative', name: 'Creative', availableColors: creativeColors },
  { id: 'Professional', name: 'Professional', availableColors: corporateColors },
  { id: 'Executive', name: 'Executive', availableColors: ['#b8860b', '#c0c0c0', '#000000', '#4a4a4a'] },
  { id: 'Minimalist', name: 'Minimalist', availableColors: minimalistColors },
  { id: 'Elegant', name: 'Elegant', availableColors: elegantColors },
  { id: 'Corporate', name: 'Corporate', availableColors: corporateColors },
  { id: 'Technical', name: 'Technical', availableColors: techColors },
  { id: 'Artistic', name: 'Artistic', availableColors: ['#e74c3c', '#00bcd4', '#ff9800'] },
  { id: 'Vibrant', name: 'Vibrant', availableColors: vibrantColors },
  { id: 'Slate', name: 'Slate', availableColors: slateColors },
  { id: 'Academic', name: 'Academic', availableColors: corporateColors },
  { id: 'Apex', name: 'Apex', availableColors: professionalColors },
  { id: 'Bold', name: 'Bold', availableColors: boldColors },
  { id: 'Cascade', name: 'Cascade', availableColors: professionalColors },
  { id: 'Chicago', name: 'Chicago', availableColors: elegantColors },
  { id: 'Classic', name: 'Classic', availableColors: elegantColors },
  { id: 'Compact', name: 'Compact', availableColors: minimalistColors },
  { id: 'Crisp', name: 'Crisp', availableColors: professionalColors },
  { id: 'Dynamic', name: 'Dynamic', availableColors: creativeColors },
  { id: 'Geometric', name: 'Geometric', availableColors: creativeColors },
  { id: 'Harvard', name: 'Harvard', availableColors: elegantColors },
  { id: 'Infographic', name: 'Infographic', availableColors: creativeColors },
  { id: 'Monochrome', name: 'Monochrome', availableColors: ['#000000'] },
  { id: 'Orion', name: 'Orion', availableColors: techColors },
  { id: 'Pinnacle', name: 'Pinnacle', availableColors: professionalColors },
  { id: 'Quantum', name: 'Quantum', availableColors: techColors },
  { id: 'Serif', name: 'Serif', availableColors: elegantColors },
  { id: 'Simple', name: 'Simple', availableColors: minimalistColors },
  { id: 'Spacious', name: 'Spacious', availableColors: professionalColors },
  { id: 'Swiss', name: 'Swiss', availableColors: minimalistColors },
  { id: 'Timeline', name: 'Timeline', availableColors: creativeColors },
  { id: 'Vertex', name: 'Vertex', availableColors: boldColors },
  { id: 'Wave', name: 'Wave', availableColors: creativeColors },
  { id: 'Zenith', name: 'Zenith', availableColors: professionalColors },
];