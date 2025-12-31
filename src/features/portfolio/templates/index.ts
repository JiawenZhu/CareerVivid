// General Templates
import MinimalTemplate from './MinimalTemplate';
import VisualTemplate from './VisualTemplate'; import CorporateTemplate from './CorporateTemplate';

// Technology Templates
import DevTerminal from './general/Gen_Dev_Terminal';
import SaaSModern from './SaaSModern';

// Creative Templates
import UXFolio from './creative/Creative_UX';
import CreativeDark from './CreativeDark';

// Professional Templates
import LegalTrust from './professional/Prof_Legal';
import WriterEditorial from './WriterEditorial';
import ExecutiveBrief from './ExecutiveBrief';

// Specialist Templates
import MedicalCare from './MedicalCare';
import AcademicResearch from './AcademicResearch';
import BentoPersonal from './BentoPersonal';

// Link-in-Bio Templates (NEW)
import LinkTreeMinimal from './linkinbio/LinkTreeMinimal';
import LinkTreeVisual from './linkinbio/LinkTreeVisual';
import LinkTreeCorporate from './linkinbio/LinkTreeCorporate';
import LinkTreeBento from './linkinbio/LinkTreeBento';

// NFC Card Templates
import CardMinimal from './nfc/CardMinimal';
import CardPhoto from './nfc/CardPhoto';
import CardModern from './nfc/CardModern';

export const TEMPLATES = {
    // General
    minimalist: MinimalTemplate,
    visual: VisualTemplate,
    corporate: CorporateTemplate,

    // Technology
    dev_terminal: DevTerminal,
    saas_modern: SaaSModern,

    // Creative
    ux_folio: UXFolio,
    creative_dark: CreativeDark,

    // Professional
    legal_trust: LegalTrust,
    writer_editorial: WriterEditorial,
    executive_brief: ExecutiveBrief,

    // Specialist
    medical_care: MedicalCare,
    academic_research: AcademicResearch,
    bento_personal: BentoPersonal,

    // Link-in-Bio (NEW)
    linktree_minimal: LinkTreeMinimal,
    linktree_visual: LinkTreeVisual,
    linktree_corporate: LinkTreeCorporate,
    linktree_bento: LinkTreeBento,

    // NFC Business Cards (NEW)
    card_minimal: CardMinimal,
    card_photo: CardPhoto,
    card_modern: CardModern,
};

export type TemplateId = keyof typeof TEMPLATES;
