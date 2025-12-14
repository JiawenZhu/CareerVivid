import MinimalTemplate from './MinimalTemplate';
import VisualTemplate from './VisualTemplate';
import CorporateTemplate from './CorporateTemplate';
import DevTerminal from './general/Gen_Dev_Terminal';
import UXFolio from './creative/Creative_UX';
import LegalTrust from './professional/Prof_Legal';
import MedicalCare from './MedicalCare';
import SaaSModern from './SaaSModern';
import CreativeDark from './CreativeDark';
import WriterEditorial from './WriterEditorial';
import AcademicResearch from './AcademicResearch';
import BentoPersonal from './BentoPersonal';
import ExecutiveBrief from './ExecutiveBrief';

export const TEMPLATES = {
    minimalist: MinimalTemplate,
    visual: VisualTemplate,
    corporate: CorporateTemplate,
    dev_terminal: DevTerminal,
    ux_folio: UXFolio,
    legal_trust: LegalTrust,
    medical_care: MedicalCare,
    saas_modern: SaaSModern,
    creative_dark: CreativeDark,
    writer_editorial: WriterEditorial,
    academic_research: AcademicResearch,
    bento_personal: BentoPersonal,
    executive_brief: ExecutiveBrief
};

export type TemplateId = keyof typeof TEMPLATES;
