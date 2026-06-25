import Foundation

#if os(iOS)
import SwiftUI
import UIKit

// MARK: - Resume PDF Export

/// Generates a PDF from an EditableResume.
///
/// Strategy:
///   1. If the resume has a `remoteId` (saved in Firestore), fetches the PDF from
///      the `generateResumePdfHttp` cloud function — same high-quality render as the web app.
///   2. Falls back to on-device HTML→PDF via `UIPrintPageRenderer` when offline or
///      when the resume has never been saved.
///
/// Usage:
/// ```swift
/// let url  = try await ResumePDFExport.exportURL(for: resume)
/// // present url via UIActivityViewController or ShareLink
/// ```
struct ResumePDFExport {

    // MARK: - Public entry point

    /// Returns a temporary file URL containing the PDF data.
    /// The caller is responsible for deleting the file when finished.
    static func exportURL(
        for resume: EditableResume,
        auth: CVFirebaseAuth = .shared
    ) async throws -> URL {
        let data = try await makePDF(for: resume, auth: auth)
        return try writeTempFile(data: data, resume: resume)
    }

    // MARK: - PDF generation

    static func makePDF(
        for resume: EditableResume,
        auth: CVFirebaseAuth = .shared
    ) async throws -> Data {
        // Prefer the cloud render when the resume is saved
        if let remoteId = resume.remoteId,
           let data = try? await cloudPDF(remoteId: remoteId, auth: auth) {
            return data
        }
        return await nativePDF(resume: resume)
    }

    // MARK: - Cloud PDF (generateResumePdfHttp)

