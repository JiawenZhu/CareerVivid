// General Templates
import MinimalTemplate from './MinimalTemplate';
import CorporateTemplate from './CorporateTemplate';
// Technology Templates
import DevTerminal from './general/Gen_Dev_Terminal';

// Creative Templates

// Professional Templates
import WriterEditorial from './WriterEditorial';

// Specialist Templates

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
    corporate: CorporateTemplate,

    // Technology
    dev_terminal: DevTerminal,

    // Professional
    writer_editorial: WriterEditorial,

    // Link-in-Bio (NEW)
    linktree_minimal: LinkTreeMinimal,
    linktree_visual: LinkTreeVisual,
    linktree_corporate: LinkTreeCorporate,
    linktree_bento: LinkTreeBento,

    // NFC Business Cards (NEW)
    card_minimal: CardMinimal,
    card_photo: CardPhoto,
    card_modern: CardModern,

    // Neo-Brutalism
    brutalist_yellow: CardPhoto,
    brutalist_pink: CardPhoto,
    brutalist_blue: CardPhoto,
    brutalist_bw: CardPhoto,
    brutalist_orange: CardPhoto,

    // Professional / Creative
    pro_executive: CardPhoto,
    pro_clean: CardPhoto,
    creative_gradient: CardPhoto,
    card_creative_dark: CardPhoto,
    nature_calm: CardPhoto,
    tech_future: CardPhoto,
    abstract_art: CardPhoto,
};

export type TemplateId = keyof typeof TEMPLATES;
