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

type GoogleDocsExportInput = {
    resumeData?: ResumeData;
    documentData?: ExportDocumentData;
    accessToken: string;
};

export const exportToGoogleDocs = functions
    .region("us-west1")
    .runWith({ timeoutSeconds: 60, memory: "512MB" })
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
        }

        return exportGoogleDocsDocument(data as GoogleDocsExportInput);
    });

export const exportCoverLetterToGoogleDocs = functions
    .region("us-west1")
    .runWith({ timeoutSeconds: 60, memory: "512MB" })
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
        }

        const input = data as GoogleDocsExportInput;
        if (input.resumeData) {
            throw new functions.https.HttpsError("invalid-argument", "Cover letter export must not include resumeData.");
        }
        if (input.documentData?.kind !== "cover-letter") {
            throw new functions.https.HttpsError("invalid-argument", "Cover letter export requires documentData.kind='cover-letter'.");
        }

        return exportGoogleDocsDocument(input);
    });

async function exportGoogleDocsDocument({ resumeData, documentData, accessToken }: GoogleDocsExportInput) {
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

        // Folder Logic (Find or Create target folder)
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

        insertText(`${resumeData.personalDetails.firstName} ${resumeData.personalDetails.lastName}`, "TITLE");

        const contact = [
            resumeData.personalDetails.email,
            resumeData.personalDetails.phone,
            resumeData.personalDetails.city
        ].filter(Boolean).join(" | ");
        insertText(contact, "SUBTITLE");

        if (resumeData.professionalSummary) {
            insertText("Professional Summary", "HEADING_1");
            insertText(resumeData.professionalSummary, "NORMAL_TEXT");
        }

        if (resumeData.employmentHistory && resumeData.employmentHistory.length > 0) {
            insertText("Experience", "HEADING_1");
            for (const job of resumeData.employmentHistory) {
                insertText(`${job.jobTitle} at ${job.employer}`, "HEADING_2");
                insertText(`${job.startDate} - ${job.endDate}`, "NORMAL_TEXT");
                insertText(stripHtml(job.description), "NORMAL_TEXT");
            }
        }

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

        if (resumeData.skills && resumeData.skills.length > 0) {
            insertText("Skills", "HEADING_1");
            const skillText = resumeData.skills.map(s => s.name).join(", ");
            insertText(skillText, "NORMAL_TEXT");
        }

        if (requests.length > 0) {
            await docs.documents.batchUpdate({
                documentId: docId,
                requestBody: { requests },
            });
        }

        return { success: true, docUrl: webViewLink };
    } catch (error: any) {
        console.error("Google Docs Export Error:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", error.message || "Failed to export document");
    }
}

// Helper to strip simple HTML tags (since editor might output HTML)
function stripHtml(html: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ");
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