    private static func cloudPDF(remoteId: String, auth: CVFirebaseAuth) async throws -> Data {
        let (uid, token) = try await auth.authToken()
        let url = URL(string: "https://us-west1-jastalk-firebase.cloudfunctions.net/generateResumePdfHttp")!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json",    forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)",     forHTTPHeaderField: "Authorization")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["userId": uid, "resumeId": remoteId])
        req.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode) else {
            throw PDFExportError.cloudFailed
        }
        return data
    }

    // MARK: - Native HTML → PDF (fallback)

    @MainActor
    static func nativePDF(resume: EditableResume) async -> Data {
        let html = buildHTML(resume: resume)

        let formatter = UIMarkupTextPrintFormatter(markupText: html)
        let renderer  = UIPrintPageRenderer()
        renderer.addPrintFormatter(formatter, startingAtPageAt: 0)

        let pageRect     = CGRect(x: 0, y: 0, width: 595.2, height: 841.8)  // A4 @ 72 dpi
        let printableRect = pageRect.insetBy(dx: 36, dy: 48)
        renderer.setValue(NSValue(cgRect: pageRect),     forKey: "paperRect")
        renderer.setValue(NSValue(cgRect: printableRect), forKey: "printableRect")

        let pdfData = NSMutableData()
        UIGraphicsBeginPDFContextToData(pdfData, pageRect, nil)
        renderer.prepare(forDrawingPages: NSRange(location: 0, length: renderer.numberOfPages))
        for i in 0..<renderer.numberOfPages {
            UIGraphicsBeginPDFPage()
            renderer.drawPage(at: i, in: UIGraphicsGetPDFContextBounds())
        }
        UIGraphicsEndPDFContext()
        return pdfData as Data
    }

    // MARK: - HTML template

    private static func buildHTML(resume: EditableResume) -> String {
        let accent = hexColor(resume.templateID.accentColor)

        // Personal info header
        let contactParts = [
            resume.personalInfo.email,
            resume.personalInfo.phone,
            resume.personalInfo.location,
            resume.personalInfo.linkedin
        ].filter { !$0.isEmpty }

        // Employment history
        let expHTML = resume.experiences.map { exp -> String in
            let bullets = exp.bullets.map { b in "<li>\(htmlEsc(b))</li>" }.joined()
            return """
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">\(htmlEsc(exp.role))</span>
                <span class="entry-right">\(htmlEsc(exp.period))</span>
              </div>
              <div class="entry-sub">\(htmlEsc(exp.company))</div>
              \(bullets.isEmpty ? "" : "<ul>\(bullets)</ul>")
            </div>
            """
        }.joined()

        // Education
        let eduHTML = resume.education.map { edu -> String in
            """
            <div class="entry">
              <div class="entry-header">
                <span class="entry-title">\(htmlEsc(edu.degree))</span>
                <span class="entry-right">\(htmlEsc(edu.year))</span>
              </div>
              <div class="entry-sub">\(htmlEsc(edu.school))</div>
            </div>
            """
        }.joined()

        let skillsHTML = resume.skills.isEmpty ? "" : """
        <div class="section">
          <div class="section-heading">Skills</div>
          <p class="skills-line">\(htmlEsc(resume.skills.joined(separator: "   •   ")))</p>
        </div>
        """

        return """
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8"/>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
                 font-size: 9.5pt; color: #222; line-height: 1.4; }

          .accent-bar { height: 5px; background: \(accent); margin-bottom: 14px; }

          .name  { font-size: 20pt; font-weight: 800; color: #111; margin-bottom: 3px; }
          .title { font-size: 11pt; font-weight: 500; color: #555; margin-bottom: 4px; }
          .contact { font-size: 8pt; color: #888; margin-bottom: 16px; }

          .section { margin-bottom: 14px; }
          .section-heading {
            font-size: 8pt; font-weight: 700; letter-spacing: 1.2px;
            text-transform: uppercase; color: #333;
            background: \(accent)22;
            padding: 3px 6px; margin-bottom: 8px;
          }

          .entry { margin-bottom: 9px; }
          .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
          .entry-title  { font-size: 10pt; font-weight: 600; color: #111; }
          .entry-right  { font-size: 8.5pt; color: #777; }
          .entry-sub    { font-size: 9pt; color: #666; margin-top: 1px; margin-bottom: 4px; }
          ul { padding-left: 16px; margin-top: 3px; }
          li { font-size: 9pt; color: #333; margin-bottom: 2px; }

          .summary { font-size: 9.5pt; color: #444; line-height: 1.5; }
          .skills-line { font-size: 9pt; color: #444; }
        </style>
        </head>
        <body>
          <div class="accent-bar"></div>
          <div class="name">\(htmlEsc(resume.personalInfo.name))</div>
          <div class="title">\(htmlEsc(resume.personalInfo.title))</div>
          <div class="contact">\(contactParts.map(htmlEsc).joined(separator: "   •   "))</div>

          \(resume.summary.isEmpty ? "" : """
          <div class="section">
            <div class="section-heading">Summary</div>
            <p class="summary">\(htmlEsc(resume.summary))</p>
          </div>
          """)

          \(expHTML.isEmpty ? "" : """
          <div class="section">
            <div class="section-heading">Experience</div>
            \(expHTML)
          </div>
          """)

          \(eduHTML.isEmpty ? "" : """
          <div class="section">
            <div class="section-heading">Education</div>
            \(eduHTML)
          </div>
          """)

          \(skillsHTML)
        </body>
        </html>
        """
    }

    // MARK: - Helpers

    private static func writeTempFile(data: Data, resume: EditableResume) throws -> URL {
        let safe = (resume.personalInfo.name.isEmpty ? "Resume" : resume.personalInfo.name)
            .replacingOccurrences(of: " ", with: "_")
            .filter { $0.isLetter || $0.isNumber || $0 == "_" }
        let filename = "\(safe)_Resume.pdf"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        try data.write(to: url)
        return url
    }

    private static func htmlEsc(_ s: String) -> String {
        s
            .replacingOccurrences(of: "&",  with: "&amp;")
            .replacingOccurrences(of: "<",  with: "&lt;")
            .replacingOccurrences(of: ">",  with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
    }

    private static func hexColor(_ color: Color) -> String {
        #if os(iOS)
        let uiColor = UIColor(color)
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        uiColor.getRed(&r, green: &g, blue: &b, alpha: &a)
        return String(format: "#%02X%02X%02X", Int(r * 255), Int(g * 255), Int(b * 255))
        #else
        return "#625BD5"
        #endif
    }
}

// MARK: - Errors

enum PDFExportError: Error, LocalizedError {
    case cloudFailed
    public var errorDescription: String? {
        "PDF generation failed. The resume will be rendered on-device instead."
    }
}

#endif // os(iOS)
