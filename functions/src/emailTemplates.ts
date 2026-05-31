export interface EmailTemplateProps {
    title: string;
    userName: string;
    messageLines: string[];
    boxContent?: {
        title?: string;
        lines: string[];
        type: 'warning' | 'info' | 'success' | 'critical';
    };
    mainButton?: {
        text: string;
        url: string;
    };
    secondaryButton?: {
        text: string;
        url: string;
    };
    footerText?: string;
    preheader?: string;
    eyebrow?: string;
    closingName?: string;
    closingRole?: string;
}

const SYSTEM_NOTIFICATION_FOOTER = "You are receiving this system notification because you are a registered user of CareerVivid. You can easily modify your delivery frequency or opt-out of specific communication tracks at any time by updating your account settings directly at https://careervivid.app/profile.";

const COLORS = {
    page: '#f7f1e8',
    panel: '#fffaf4',
    card: '#ffffff',
    ink: '#211b16',
    muted: '#6f6257',
    softText: '#8a7a6a',
    border: '#eadcc7',
    accent: '#9a651f',
    accentDark: '#6f4212',
    infoBg: '#eef5f2',
    infoBorder: '#bdd2ca',
    successBg: '#eff6ec',
    successBorder: '#bdd3b3',
    warningBg: '#fff5d8',
    warningBorder: '#e9c56e',
    criticalBg: '#fff0ec',
    criticalBorder: '#e4b0a4',
};

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

function renderPreheader(text?: string): string {
    if (!text) return '';

    return `
        <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">
            ${escapeHtml(text)}
        </div>
    `;
}

function renderBox(props: EmailTemplateProps): string {
    if (!props.boxContent) return '';

    const boxStyles = {
        info: { bg: COLORS.infoBg, border: COLORS.infoBorder },
        success: { bg: COLORS.successBg, border: COLORS.successBorder },
        warning: { bg: COLORS.warningBg, border: COLORS.warningBorder },
        critical: { bg: COLORS.criticalBg, border: COLORS.criticalBorder },
    }[props.boxContent.type || 'info'];

    return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
            <tr>
                <td style="background-color: ${boxStyles.bg}; border: 1px solid ${boxStyles.border}; border-radius: 12px; padding: 22px 22px 18px 22px;">
                    ${props.boxContent.title ? `
                        <p style="margin: 0 0 12px 0; font-family: Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.4; color: ${COLORS.accentDark}; font-weight: 700; letter-spacing: 0.04em;">
                            ${props.boxContent.title}
                        </p>
                    ` : ''}
                    ${props.boxContent.lines.map(line => `
                        <p style="margin: 0 0 10px 0; font-family: Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.55; color: ${COLORS.ink};">
                            ${line}
                        </p>
                    `).join('')}
                </td>
            </tr>
        </table>
    `;
}

function renderButtons(props: EmailTemplateProps): string {
    if (!props.mainButton && !props.secondaryButton) return '';

    const main = props.mainButton ? `
        <table border="0" cellspacing="0" cellpadding="0" style="margin: 0;">
            <tr>
                <td align="left" style="border-radius: 8px; background-color: ${COLORS.accent};">
                    <a href="${escapeAttribute(props.mainButton.url)}" style="display: inline-block; padding: 14px 22px; border-radius: 8px; color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1; font-weight: 700; text-decoration: none;">
                        ${escapeHtml(props.mainButton.text)}
                    </a>
                </td>
            </tr>
        </table>
    ` : '';

    const secondary = props.secondaryButton ? `
        <p style="margin: ${props.mainButton ? '18px 0 0 0' : '0'}; font-family: Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            <a href="${escapeAttribute(props.secondaryButton.url)}" style="color: ${COLORS.accentDark}; text-decoration: underline; font-weight: 700;">
                ${escapeHtml(props.secondaryButton.text)}
            </a>
        </p>
    ` : '';

    return `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0 8px 0;">
            <tr>
                <td align="left">
                    ${main}
                    ${secondary}
                </td>
            </tr>
        </table>
    `;
}

export function generateCareerVividEmail(props: EmailTemplateProps): string {
    const firstName = props.userName?.trim()?.split(/\s+/)[0] || 'there';
    const safeFirstName = escapeHtml(firstName);
    const safeTitle = escapeHtml(props.title);
    const safeEyebrow = props.eyebrow ? escapeHtml(props.eyebrow) : 'CareerVivid';
    const closingName = escapeHtml(props.closingName || 'The CareerVivid Team');
    const closingRole = props.closingRole ? escapeHtml(props.closingRole) : '';

    return `
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>${safeTitle}</title>
</head>
<body style="margin:0; padding:0; background-color:${COLORS.page}; font-family: Helvetica, Arial, sans-serif;">
    ${renderPreheader(props.preheader)}
    <center style="width:100%; background-color:${COLORS.page};">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${COLORS.page};">
            <tr>
                <td align="center" style="padding: 34px 14px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px;">
                        <tr>
                            <td align="center" style="padding: 0 0 20px 0;">
                                <p style="margin:0; font-family: Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1; color:${COLORS.ink}; font-weight: 800; letter-spacing: 0;">
                                    CareerVivid
                                </p>
                                <p style="margin: 8px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.4; color:${COLORS.softText};">
                                    Job search workspace
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 0 0 18px 0;">
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${COLORS.panel}; border:1px solid ${COLORS.border}; border-radius:18px;">
                                    <tr>
                                        <td align="center" style="padding: 42px 34px 34px 34px;">
                                            <p style="margin: 0 0 12px 0; font-family: Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.4; color:${COLORS.accentDark}; font-weight: 700;">
                                                ${safeEyebrow}
                                            </p>
                                            <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 38px; line-height: 1.05; color:${COLORS.ink}; font-weight: 700; letter-spacing: 0;">
                                                ${safeTitle}
                                            </h1>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color:${COLORS.card}; border:1px solid ${COLORS.border}; border-radius:14px; padding: 34px 32px;">
                                <p style="margin: 0 0 20px 0; font-family: Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color:${COLORS.ink};">
                                    Hi ${safeFirstName},
                                </p>
                                ${props.messageLines.map(line => `
                                    <p style="margin: 0 0 16px 0; font-family: Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.65; color:${COLORS.ink};">
                                        ${line}
                                    </p>
                                `).join('')}
                                ${renderBox(props)}
                                ${renderButtons(props)}
                                <p style="margin: 34px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color:${COLORS.ink};">
                                    ${closingName}${closingRole ? `<br><span style="color:${COLORS.muted};">${closingRole}</span>` : ''}
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 24px 22px 0 22px;">
                                <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color:${COLORS.muted};">
                                    ${props.footerText || SYSTEM_NOTIFICATION_FOOTER}
                                </p>
                                <p style="margin: 10px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color:${COLORS.softText};">
                                    CareerVivid, ${new Date().getFullYear()} &middot; <a href="https://careervivid.app" style="color:${COLORS.accentDark}; text-decoration: underline;">careervivid.app</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
    `;
}

export function generateNeoBrutalistEmail(props: EmailTemplateProps): string {
    return generateCareerVividEmail(props);
}

export {
    careerVividEmailTemplateCatalog,
    careerVividEmailTokens,
    generateCareerVividModuleEmail,
} from './emailTemplateLibrary';
export type {
    CareerVividEmailActivity,
    CareerVividEmailButton,
    CareerVividEmailFeature,
    CareerVividEmailModule,
    CareerVividEmailStat,
    CareerVividEmailTemplateCatalogItem,
    CareerVividEmailVisual,
    CareerVividModuleEmailProps,
    CareerVividProductMockup,
} from './emailTemplateLibrary';
