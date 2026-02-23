import * as functions from "firebase-functions";
import { google } from "googleapis";
import { ResumeData } from "./types";

export const exportToGoogleDocs = functions
    .region("us-west1")
    .runWith({ timeoutSeconds: 60, memory: "512MB" })
    .https.onCall(async (data, context) => {
        // 1. Auth Check
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
        }

        const { resumeData, accessToken } = data as { resumeData: ResumeData, accessToken: string };

        if (!accessToken) {
            throw new functions.https.HttpsError("invalid-argument", "Missing Google Access Token.");
        }

        try {
            const auth = new google.auth.OAuth2();
            auth.setCredentials({ access_token: accessToken });

            const drive = google.drive({ version: "v3", auth });
            const docs = google.docs({ version: "v1", auth });

            // 2. Folder Logic (Find or Create 'CareerVivid Resumes')
            let folderId: string;
            const folderSearch = await drive.files.list({
                q: "mimeType='application/vnd.google-apps.folder' and name='CareerVivid Resumes' and trashed=false",
                fields: "files(id)",
                spaces: "drive",
            });

            if (folderSearch.data.files && folderSearch.data.files.length > 0) {
                folderId = folderSearch.data.files[0].id!;
            } else {
                const folderMetadata = {
                    name: "CareerVivid Resumes",
                    mimeType: "application/vnd.google-apps.folder",
                };
                const folder = await drive.files.create({
                    requestBody: folderMetadata,
                    fields: "id",
                });
                folderId = folder.data.id!;
            }

            // 3. Create Doc
            const createResponse = await drive.files.create({
                requestBody: {
                    name: `Resume - ${resumeData.personalDetails.firstName} ${resumeData.personalDetails.lastName}`,
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

// Helper to strip simple HTML tags (since editor might output HTML)
function stripHtml(html: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ");
}
