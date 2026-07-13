import * as functions from "firebase-functions/v1";
import { google } from "googleapis";
import { ResumeData } from "./types";

type ExportDocumentData = {
    kind?: "cover-letter" | "document";
    title: string;
    subtitle?: string;
    body: string;
    folderName?: string;
    fileName?: string;
};

export const exportToGoogleDocs = functions
    .region("us-west1")
    .runWith({ timeoutSeconds: 60, memory: "512MB" })
    .https.onCall(async (data, context) => {
        // 1. Auth Check
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
        }

        const { resumeData, documentData, accessToken } = data as {
            resumeData?: ResumeData;
            documentData?: ExportDocumentData;
            accessToken: string;
        };

        if (!accessToken) {
            throw new functions.https.HttpsError("invalid-argument", "Missing Google Access Token.");
        }
        if (!resumeData && !documentData) {
            throw new functions.https.HttpsError("invalid-argument", "Missing export document data.");
        }

        try {
            const auth = new google.auth.OAuth2();
            auth.setCredentials({ access_token: accessToken });

            const drive = google.drive({ version: "v3", auth });
            const docs = google.docs({ version: "v1", auth });

            const folderName = documentData?.folderName || "CareerVivid Resumes";

            // 2. Folder Logic (Find or Create target folder)
            let folderId: string;
            const folderSearch = await drive.files.list({
                q: `mimeType='application/vnd.google-apps.folder' and name='${escapeDriveQuery(folderName)}' and trashed=false`,
                fields: "files(id)",
                spaces: "drive",
            });

            if (folderSearch.data.files && folderSearch.data.files.length > 0) {
                folderId = folderSearch.data.files[0].id!;
            } else {
                const folderMetadata = {
                    name: folderName,
                    mimeType: "application/vnd.google-apps.folder",
                };
                const folder = await drive.files.create({
                    requestBody: folderMetadata,
                    fields: "id",
                });
                folderId = folder.data.id!;
            }

            const documentName = documentData?.fileName ||
                (resumeData ? `Resume - ${resumeData.personalDetails.firstName} ${resumeData.personalDetails.lastName}` : documentData?.title) ||
                "CareerVivid Document";

            // 3. Create Doc
            const createResponse = await drive.files.create({
                requestBody: {
                    name: documentName,
                    mimeType: "application/vnd.google-apps.document",
                    parents: [folderId],
                },
                fields: "id, webViewLink",
            });

            const docId = createResponse.data.id!;
            const webViewLink = createResponse.data.webViewLink;

            // 4. Map Content to Requests
            const requests: any[] = [];
            let currentIndex = 1;

            const insertText = (text: string, style?: string) => {
                if (!text) return;
                const end = currentIndex + text.length;
                requests.push({
                    insertText: {
                        text: text + "\n",
                        location: { index: currentIndex },
                    },
                });
                if (style) {
                    requests.push({
                        updateParagraphStyle: {
                            range: { startIndex: currentIndex, endIndex: end },
                            paragraphStyle: { namedStyleType: style },
                            fields: "namedStyleType",
                        },
                    });
                }
                currentIndex += text.length + 1;
            };

            if (documentData) {
                insertGenericDocument(documentData, insertText);
                if (requests.length > 0) {
                    await docs.documents.batchUpdate({
                        documentId: docId,
                        requestBody: { requests },
                    });
                }
                return { success: true, docUrl: webViewLink };
            }

            if (!resumeData) {
                throw new functions.https.HttpsError("invalid-argument", "Missing resume data.");
            }

            // Title (Name)
            insertText(`${resumeData.personalDetails.firstName} ${resumeData.personalDetails.lastName}`, "TITLE");

            // Contact Info (Subtitle style for now)
            const contact = [
                resumeData.personalDetails.email,
                resumeData.personalDetails.phone,
                resumeData.personalDetails.city
            ].filter(Boolean).join(" | ");
            insertText(contact, "SUBTITLE");

            // Summary
            if (resumeData.professionalSummary) {
                insertText("Professional Summary", "HEADING_1");
                insertText(resumeData.professionalSummary, "NORMAL_TEXT");
            }

            // Experience
            if (resumeData.employmentHistory && resumeData.employmentHistory.length > 0) {
                insertText("Experience", "HEADING_1");
                for (const job of resumeData.employmentHistory) {
                    // Job Title & Company (Using HEADING_2 to act as subheader)
                    insertText(`${job.jobTitle} at ${job.employer}`, "HEADING_2");

                    const dates = `${job.startDate} - ${job.endDate}`;
                    insertText(dates, "NORMAL_TEXT"); // TODO: Make italic in future iteration

                    // Description (Simple text for now, could be bullet points)
                    // We assume description is HTML or text. If HTML, we strip it simply here.
                    const desc = stripHtml(job.description);
                    insertText(desc, "NORMAL_TEXT");
                }
            }

            // Education
            if (resumeData.education && resumeData.education.length > 0) {
                insertText("Education", "HEADING_1");
                for (const edu of resumeData.education) {
                    insertText(`${edu.degree} - ${edu.school}`, "HEADING_2");
                    insertText(`${edu.startDate} - ${edu.endDate}`, "NORMAL_TEXT");
                    if (edu.description) {
                        insertText(stripHtml(edu.description), "NORMAL_TEXT");
                    }
                }
            }

            // Skills
            if (resumeData.skills && resumeData.skills.length > 0) {
                insertText("Skills", "HEADING_1");
                const skillText = resumeData.skills.map(s => s.name).join(", ");
                insertText(skillText, "NORMAL_TEXT");
            }

            // 5. Execute Batch Update
            if (requests.length > 0) {
                await docs.documents.batchUpdate({
                    documentId: docId,
                    requestBody: { requests },
                });
            }

            return { success: true, docUrl: webViewLink };

        } catch (error: any) {
            console.error("Google Docs Export Error:", error);
            throw new functions.https.HttpsError("internal", error.message || "Failed to export document");
        }
    });

// Convert editor HTML to text before it is sent to Google Docs. This is not an
// HTML sanitizer: the export contract is text-only, so no markup is retained.
function stripHtml(html: string): string {
    if (!html) return "";
    const decoded = html.replace(/&(?:(#x[0-9a-f]+)|(#\d+)|([a-z]+));/gi, (entity, hex, decimal, named) => {
        if (hex) return String.fromCodePoint(Number.parseInt(hex.slice(2), 16));
        if (decimal) return String.fromCodePoint(Number.parseInt(decimal.slice(1), 10));
        return ({ amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: "\"" } as Record<string, string>)[named?.toLowerCase()] ?? entity;
    });

    return decoded
        .replace(/<style\b[^>]*>[\s\S]*?<\/\s*style\s*>/gi, " ")
        .replace(/<script\b[^>]*>[\s\S]*?<\/\s*script\s*>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/[<>]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeDriveQuery(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function insertGenericDocument(
    documentData: ExportDocumentData,
    insertText: (text: string, style?: string) => void
) {
    const title = stripHtml(documentData.title || "CareerVivid Document").trim();
    const subtitle = stripHtml(documentData.subtitle || "").trim();
    const body = stripHtml(documentData.body || "").replace(/\r\n/g, "\n").trim();

    insertText(title, "TITLE");
    if (subtitle) insertText(subtitle, "SUBTITLE");

    const paragraphs = body
        .split(/\n{2,}/)
        .map(paragraph => paragraph.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
        .filter(Boolean);

    for (const paragraph of paragraphs) {
        insertText(paragraph, "NORMAL_TEXT");
    }
}
