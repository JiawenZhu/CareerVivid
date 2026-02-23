export interface EmailTemplateProps {
    title: string;
    userName: string;
    messageLines: string[]; // Array of paragraphs
    boxContent?: {
        title?: string;
        lines: string[];
        type: 'warning' | 'info' | 'success' | 'critical'; // Defaults to info
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
}

/**
 * Generates a Neo-Brutalist HTML email (Bio-Link Style)
 * Features:
 * - 4px black borders
 * - Hard shadows (8px)
 * - Dot pattern background simulation (via solid color #f0f0f0)
 * - Heavy, uppercase typography
 */
export function generateNeoBrutalistEmail(props: EmailTemplateProps): string {
    const { title, userName, messageLines, boxContent, mainButton, secondaryButton, footerText } = props;

    // Bio-Link Brutalist Palette
    const COLORS = {
        bg: '#f0f0f0', // Light grey from BioLinksPage
        cardBg: '#ffffff',
        border: '#000000',
        shadow: '#000000',

        // Header
        headerBg: '#ffffff', // Clean white header per Bio-Link style
        headerText: '#000000',

        // Button (Indigo/Purple as primary accent)
        btnPrimary: '#4f46e5', // Indigo-600
        btnPrimaryText: '#ffffff',

        btnSecondary: '#ffffff',
        btnSecondaryText: '#000000',

        // Box Types (Vibrant/Pastel Brutalist)
        boxInfoBg: '#A7F3D0', // Green (Mint)

        boxWarningBg: '#FDE047', // Vibrant Yellow

        boxCriticalBg: '#fecaca', // Red-200

        boxSuccessBg: '#A7F3D0', // Green
    };

    // Helper to render box
    const renderBox = () => {
        if (!boxContent) return '';

        let bg = COLORS.boxInfoBg;
        const type = boxContent.type || 'info';

        if (type === 'warning') bg = COLORS.boxWarningBg;
        if (type === 'critical') bg = COLORS.boxCriticalBg;
        if (type === 'success') bg = COLORS.boxSuccessBg;

        return `
            <!-- ALERT BOX -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                    <td style="background-color: ${bg}; border: 3px solid #000000; padding: 20px; box-shadow: 4px 4px 0px 0px #000000;">
                        ${boxContent.title ? `<h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #000000; text-transform: uppercase; font-family: 'Arial Black', Helvetica, Arial, sans-serif;">${boxContent.title}</h3>` : ''}
                        ${boxContent.lines.map(line => `<p style="margin: 4px 0; font-size: 16px; color: #000000; font-family: Helvetica, Arial, sans-serif; font-weight: 500;">${line}</p>`).join('')}
                    </td>
                </tr>
            </table>
        `;
    };

    // Helper to render buttons
    const renderButtons = () => {
        let buttonsHtml = '';

        if (mainButton) {
            buttonsHtml += `
            <table border="0" cellspacing="0" cellpadding="0" style="margin: 10px 0;">
                <tr>
                    <td align="center">
                        <a href="${mainButton.url}" style="display: inline-block; padding: 16px 32px; background-color: ${COLORS.btnPrimary}; color: ${COLORS.btnPrimaryText}; text-decoration: none; border: 3px solid #000000; font-weight: 800; font-size: 16px; font-family: 'Arial Black', Helvetica, Arial, sans-serif; text-transform: uppercase; box-shadow: 4px 4px 0px 0px #000000;">
                            ${mainButton.text}
                        </a>
                    </td>
                </tr>
            </table>
            `;
        }

        if (secondaryButton) {
            buttonsHtml += `
            <table border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0 10px 0;">
                <tr>
                   <td align="center">
                        <a href="${secondaryButton.url}" style="display: inline-block; padding: 12px 24px; color: #000000; text-decoration: underline; font-weight: 700; font-size: 14px; font-family: Helvetica, Arial, sans-serif; text-transform: uppercase;">
                            ${secondaryButton.text}
                        </a>
                   </td>
                </tr>
            </table>
            `;
        }

        return buttonsHtml ? `<div style="text-align: center; margin: 30px 0;">${buttonsHtml}</div>` : '';
    };

    return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.bg}; font-family: Helvetica, Arial, sans-serif;">
    <center>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
            <tr>
                <td style="padding: 40px 20px;">
                    
                    <!-- MAIN CARD -->
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 4px solid #000000; box-shadow: 8px 8px 0px 0px #000000;">
                        
                        <!-- HEADER -->
                        <tr>
                            <td style="padding: 40px 20px 20px 20px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #000000;">
                                <h1 style="margin: 0; color: #000000; font-family: 'Arial Black', Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; line-height: 1.1;">
                                    ${title}
                                </h1>
                            </td>
                        </tr>

                        <!-- CONTENT -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 800; color: #000000; font-family: Helvetica, Arial, sans-serif;">
                                    HI ${userName.toUpperCase()},
                                </p>
                                
                                ${messageLines.map(line => `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #000000; font-weight: 500;">${line}</p>`).join('')}

                                ${renderBox()}

                                ${renderButtons()}

                                <p style="margin: 40px 0 0 0; font-size: 16px; font-weight: 800; text-transform: uppercase;">
                                    The CareerVivid Team
                                </p>
                            </td>
                        </tr>

                        <!-- FOOTER -->
                        <tr>
                            <td style="background-color: #000000; padding: 20px; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #ffffff; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                    ${footerText || 'Questions? Reply to this email'}
                                </p>
                                <p style="margin: 10px 0 0 0; font-size: 12px; color: #a3a3a3;">
                                    © ${new Date().getFullYear()} CareerVivid
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
