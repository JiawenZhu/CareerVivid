import Foundation
import SwiftUI

public enum JobStage: String, CaseIterable, Identifiable, Sendable {
    case saved     = "Saved"
    case applied   = "Applied"
    case interview = "Interview"
    case offer     = "Offer"

    public var id: String { rawValue }
}

public struct JobLead: Identifiable, Equatable, Sendable {
    public let id: UUID
    public var title: String
    public var company: String
    public var matchScore: Int
    public var stage: JobStage
    public var nextStep: String

    public init(
        id: UUID = UUID(),
        title: String,
        company: String,
        matchScore: Int,
        stage: JobStage,
        nextStep: String
    ) {
        self.id = id
        self.title = title
        self.company = company
        self.matchScore = matchScore
        self.stage = stage
        self.nextStep = nextStep
    }
}

public struct InterviewPractice: Identifiable, Equatable, Sendable {
    public let id: UUID
    public var title: String
    public var company: String
    public var score: Int
    public var focus: String
    public var duration: String

    public init(
        id: UUID = UUID(),
        title: String,
        company: String,
        score: Int,
        focus: String,
        duration: String
    ) {
        self.id = id
        self.title = title
        self.company = company
        self.score = score
        self.focus = focus
        self.duration = duration
    }
}

public struct ResumeSnapshot: Equatable, Sendable {
    public var title: String
    public var targetRole: String
    public var matchScore: Int
    public var updatedAt: String
    public var strengths: [String]

    public init(
        title: String,
        targetRole: String,
        matchScore: Int,
        updatedAt: String,
        strengths: [String]
    ) {
        self.title = title
        self.targetRole = targetRole
        self.matchScore = matchScore
        self.updatedAt = updatedAt
        self.strengths = strengths
    }
}

public struct NextAction: Identifiable, Equatable, Sendable {
    public let id: UUID
    public var title: String
    public var detail: String
    public var dueLabel: String
    public var systemImage: String

    public init(
        id: UUID = UUID(),
        title: String,
        detail: String,
        dueLabel: String,
        systemImage: String
    ) {
        self.id = id
        self.title = title
        self.detail = detail
        self.dueLabel = dueLabel
        self.systemImage = systemImage
    }
}

public enum SampleCareerVividData {
    public static let jobs: [JobLead] = [
        JobLead(
            title: "Full Stack Engineer",
            company: "Stripe",
            matchScore: 95,
            stage: .interview,
            nextStep: "Prepare system design"
        ),
        JobLead(
            title: "AI Product Engineer",
            company: "OpenAI",
            matchScore: 88,
            stage: .applied,
            nextStep: "Follow up Thursday"
        ),
        JobLead(
            title: "Frontend Engineer",
            company: "Linear",
            matchScore: 91,
            stage: .applied,
            nextStep: "Waiting for response"
        ),
        JobLead(
            title: "Software Engineer",
            company: "Notion",
            matchScore: 83,
            stage: .saved,
            nextStep: "Tailor resume"
        )
    ]

    public static let interviews: [InterviewPractice] = [
        InterviewPractice(
            title: "Design a rate limiter",
            company: "Stripe mock",
            score: 78,
            focus: "System design",
            duration: "14 min"
        ),
        InterviewPractice(
            title: "Tell me about a conflict",
            company: "Behavioral",
            score: 65,
            focus: "Communication",
            duration: "8 min"
        )
    ]

    public static let resume = ResumeSnapshot(
        title: "Jiawen Zhu — Software Engineer",
        targetRole: "Full Stack Engineer",
        matchScore: 92,
        updatedAt: "Updated today",
        strengths: [
            "React & TypeScript",
            "System design",
            "Cloud & Firebase"
        ]
    )

    public static let actions: [NextAction] = [
        NextAction(
            title: "Practice system design",
            detail: "Stripe interview is next — run a 15-min mock.",
            dueLabel: "Today",
            systemImage: "mic.circle.fill"
        ),
        NextAction(
            title: "Follow up with OpenAI",
            detail: "It's been 5 days — send a brief check-in.",
            dueLabel: "Today",
            systemImage: "paperplane.fill"
        ),
        NextAction(
            title: "Tailor resume for Notion",
            detail: "Saved but not yet tailored.",
            dueLabel: "Next",
            systemImage: "doc.text.magnifyingglass"
        )
    ]
}

// MARK: - Resume Editor Models

public enum ResumeTemplateID: String, CaseIterable, Identifiable, Sendable {
    case modern  = "Modern"
    case classic = "Classic"
    case minimal = "Minimal"
    public var id: String { rawValue }
}

public struct PersonalInfo: Equatable, Sendable {
    public var name: String
    public var title: String
    public var email: String
    public var phone: String
    public var location: String
    public var linkedin: String

    public init(
        name: String = "", title: String = "", email: String = "",
        phone: String = "", location: String = "", linkedin: String = ""
    ) {
        self.name = name; self.title = title; self.email = email
        self.phone = phone; self.location = location; self.linkedin = linkedin
    }
}

public struct WorkExperience: Identifiable, Equatable, Sendable {
    public var id: UUID
    public var company: String
    public var role: String
    public var period: String
    public var bullets: [String]

    public init(id: UUID = UUID(), company: String = "", role: String = "",
                period: String = "", bullets: [String] = [""]) {
        self.id = id; self.company = company; self.role = role
        self.period = period; self.bullets = bullets
    }
}

public struct EducationEntry: Identifiable, Equatable, Sendable {
    public var id: UUID
    public var school: String
    public var degree: String
    public var year: String

    public init(id: UUID = UUID(), school: String = "", degree: String = "", year: String = "") {
        self.id = id; self.school = school; self.degree = degree; self.year = year
    }
}

public struct EditableResume: Identifiable, Equatable, Sendable {
    public var id: UUID
    public var remoteId: String?
    public var templateID: ResumeTemplateID
    public var personalInfo: PersonalInfo
    public var summary: String
    public var experiences: [WorkExperience]
    public var education: [EducationEntry]
    public var skills: [String]
    public var updatedAt: String

    public init(
        id: UUID = UUID(),
        remoteId: String? = nil,
        templateID: ResumeTemplateID = .modern,
        personalInfo: PersonalInfo = PersonalInfo(),
        summary: String = "",
        experiences: [WorkExperience] = [],
        education: [EducationEntry] = [],
        skills: [String] = [],
        updatedAt: String = ISO8601DateFormatter().string(from: Date())
    ) {
        self.id = id; self.remoteId = remoteId; self.templateID = templateID; self.personalInfo = personalInfo
        self.summary = summary; self.experiences = experiences
        self.education = education; self.skills = skills; self.updatedAt = updatedAt
    }
}

// MARK: - Practice Models

public enum PracticeCategory: String, CaseIterable, Identifiable, Sendable {
    case behavioral   = "Behavioral"
    case systemDesign = "System Design"
    case technical    = "Technical"
    case leadership   = "Leadership"
    public var id: String { rawValue }

    public var icon: String {
        switch self {
        case .behavioral:   return "person.2.fill"
        case .systemDesign: return "server.rack"
        case .technical:    return "chevron.left.forwardslash.chevron.right"
        case .leadership:   return "star.fill"
        }
    }
}

public struct PracticeQuestion: Identifiable, Sendable {
    public let id: UUID
    public let text: String
    public let category: PracticeCategory
    public let tips: [String]

    public init(id: UUID = UUID(), text: String, category: PracticeCategory, tips: [String]) {
        self.id = id; self.text = text; self.category = category; self.tips = tips
    }
}

// MARK: - Sample Data additions

extension SampleCareerVividData {
    public static let editableResume = EditableResume(
        templateID: .modern,
        personalInfo: PersonalInfo(
            name: "Jiawen Zhu", title: "Software Engineer",
            email: "evan@careervivid.app", phone: "+1 (415) 000-0000",
            location: "San Francisco, CA", linkedin: "linkedin.com/in/jiawenzhu"
        ),
        summary: "Full-stack engineer with 5+ years building products at scale. Passionate about great UX and clean architecture.",
        experiences: [
            WorkExperience(company: "CareerVivid", role: "Founder & Engineer",
                           period: "2024 – Present",
                           bullets: ["Built AI-powered career platform serving 500+ users",
                                     "Developed Chrome Extension with 200+ installs",
                                     "Integrated Gemini AI for resume tailoring"]),
            WorkExperience(company: "Jastalk", role: "Senior Software Engineer",
                           period: "2021 – 2024",
                           bullets: ["Led team of 4 engineers", "Scaled to 10,000+ daily active users"])
        ],
        education: [
            EducationEntry(school: "University of Toronto", degree: "B.Sc. Computer Science", year: "2021")
        ],
        skills: ["Swift", "SwiftUI", "React", "TypeScript", "Firebase", "Node.js", "Python", "System Design"]
    )

    public static let questionBank: [PracticeQuestion] = [
        PracticeQuestion(text: "Tell me about a time you had a conflict with a teammate. How did you resolve it?",
                         category: .behavioral,
                         tips: ["Use STAR method (Situation, Task, Action, Result)",
                                "Show empathy and communication skills",
                                "End with what you learned or a positive outcome"]),
        PracticeQuestion(text: "Describe a situation where you had to work under tight deadlines.",
                         category: .behavioral,
                         tips: ["Quantify the deadline pressure",
                                "Explain your prioritization approach",
                                "Mention the outcome and what you'd do differently"]),
        PracticeQuestion(text: "Tell me about your greatest professional achievement.",
                         category: .behavioral,
                         tips: ["Pick something measurable with clear impact",
                                "Explain your specific contribution vs. the team's",
                                "Connect it to the role you're applying for"]),
        PracticeQuestion(text: "Design a URL shortener like bit.ly.",
                         category: .systemDesign,
                         tips: ["Start with requirements (scale, read vs. write ratio)",
                                "Cover storage, hashing strategy, and DB choice",
                                "Discuss caching, CDN, and analytics"]),
        PracticeQuestion(text: "How would you design a real-time chat system?",
                         category: .systemDesign,
                         tips: ["Discuss WebSockets vs. long polling",
                                "Cover message storage and delivery guarantees",
                                "Handle presence/online status and offline queuing"]),
        PracticeQuestion(text: "Design a rate limiter for an API.",
                         category: .systemDesign,
                         tips: ["Compare token bucket vs. sliding window algorithms",
                                "Consider distributed rate limiting with Redis",
                                "Discuss failure modes and header responses"]),
        PracticeQuestion(text: "Explain how you would optimize a slow database query.",
                         category: .technical,
                         tips: ["Start with EXPLAIN / query plan analysis",
                                "Discuss indexing strategies for your access patterns",
                                "Consider caching, pagination, and query rewrites"]),
        PracticeQuestion(text: "What is the difference between concurrency and parallelism?",
                         category: .technical,
                         tips: ["Concurrency = managing multiple tasks (may interleave)",
                                "Parallelism = executing simultaneously on multiple cores",
                                "Give a concrete example from your own work"]),
        PracticeQuestion(text: "Tell me about a time you led a project without formal authority.",
                         category: .leadership,
                         tips: ["Show how you built consensus across stakeholders",
                                "Highlight how you handled resistance or disagreement",
                                "Quantify the outcome"]),
        PracticeQuestion(text: "How do you handle disagreements with your manager?",
                         category: .leadership,
                         tips: ["Show you can disagree professionally and directly",
                                "Demonstrate active listening before escalating",
                                "Show you can commit once a decision is made"])
    ]
}

public func makeCapturedJob(from urlText: String, existingCount: Int) -> JobLead {
    let trimmed = urlText.trimmingCharacters(in: .whitespacesAndNewlines)
    let company: String
    if trimmed.contains("linkedin") { company = "LinkedIn Import" }
    else if trimmed.contains("greenhouse") { company = "Greenhouse Import" }
    else { company = "Saved Job" }

    return JobLead(
        title: "Captured role \(existingCount + 1)",
        company: company,
        matchScore: 78,
        stage: .saved,
        nextStep: "Review and tailor"
    )
}

// MARK: - Visa Type

public enum VisaType: String, CaseIterable, Identifiable, Sendable {
    case b1b2 = "B1/B2"
    case f1   = "F-1 Student"
    case h1b  = "H-1B Work"
    case j1   = "J-1 Exchange"

    public var id: String { rawValue }

    public var fullTitle: String {
        switch self {
        case .b1b2: return "Tourist & Business"
        case .f1:   return "Student Visa"
        case .h1b:  return "Work Visa"
        case .j1:   return "Exchange Visitor"
        }
    }

    public func fullTitle(language: AppLanguage) -> String {
        VisaTranslations.uiString(fullTitle, language: language)
    }

    public var subtitle: String {
        switch self {
        case .b1b2: return "Tourism, family visits, business trips"
        case .f1:   return "Full-time academic study"
        case .h1b:  return "Specialty occupation employment"
        case .j1:   return "Cultural exchange programs"
        }
    }

    public var icon: String {
        switch self {
        case .b1b2: return "airplane"
        case .f1:   return "graduationcap.fill"
        case .h1b:  return "briefcase.fill"
        case .j1:   return "globe.americas.fill"
        }
    }
}

// MARK: - Visa Question Category

public enum VisaQuestionCategory: String, CaseIterable, Identifiable, Sendable {
    case purpose    = "Purpose of Visit"
    case tiesHome   = "Ties to Home Country"
    case financial  = "Financial Proof"
    case travel     = "Travel History"
    case background = "Background"
    case education  = "Education & Plans"

    public var id: String { rawValue }

    public var icon: String {
        switch self {
        case .purpose:    return "mappin.circle.fill"
        case .tiesHome:   return "house.fill"
        case .financial:  return "dollarsign.circle.fill"
        case .travel:     return "globe"
        case .background: return "person.fill"
        case .education:  return "book.fill"
        }
    }

    public func title(language: AppLanguage) -> String {
        VisaTranslations.uiString(rawValue, language: language)
    }
}

// MARK: - Visa Question

public struct VisaQuestion: Identifiable, Sendable {
    public let id: UUID
    public let text: String
    public let category: VisaQuestionCategory
    public let tips: [String]
    public let modelAnswer: String
    public let visaTypes: [VisaType]

    public init(id: UUID = UUID(), text: String, category: VisaQuestionCategory,
                tips: [String], modelAnswer: String, visaTypes: [VisaType]) {
        self.id = id; self.text = text; self.category = category
        self.tips = tips; self.modelAnswer = modelAnswer; self.visaTypes = visaTypes
    }

    public func localizedText(language: AppLanguage) -> String {
        VisaTranslations.localization(for: self, language: language)?.text ?? text
    }

    public func localizedTips(language: AppLanguage) -> [String] {
        VisaTranslations.localization(for: self, language: language)?.tips ?? tips
    }

    public func localizedModelAnswer(language: AppLanguage) -> String {
        VisaTranslations.localization(for: self, language: language)?.modelAnswer ?? modelAnswer
    }
}

// MARK: - Document Item

public struct DocumentItem: Identifiable, Sendable {
    public let id: UUID
    public let name: String
    public let detail: String
    public let group: String
    public let visaTypes: [VisaType]

    public var localizedName: String {
        VisaTranslations.uiString(name)
    }
    public var localizedDetail: String {
        VisaTranslations.uiString(detail)
    }
    public var localizedGroup: String {
        VisaTranslations.uiString(group)
    }

    public init(id: UUID = UUID(), name: String, detail: String,
                group: String, visaTypes: [VisaType]) {
        self.id = id; self.name = name; self.detail = detail
        self.group = group; self.visaTypes = visaTypes
    }
}

// MARK: - Document Intelligence

public struct DocumentAnalysisResult: Identifiable, Equatable, Sendable {
    public let id: UUID
    public var documentType: String
    public var confidence: Double
    public var extractedFields: [String: String]
    public var missingFields: [String]
    public var warnings: [String]
    public var matchedChecklistItems: [String]
    public var suggestedVisaTypes: [VisaType]
    public var recognizedText: String

    public init(
        id: UUID = UUID(),
        documentType: String,
        confidence: Double,
        extractedFields: [String: String],
        missingFields: [String],
        warnings: [String],
        matchedChecklistItems: [String],
        suggestedVisaTypes: [VisaType] = [],
        recognizedText: String
    ) {
        self.id = id
        self.documentType = documentType
        self.confidence = confidence
        self.extractedFields = extractedFields
        self.missingFields = missingFields
        self.warnings = warnings
        self.matchedChecklistItems = matchedChecklistItems
        self.suggestedVisaTypes = suggestedVisaTypes
        self.recognizedText = recognizedText
    }
}

public enum VisaDocumentAnalyzer {
    public static func analyze(recognizedText: String, visaType: VisaType, checklist: [DocumentItem]) -> DocumentAnalysisResult {
        let normalized = recognizedText.lowercased()
        let candidates = documentCandidates(for: normalized, visaType: visaType)
        let best = candidates.max { $0.score < $1.score }
        let documentType = best?.type ?? "Unknown document"
        let confidence = min(0.98, max(0.18, Double(best?.score ?? 12) / 100.0))
        let matched = matchedChecklistItems(for: documentType, normalized: normalized, checklist: checklist)
        let suggestedVisaTypes = suggestedVisaTypes(for: documentType)
        let fields = extractedFields(from: recognizedText, normalized: normalized, documentType: documentType)
        let missing = missingFields(for: documentType, extractedFields: fields)
        let warnings = warnings(
            for: documentType,
            confidence: confidence,
            recognizedText: recognizedText,
            extractedFields: fields,
            matchedItems: matched,
            currentVisaType: visaType,
            suggestedVisaTypes: suggestedVisaTypes
        )

        return DocumentAnalysisResult(
            documentType: documentType,
            confidence: confidence,
            extractedFields: fields,
            missingFields: missing,
            warnings: warnings,
            matchedChecklistItems: matched,
            suggestedVisaTypes: suggestedVisaTypes,
            recognizedText: recognizedText
        )
    }

    private static func documentCandidates(for text: String, visaType: VisaType) -> [(type: String, score: Int)] {
        var scores: [String: Int] = [:]

        func score(_ type: String, _ points: Int, when keywords: [String]) {
            let hits = keywords.filter { text.contains($0) }.count
            if hits > 0 { scores[type, default: 0] += hits * points }
        }

        score("Valid Passport", 24, when: ["passport", "passport no", "passport number", "nationality", "date of expiry", "issuing authority"])
        score("DS-160 Confirmation Page", 26, when: ["ds-160", "confirmation page", "application id", "ceac", "nonimmigrant visa application"])
        score("MRV Fee Payment Receipt", 24, when: ["mrv", "visa fee", "receipt", "payment", "ustraveldocs"])
        score("Bank Statements (last 6 months)", 20, when: ["bank statement", "account number", "available balance", "ending balance", "statement period"])
        score("Pay Stubs or Salary Certificate", 18, when: ["pay stub", "earnings", "gross pay", "net pay", "salary certificate"])
        score("Income Tax Returns (last 2 years)", 18, when: ["tax return", "form 1040", "income tax", "tax year"])
        score("Employment Letter from Employer", 18, when: ["employment letter", "employed", "job title", "annual salary", "leave approved"])
        score("Round-Trip Flight Itinerary", 18, when: ["flight itinerary", "departure", "arrival", "return flight", "reservation code"])
        score("Hotel Reservations", 18, when: ["hotel", "reservation", "check-in", "check-out", "booking"])
        score("Form I-20 from University", 28, when: ["form i-20", "certificate of eligibility", "sevis id", "school official", "student and exchange visitor"])
        score("SEVIS Fee Receipt (Form I-901)", 24, when: ["i-901", "sevis fee", "fmjfee", "payment confirmation"])
        score("University Acceptance Letter", 18, when: ["acceptance letter", "admitted", "congratulations", "university", "program"])
        score("Academic Transcripts", 18, when: ["transcript", "grade point", "credits", "course", "gpa"])
        score("English Proficiency Scores (TOEFL/IELTS)", 18, when: ["toefl", "ielts", "overall band", "ets", "test taker"])
        score("I-797 Approval Notice (Original)", 28, when: ["i-797", "approval notice", "uscis", "notice type", "valid from"])
        score("Copy of I-129 Petition", 22, when: ["i-129", "petition for a nonimmigrant worker", "petitioner", "beneficiary"])
        score("Labor Condition Application (LCA)", 22, when: ["labor condition application", "lca", "department of labor", "eta"])
        score("Offer Letter from US Employer", 18, when: ["offer letter", "start date", "base salary", "position", "employment offer"])
        score("Form DS-2019 (Certificate of Eligibility)", 28, when: ["ds-2019", "exchange visitor", "program sponsor", "sevis id"])
        score("Sponsor Program Letter", 18, when: ["program sponsor", "exchange program", "sponsor letter"])
        score("Resume / CV", 16, when: ["resume", "curriculum vitae", "experience", "education", "skills"])

        switch visaType {
        case .f1:
            scores["Form I-20 from University", default: 0] += 6
            scores["University Acceptance Letter", default: 0] += 4
        case .h1b:
            scores["I-797 Approval Notice (Original)", default: 0] += 6
            scores["Offer Letter from US Employer", default: 0] += 4
        case .j1:
            scores["Form DS-2019 (Certificate of Eligibility)", default: 0] += 6
            scores["Sponsor Program Letter", default: 0] += 4
        case .b1b2:
            scores["DS-160 Confirmation Page", default: 0] += 3
            scores["Round-Trip Flight Itinerary", default: 0] += 3
        }

        return scores.map { ($0.key, $0.value) }
    }

    private static func matchedChecklistItems(for documentType: String, normalized: String, checklist: [DocumentItem]) -> [String] {
        let allowedNames = checklistAliases(for: documentType)
        return checklist.filter { allowedNames.contains($0.name) }.map(\.name)
    }

    private static func checklistAliases(for documentType: String) -> Set<String> {
        let aliases: [String: Set<String>] = [
            "SEVIS Fee Receipt (Form I-901)": ["SEVIS Fee Receipt (Form I-901)", "SEVIS Fee Receipt (I-901)"],
            "SEVIS Fee Receipt (I-901)": ["SEVIS Fee Receipt (Form I-901)", "SEVIS Fee Receipt (I-901)"],
            "Form I-20 from University": ["Form I-20 from University"],
            "Form DS-2019 (Certificate of Eligibility)": ["Form DS-2019 (Certificate of Eligibility)"],
            "I-797 Approval Notice (Original)": ["I-797 Approval Notice (Original)"],
            "Copy of I-129 Petition": ["Copy of I-129 Petition"],
            "Labor Condition Application (LCA)": ["Labor Condition Application (LCA)"],
            "Offer Letter from US Employer": ["Offer Letter from US Employer"],
            "Sponsor Program Letter": ["Sponsor Program Letter"],
            "Valid Passport": ["Valid Passport"],
            "DS-160 Confirmation Page": ["DS-160 Confirmation Page"],
            "MRV Fee Payment Receipt": ["MRV Fee Payment Receipt"],
            "Bank Statements (last 6 months)": ["Bank Statements (last 6 months)", "Financial Support Documentation"],
            "Financial Support Documentation": ["Bank Statements (last 6 months)", "Financial Support Documentation"],
            "Pay Stubs or Salary Certificate": ["Pay Stubs or Salary Certificate"],
            "Income Tax Returns (last 2 years)": ["Income Tax Returns (last 2 years)"],
            "Employment Letter from Employer": ["Employment Letter from Employer"],
            "Round-Trip Flight Itinerary": ["Round-Trip Flight Itinerary"],
            "Hotel Reservations": ["Hotel Reservations"],
            "University Acceptance Letter": ["University Acceptance Letter"],
            "Academic Transcripts": ["Academic Transcripts", "Degree Certificate and Transcripts"],
            "English Proficiency Scores (TOEFL/IELTS)": ["English Proficiency Scores (TOEFL/IELTS)"],
            "Resume / CV": ["Resume / CV"]
        ]
        return aliases[documentType] ?? [documentType]
    }

    private static func suggestedVisaTypes(for documentType: String) -> [VisaType] {
        let allowedNames = checklistAliases(for: documentType)
        let allTypes = VisaSampleData.documents
            .filter { allowedNames.contains($0.name) }
            .flatMap(\.visaTypes)
        return VisaType.allCases.filter { allTypes.contains($0) }
    }

    private static func extractedFields(from text: String, normalized: String, documentType: String) -> [String: String] {
        var fields: [String: String] = [:]

        if let sevis = firstMatch(in: text, pattern: #"\bN\d{10}\b"#) {
            fields["SEVIS ID"] = sevis
        }
        if let passport = firstMatch(in: text, pattern: #"\b[A-Z][0-9]{7,9}\b"#) {
            fields["Passport number"] = passport
        }
        if let application = firstMatch(in: text, pattern: #"\bAA[0-9A-Z]{8,12}\b"#) {
            fields["DS-160 application ID"] = application
        }
        if let receipt = firstMatch(in: text, pattern: #"\b[A-Z]{3}[0-9]{10,13}\b"#), documentType.contains("I-797") {
            fields["USCIS receipt number"] = receipt
        }
        if let date = firstMatch(in: text, pattern: #"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b"#) {
            fields["Date found"] = date
        }
        if normalized.contains("university") || normalized.contains("college") || normalized.contains("institute") {
            if let schoolLine = text
                .components(separatedBy: .newlines)
                .first(where: { line in
                    let lower = line.lowercased()
                    return lower.contains("university") || lower.contains("college") || lower.contains("institute")
                }) {
                fields["School / institution"] = schoolLine.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }
        if normalized.contains("balance") || normalized.contains("tuition") || normalized.contains("salary") {
            if let amount = firstMatch(in: text, pattern: #"\$?\s?\d{1,3}(?:,\d{3})+(?:\.\d{2})?"#) {
                fields["Amount"] = amount.trimmingCharacters(in: .whitespaces)
            }
        }

        return fields
    }

    private static func missingFields(for documentType: String, extractedFields: [String: String]) -> [String] {
        let required: [String]
        switch documentType {
        case "Valid Passport":
            required = ["Passport number", "Date found"]
        case "DS-160 Confirmation Page":
            required = ["DS-160 application ID"]
        case "Form I-20 from University", "Form DS-2019 (Certificate of Eligibility)", "SEVIS Fee Receipt (Form I-901)", "SEVIS Fee Receipt (I-901)":
            required = ["SEVIS ID"]
        case "I-797 Approval Notice (Original)":
            required = ["USCIS receipt number", "Date found"]
        case "University Acceptance Letter":
            required = ["School / institution"]
        case "Bank Statements (last 6 months)", "Financial Support Documentation", "Offer Letter from US Employer":
            required = ["Amount"]
        default:
            required = []
        }
        return required.filter { extractedFields[$0]?.isEmpty ?? true }
    }

    private static func warnings(
        for documentType: String,
        confidence: Double,
        recognizedText: String,
        extractedFields: [String: String],
        matchedItems: [String],
        currentVisaType: VisaType,
        suggestedVisaTypes: [VisaType]
    ) -> [String] {
        var warnings: [String] = []
        if confidence < 0.45 {
            warnings.append("Low confidence. Retake the photo with better lighting and keep all page edges visible.")
        }
        if recognizedText.trimmingCharacters(in: .whitespacesAndNewlines).count < 80 {
            warnings.append("Very little text was detected. This may be a blurry image, non-document photo, or missing page.")
        }
        if matchedItems.isEmpty {
            if !suggestedVisaTypes.isEmpty, !suggestedVisaTypes.contains(currentVisaType) {
                warnings.append("This document belongs to a different visa type. Switch visa type to update the matching checklist.")
            } else {
                warnings.append("No checklist item was matched automatically. Review the recognized text before marking this document ready.")
            }
        }
        if documentType == "Valid Passport", extractedFields["Date found"] == nil {
            warnings.append("Passport expiry date was not clearly detected.")
        }
        return warnings
    }

    private static func firstMatch(in text: String, pattern: String) -> String? {
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return nil }
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        guard let match = regex.firstMatch(in: text, options: [], range: range),
              let swiftRange = Range(match.range, in: text) else {
            return nil
        }
        return String(text[swiftRange])
    }
}

// MARK: - Visa Sample Data

public enum VisaSampleData {

    // MARK: Questions

    public static let questions: [VisaQuestion] = [

        // ─────────────────────────────────────────────
        // MARK: B1/B2 — Purpose of Visit
        // ─────────────────────────────────────────────

        VisaQuestion(
            text: "What is the purpose of your visit to the United States?",
            category: .purpose,
            tips: [
                "State your purpose in one clear sentence first — tourism, family visit, or business conference",
                "Mention specific cities you will visit or activities you have planned",
                "Never say 'I just want to see America' — officers want concrete plans",
                "Your answer must match what you wrote on your DS-160 form exactly"
            ],
            modelAnswer: "I am visiting for tourism. I plan to spend 12 days visiting New York City, Washington D.C., and Niagara Falls. I have confirmed hotel reservations and a round-trip ticket with a fixed return date.",
            visaTypes: [.b1b2]
        ),

        VisaQuestion(
            text: "How long do you plan to stay in the United States?",
            category: .purpose,
            tips: [
                "Give the exact number of days — 'about two weeks' is too vague",
                "Your answer must match your round-trip flight booking precisely",
                "Never say 'as long as possible' — it is the most common red flag",
                "If attending a conference, match your stay to the exact event dates plus one or two days"
            ],
            modelAnswer: "I plan to stay exactly 14 days, from July 10th to July 24th. My return flight is already confirmed and I have a printed itinerary. My employer expects me back on July 25th.",
            visaTypes: [.b1b2]
        ),

        VisaQuestion(
            text: "Where will you be staying during your visit?",
            category: .purpose,
            tips: [
                "Provide the hotel name and city — do not say 'I have not decided yet'",
                "If staying with a friend or family member, provide their name and full address",
                "Have printed hotel confirmation pages ready to show if asked",
                "Avoid stays that are much longer than your hotel reservations suggest"
            ],
            modelAnswer: "I will stay at the Marriott Times Square in New York for the first week, then at the Hyatt Regency in Washington D.C. for the remaining days. I have printed reservations for both.",
            visaTypes: [.b1b2]
        ),

        VisaQuestion(
            text: "Why can't you handle this meeting or conference virtually instead of traveling?",
            category: .purpose,
            tips: [
                "This is a commonly asked 2025–2026 question — be ready for it",
                "Emphasize in-person requirements: hands-on demos, client relationship building, or signing agreements",
                "If visiting family, explain why a physical visit matters — elderly parent, wedding, or milestone event",
                "Never be defensive — answer naturally as if it is a perfectly reasonable question"
            ],
            modelAnswer: "Our annual client summit requires in-person attendance because we conduct product demonstrations and sign partnership agreements. Remote participation is not an option for this specific event, and my key clients are expecting me there.",
            visaTypes: [.b1b2]
        ),

        VisaQuestion(
            text: "Have you been invited by a person or a company in the United States?",
            category: .purpose,
            tips: [
                "If attending a business event, bring the official invitation letter from the US organizer",
                "If visiting family, have the host's contact information and address ready",
                "A written invitation letter significantly strengthens a business or family visit application",
                "Be truthful — the officer may verify company details on the spot"
            ],
            modelAnswer: "Yes, I received an official invitation letter from Salesforce Inc. to attend their annual partner summit in San Francisco. I have the letter here along with my event registration confirmation.",
            visaTypes: [.b1b2]
        ),

        // ─────────────────────────────────────────────
        // MARK: B1/B2 — Ties to Home Country
        // ─────────────────────────────────────────────

        VisaQuestion(
            text: "What is your current job and who is your employer?",
            category: .tiesHome,
            tips: [
                "State your exact job title, employer name, and how long you have been there",
                "Your job is your single strongest reason to return — emphasize it clearly",
                "Bring an employment letter on company letterhead confirming your position and approved leave",
                "If self-employed, mention your business name, how long it has been operating, and any employees"
            ],
            modelAnswer: "I am a Regional Sales Manager at ABC Manufacturing in Mumbai, where I have worked for six years. My company has granted me approved leave for this trip and expects me back on July 25th. I have my employment letter here.",
            visaTypes: [.b1b2, .j1]
        ),

        VisaQuestion(
            text: "Do you have a spouse, children, or parents in your home country?",
            category: .tiesHome,
            tips: [
                "Family dependents are one of the strongest possible ties to your home country",
                "Mention specifics: spouse, school-age children, or elderly parents you support financially",
                "Be concrete — 'My spouse and two children aged 7 and 10 are at home'",
                "If you are single with no dependents, emphasize your job and property ownership instead"
            ],
            modelAnswer: "Yes, my spouse and two young children — aged 8 and 11 — remain at home. I am the primary financial provider for my family. My children are enrolled in school and my spouse has a full-time job there, so we have very strong roots at home.",
            visaTypes: [.b1b2, .f1, .j1]
        ),

        VisaQuestion(
            text: "Do you own property or have financial obligations in your home country?",
            category: .tiesHome,
            tips: [
                "Property ownership is one of the strongest possible ties to your home country",
                "Bring a property deed, mortgage statement, or land title if you own real estate",
                "Even a car loan or long-term lease demonstrates financial commitment at home",
                "Mention any business ownership — registered companies are very strong ties"
            ],
            modelAnswer: "Yes, I own an apartment in Bangalore with an active mortgage. I also own a small retail business registered in my name. I have the property deed and most recent mortgage statement here. These obligations require me to be home.",
            visaTypes: [.b1b2, .f1]
        ),

        VisaQuestion(
            text: "Have you traveled internationally before? Which countries?",
            category: .tiesHome,
            tips: [
                "Prior international travel with timely returns is very positive evidence of trustworthiness",
                "If you have visited Schengen countries, Canada, UK, or Japan, mention it",
                "Be honest — officers can verify your travel history",
                "Prior US visits where you departed on time are especially valuable to mention"
            ],
            modelAnswer: "Yes, I have traveled to Canada, the United Kingdom, and Japan in the past three years — all on short-term visitor visas. Each time I returned home before my authorized stay expired. I also visited the US in 2022 for a conference and departed on schedule.",
            visaTypes: [.b1b2, .f1, .h1b, .j1]
        ),

        // ─────────────────────────────────────────────
        // MARK: B1/B2 — Financial
        // ─────────────────────────────────────────────

        VisaQuestion(
            text: "Who is paying for this trip and how much money do you have available?",
            category: .financial,
            tips: [
                "State the source clearly — personal savings, employer reimbursement, or a named sponsor",
                "Give a specific approximate amount — vague answers like 'enough money' raise red flags",
                "Have your 6-month bank statement ready to present if asked",
                "The amount should clearly exceed your total estimated trip cost"
            ],
            modelAnswer: "I am funding this trip from my personal savings. I currently have approximately $8,000 in my bank account, which comfortably exceeds my estimated trip expenses of about $3,500. My employer is also reimbursing the conference registration fee. I have my bank statements here.",
            visaTypes: [.b1b2, .j1]
        ),

        VisaQuestion(
            text: "What is your monthly or annual salary?",
            category: .financial,
            tips: [
                "Give a specific number — say 'approximately X per month'",
                "Have your most recent pay stub and last two years of tax returns available",
                "Your income should demonstrate you can afford this trip and have reason to return",
                "If self-employed, mention business revenue and bring audited financial statements"
            ],
            modelAnswer: "My annual salary is approximately 1.8 million Indian Rupees, which is roughly $21,000 USD. I have my last two pay stubs and my most recent income tax return here to confirm this.",
            visaTypes: [.b1b2]
        ),

        // ─────────────────────────────────────────────
        // MARK: B1/B2 — Background & Security (2025)
        // ─────────────────────────────────────────────

        VisaQuestion(
            text: "Do you have any relatives or close friends living in the United States?",
            category: .background,
            tips: [
                "Be honest — the officer may already know this from your DS-160",
                "Having US-based relatives is not disqualifying, but you must address the concern directly",
                "Emphasize that your spouse, children, and financial life remain in your home country",
                "Clarify the relative's status if you know it — a US citizen cousin is common and acceptable"
            ],
            modelAnswer: "Yes, I have a cousin who is a US permanent resident living in Chicago. I plan to visit her for a few days during my trip. However, my spouse, children, parents, and my full-time job are all at home — I have every reason to return after this visit.",
            visaTypes: [.b1b2, .f1, .j1]
        ),

        VisaQuestion(
            text: "What social media platforms do you use? What are your usernames?",
            category: .background,
            tips: [
                "This is a standard 2025–2026 question — consular officers routinely ask for social media handles",
                "You already disclosed this on your DS-160 — your spoken answer must match exactly",
                "Keep your public social media profiles professional and consistent with your visa story",
                "Never delete or privatize accounts right before your interview — it can look suspicious"
            ],
            modelAnswer: "I use LinkedIn under my full professional name for networking, and Instagram under my personal handle. Both accounts are listed on my DS-160 exactly as submitted. My LinkedIn profile shows my current job and professional history, which is fully consistent with my application.",
            visaTypes: [.b1b2, .f1, .h1b, .j1]
        ),

        VisaQuestion(
            text: "Have you ever been denied a US visa or any other immigration benefit?",
            category: .background,
            tips: [
                "Always tell the truth — misrepresentation causes a permanent bar from the US",
                "A prior denial is not automatic disqualification if your circumstances have genuinely changed",
                "If previously denied, briefly state what changed — new job, stronger finances, or clearer travel plans",
                "Answer calmly and directly — do not act defensive or evasive"
            ],
            modelAnswer: "No, I have never been denied a US visa or any other immigration benefit. I have not overstayed any previous visas.",
            visaTypes: [.b1b2, .f1, .h1b, .j1]
        ),

        VisaQuestion(
            text: "Do you intend to work or seek employment while in the United States?",
            category: .background,
            tips: [
                "For B1/B2 visitors, working in the US is strictly prohibited — answer 'No' clearly and confidently",
                "If attending a business meeting, clarify it is not paid employment in the US",
                "Any hesitation on this question can trigger deeper questioning",
                "Be specific: 'I am fully employed at home. This visit is strictly for tourism.'"
            ],
            modelAnswer: "No, absolutely not. I am fully employed at home and my visit is strictly for tourism. I have no intention of working in the United States. My employer is expecting me back by my return date.",
            visaTypes: [.b1b2]
        ),

        // ─────────────────────────────────────────────
        // MARK: B1/B2 — Travel History
        // ─────────────────────────────────────────────

        VisaQuestion(
            text: "Have you previously visited the United States? When and why?",
            category: .travel,
            tips: [
                "Be completely honest — the officer has full access to your travel records",
                "If yes, state each visit: year, duration, and purpose",
                "Prior US visits where you departed on time are viewed very positively",
                "If you overstayed a previous visa, disclose it and explain what has changed"
            ],
            modelAnswer: "Yes, I visited the US twice. In 2019 I attended a 5-day business conference in Chicago, and in 2022 I took a 10-day vacation to New York. Both times I departed well before my authorized stay expired and I have the passport stamps to confirm this.",
            visaTypes: [.b1b2, .f1, .h1b, .j1]
        ),

        VisaQuestion(
            text: "Have you ever overstayed a visa in the US or any other country?",
            category: .travel,
            tips: [
                "Always be completely truthful — consular officers have your full immigration record",
                "If you overstayed, explain the circumstances and what has changed since then",
                "An unexplained overstay is one of the most damaging facts in any visa application",
                "Even a minor overstay of a few days should be disclosed and explained calmly"
            ],
            modelAnswer: "No, I have never overstayed a visa in the United States or any other country. I have always departed before my authorized period of admission expired. My passport with exit stamps from prior visits is available if needed.",
            visaTypes: [.b1b2, .f1, .h1b, .j1]
        ),

        VisaQuestion(
            text: "Have you ever been arrested, charged with a crime, or convicted of any offense?",
            category: .background,
            tips: [
                "Answer honestly — criminal records are verified and misrepresentation bars you permanently",
                "Minor traffic violations that did not lead to arrest are generally not required to be disclosed",
                "If you have a record, consult an immigration attorney before your interview",
                "Stay calm and matter-of-fact — do not act nervous or evasive"
            ],
            modelAnswer: "No, I have never been arrested, charged with any crime, or convicted of any offense in any country. I have a completely clean legal record.",
            visaTypes: [.b1b2, .f1, .h1b, .j1]
        ),

        // ─────────────────────────────────────────────
        // MARK: F-1 — Purpose & Academic Intent
        // ─────────────────────────────────────────────

        VisaQuestion(
            text: "Why do you want to study in the United States instead of your home country?",
            category: .purpose,
            tips: [
                "Name specific strengths: a research lab, a specific faculty member, an industry partnership, or program ranking",
                "Generic answers like 'it has better education' will likely get you denied",
                "Connect the US education to career opportunities back in your HOME country",
                "Show you researched the university deeply — mention a professor or lab by name"
            ],
            modelAnswer: "My program at Georgia Tech has the IRIM robotics research lab, where Professor Park is leading autonomous vehicle safety research I want to contribute to. That specific combination of curriculum and faculty mentorship does not exist at institutions in my home country, where robotics programs are still early-stage.",
            visaTypes: [.f1]
        ),

        VisaQuestion(
            text: "Why did you choose this specific university?",
            category: .purpose,
            tips: [
                "Know the program ranking, specific faculty, research labs, or industry partnerships",
                "Connect the program to concrete career goals you will pursue at home after graduation",
                "Avoid generic answers — 'it is a great school' will almost certainly get you rejected",
                "Officers know if you applied to dozens of schools randomly — be specific and deliberate"
            ],
            modelAnswer: "I chose the University of Illinois specifically because their Computer Science department ranks top five for systems research, and Professor Chen's work on distributed databases directly aligns with the infrastructure work I want to do back home. Their industry partnerships with companies like Google and Intel also provide research exposure that strengthens my profile for the job market at home.",
            visaTypes: [.f1]
        ),

        VisaQuestion(
            text: "What is your undergraduate GPA or academic standing?",
            category: .education,
            tips: [
                "State your GPA or percentage clearly — this became a standard question in 2024–2025",
                "If your GPA is lower than expected, proactively explain it with context",
                "Highlight academic honors, publications, or research projects if applicable",
                "Have your official transcripts organized and ready to present"
            ],
            modelAnswer: "I graduated with a 3.8 GPA out of 4.0, placing me in the top 5 percent of my class at IIT Delhi. I also received the Best Research Project Award for my work on machine learning applied to medical imaging. My full official transcripts are here.",
            visaTypes: [.f1]
        ),

        VisaQuestion(
            text: "What field will you study and how does it connect to your career goals at home?",
            category: .education,
            tips: [
                "Name your exact degree and specialization",
                "The critical part: connect it explicitly to career opportunities BACK HOME — this is what the officer is listening for",
                "Research your home country job market for your field and mention specific sectors or employers",
                "Never imply your plan is to work in the US after graduation — that will result in denial"
            ],
            modelAnswer: "I am pursuing a Master of Science in Data Science. My home country's banking and financial sector is rapidly adopting AI-based risk modeling, and there are very few qualified data scientists with US-level training. I plan to return and work at one of the top banks or fintech startups there — the demand is high and the career opportunity is clear.",
            visaTypes: [.f1]
        ),

        VisaQuestion(
            text: "What are your plans immediately after you finish your degree?",
            category: .tiesHome,
            tips: [
                "CRITICAL — This is the most important F-1 question and the most common reason for denial",
                "You must demonstrate a clear, specific, believable intent to return home",
                "Mention a specific job offer, family business, academic position, or career at home waiting for you",
                "Never say 'I would like to stay and work in the US after graduation' — even as a passing thought"
            ],
            modelAnswer: "After completing my master's, I plan to return home immediately and join my family's textile export business, which my father has run for 25 years. I will lead our digital transformation initiative — applying my data science skills to optimize inventory and expand our e-commerce sales internationally. He is counting on me to bring these skills back.",
            visaTypes: [.f1]
        ),

        VisaQuestion(
            text: "Why did you choose this program over cheaper options in Canada, UK, or Australia?",
            category: .purpose,
            tips: [
                "This is a question that became common in 2024–2025 — be ready for it",
                "Justify the higher cost with program-specific reasons: ranking, faculty, research, or industry access",
                "Show you made a deliberate, informed decision — not just that the US felt 'better'",
                "Your financial plan must make the cost seem reasonable relative to your family's resources"
            ],
            modelAnswer: "The specific research group I want to join at MIT does not have a comparable equivalent in Canada or Australia. My career goal is to work in advanced AI safety research, which is concentrated in US universities and labs. The top US graduate credentials in this field open opportunities back home that a Canadian degree simply would not.",
            visaTypes: [.f1]
        ),

        // ─────────────────────────────────────────────
        // MARK: F-1 — Financial
        // ─────────────────────────────────────────────

        VisaQuestion(
            text: "How will you finance your tuition and living expenses?",
            category: .financial,
            tips: [
                "Know the exact total annual cost: tuition plus housing plus food plus other expenses",
                "State the funding source clearly: parents, scholarship, personal savings, or a combination",
                "Have your sponsor's bank statements and a signed sponsorship letter organized and ready",
                "If partially funded by a scholarship, bring the official award letter"
            ],
            modelAnswer: "My education is fully funded by my parents. The total annual cost including tuition and living expenses in Boston is approximately $65,000. My parents have $180,000 in savings dedicated to my education — enough to cover the full two-year program. I have their 12-month bank statement and a signed financial sponsorship letter from my father.",
            visaTypes: [.f1]
        ),

        VisaQuestion(
            text: "What do your parents do for a living? What is their approximate income?",
            category: .financial,
            tips: [
                "Officers ask this to verify your sponsor's income is realistic relative to US education costs",
                "Know your parents' job titles, employer names, and approximate monthly income",
                "Bring supporting documents: their pay stubs, employment letters, or business registration",
                "If your parents run a business, mention annual revenue and how long the business has operated"
            ],
            modelAnswer: "My father is a civil engineer at a government infrastructure firm and earns approximately $3,500 per month. My mother is a school principal with a salary of about $1,800 per month. Together with their savings, they are fully capable of supporting my education. I have their salary certificates and bank statements here.",
            visaTypes: [.f1]
        ),

        VisaQuestion(
            text: "Have you received any scholarship, assistantship, or fellowship?",
            category: .financial,
            tips: [
                "If you have a scholarship, it significantly strengthens your application — mention it proactively",
                "Bring the official award letter specifying the amount, coverage, and duration",
                "A merit-based scholarship signals strong academic credentials to the officer",
                "If you have a TA or RA position, mention your stipend amount and department"
            ],
            modelAnswer: "Yes, I have been awarded a Graduate Research Assistantship from the Department of Electrical Engineering worth $22,000 per year, which fully covers my tuition and provides a monthly stipend of $1,800. I have the official award letter here. My parents are funding my living expenses beyond what the stipend covers.",
            visaTypes: [.f1]
        ),

        VisaQuestion(
            text: "Are you planning to work during your studies?",
            category: .financial,
            tips: [
                "F-1 students may work on campus up to 20 hours per week during the school year — this is legal",
                "Off-campus work requires special authorization — do not claim you will work off campus without it",
                "Never say you need to work to survive — it implies your finances are insufficient",
                "If you have a GA or TA position, mention it — it is legitimate academic employment"
            ],
            modelAnswer: "I plan to focus entirely on my studies. My finances are fully covered by my parents and my research assistantship, so I do not need to work additionally. I am aware of the on-campus work restrictions for F-1 students.",
            visaTypes: [.f1]
        ),

        // ─────────────────────────────────────────────
        // MARK: H-1B — Purpose & Role (2025–2026 Standards)
        // ─────────────────────────────────────────────

        VisaQuestion(
            text: "What company has petitioned for your H-1B and what does that company do?",
            category: .purpose,
            tips: [
                "Know your employer's full legal name, industry sector, and approximate size",
                "The officer verifies employer legitimacy — make sure your description is accurate",
                "If the company is a staffing or consulting firm, be prepared for extra scrutiny",
                "Have your employer's website or company overview ready if asked"
            ],
            modelAnswer: "Salesforce, Inc. — a cloud-based CRM and enterprise software company headquartered in San Francisco with over 70,000 employees globally. They are listed on the NYSE. They petitioned me for a Software Engineer role on their Platform Engineering team.",
            visaTypes: [.h1b]
        ),

        VisaQuestion(
            text: "What is your job title and what do you do on a daily basis?",
            category: .purpose,
            tips: [
                "Your description must match your I-797 petition and LCA exactly — review them the night before",
                "Describe your daily tasks in plain terms: what you build, who you work with, what tools you use",
                "If asked to explain in simpler terms, stay calm and rephrase — do not get defensive",
                "Know your exact worksite address — officers frequently ask where you will be based"
            ],
            modelAnswer: "My title is Senior Software Engineer. On a daily basis I design and build backend APIs, work on distributed database systems, and collaborate with product managers to deliver new features. My primary worksite is Salesforce Tower, 415 Mission Street, San Francisco, CA.",
            visaTypes: [.h1b]
        ),

        VisaQuestion(
            text: "Why can't an American worker do this job instead of you?",
            category: .purpose,
            tips: [
                "This became a standard question in 2025 and is now asked routinely — be fully prepared",
                "Focus on your specific, specialized expertise: advanced degree, unique experience, or rare technical skills",
                "Do not say there are 'no qualified Americans' — instead demonstrate your unique value",
                "Bring documentation: your advanced degree certificate and any specialized certifications"
            ],
            modelAnswer: "My employer selected me for my specialized expertise in large-scale distributed systems architecture developed over eight years in international markets, combined with a Master's degree from a top-ranked institution. The combination of these niche technical skills and domain knowledge is what qualifies me for this specialty occupation role as defined in my petition.",
            visaTypes: [.h1b]
        ),

        VisaQuestion(
            text: "What is your annual salary for this position?",
            category: .financial,
            tips: [
                "Your salary must exactly match the amount in your LCA and I-129 petition — do not guess",
                "Review your LCA the night before and memorize the exact prevailing wage figure",
                "Any discrepancy between your answer and the LCA is a major red flag that triggers scrutiny",
                "Have your offer letter showing the salary figure ready to present"
            ],
            modelAnswer: "My annual base salary is $145,000 as specified in my Labor Condition Application and offer letter. This meets and exceeds the prevailing wage for this role in the San Francisco Bay Area as certified by the Department of Labor. I have my offer letter here.",
            visaTypes: [.h1b]
        ),

        VisaQuestion(
            text: "How does your educational background qualify you for this specialty occupation?",
            category: .education,
            tips: [
                "A specialty occupation requires at minimum a bachelor's degree in a directly related field",
                "Explain the direct connection between your specific degree and your specific job duties",
                "Bring your original degree certificate and transcripts — originals are strongly preferred",
                "If your degree is from a foreign institution, mention if it was evaluated as equivalent to a US degree"
            ],
            modelAnswer: "I hold a Bachelor of Technology in Computer Science from IIT Bombay and a Master of Science in Computer Science from Carnegie Mellon University. Both degrees directly qualify me for this Software Engineer role. My graduate coursework in distributed systems, algorithms, and computer architecture maps directly to the technical duties listed in my petition.",
            visaTypes: [.h1b]
        ),

        VisaQuestion(
            text: "Where exactly will you be working — what is the worksite address?",
            category: .purpose,
            tips: [
                "Know the exact street address of your primary worksite — officers ask this to verify the LCA",
                "If you work remotely or across multiple sites, know all client site addresses listed in the LCA",
                "Do not confuse your employer's headquarters with your actual worksite if they differ",
                "If your employer is a staffing company, know both the employer address and the end-client worksite"
            ],
            modelAnswer: "My primary worksite is Salesforce Tower, 415 Mission Street, San Francisco, CA 94105. This is the exact address listed in my Labor Condition Application. I will work on-site on the Platform Engineering floor five days a week.",
            visaTypes: [.h1b]
        ),

        VisaQuestion(
            text: "Is your employer a consulting or staffing company placing you at a client site?",
            category: .purpose,
            tips: [
                "If yes, officers will ask detailed questions about the end client and the nature of work",
                "For consulting placements, know the client company name, project scope, and contract duration",
                "Third-party placement H-1B cases receive significantly increased scrutiny in 2025–2026",
                "Have all placement agreements, client letters, and worksite documentation organized"
            ],
            modelAnswer: "My employer is a direct employer, not a staffing or consulting company. I will work exclusively at Salesforce's own offices on products developed and owned by Salesforce. There is no third-party client placement involved in my petition.",
            visaTypes: [.h1b]
        ),

        // ─────────────────────────────────────────────
        // MARK: J-1 — Purpose & Program
        // ─────────────────────────────────────────────

        VisaQuestion(
            text: "What is your J-1 program and who is your sponsoring organization?",
            category: .purpose,
            tips: [
                "Know your sponsor's full official name exactly as listed on your DS-2019",
                "Be ready to describe your exchange program category: intern, trainee, research scholar, teacher",
                "The officer will verify sponsor legitimacy — your answer must match your DS-2019 exactly",
                "Bring your DS-2019, SEVIS fee receipt, and your sponsor's program letter"
            ],
            modelAnswer: "My J-1 sponsor is the Institute of International Education. I am participating as a Research Scholar at the University of Michigan's Department of Biochemistry. My program runs for 12 months from August 2025 through July 2026. I have my DS-2019 and all program documents here.",
            visaTypes: [.j1]
        ),

        VisaQuestion(
            text: "What will you do when your J-1 program ends?",
            category: .tiesHome,
            tips: [
                "J-1 exchange visitors are expected to return home to share the skills they gained — emphasize this clearly",
                "If you are subject to the two-year home residency requirement (212e), acknowledge it honestly",
                "Mention a specific plan at home: an academic position, research role, or teaching post",
                "Show genuine enthusiasm for applying your exchange experience back in your home country"
            ],
            modelAnswer: "When my program ends, I will return home immediately to resume my faculty position at Seoul National University. My department chair has confirmed the position is waiting for me. I will bring back the research techniques from this program to establish a new biochemistry lab there. I am aware of and will comply with the two-year home residency requirement.",
            visaTypes: [.j1]
        ),

        VisaQuestion(
            text: "What specific skills or knowledge will you bring back to your home country?",
            category: .education,
            tips: [
                "This is the core justification of the J-1 visa — demonstrate clear national benefit",
                "Be specific: research methods, lab techniques, pedagogical training, or professional skills",
                "Connect it to your home country's development goals or your institution's strategic needs",
                "Generic answers like 'I will learn a lot' will not satisfy this question"
            ],
            modelAnswer: "I will bring back advanced CRISPR gene-editing techniques and single-cell sequencing methodologies that are not yet established at my home institution. I will then train a new cohort of graduate students in these methods, which directly supports my country's national biomedical research initiative and will help us eventually conduct this research independently.",
            visaTypes: [.j1]
        ),

        VisaQuestion(
            text: "Are you aware of the two-year home residency requirement (212(e))? Does it apply to you?",
            category: .background,
            tips: [
                "212(e) applies if you are funded by your home government, your US program is government-funded, or your field is on your country's Exchange Visitor Skills List",
                "Be honest — immigration attorneys can verify this and misrepresentation is very serious",
                "If it applies, confirm you understand and will comply before seeking any change of status or immigrant visa",
                "Check your DS-2019 — it will state whether the 212(e) requirement applies to your category"
            ],
            modelAnswer: "Yes, I am aware of the 212(e) requirement and it does apply to me because my program is funded by my home government's Ministry of Education scholarship. I fully intend to return home for the required two years after my program ends. I plan to immediately resume my faculty position at my university.",
            visaTypes: [.j1]
        )
    ]

    // MARK: Documents

    public static let documents: [DocumentItem] = [

        // Identity & Application (all visa types)
        DocumentItem(name: "Valid Passport", detail: "Must be valid for at least 6 months beyond your intended stay in the US", group: "Identity & Application", visaTypes: [.b1b2, .f1, .h1b, .j1]),
        DocumentItem(name: "DS-160 Confirmation Page", detail: "Print the confirmation page with barcode after completing the online application", group: "Identity & Application", visaTypes: [.b1b2, .f1, .h1b, .j1]),
        DocumentItem(name: "Visa Application Photo", detail: "2×2 in (51×51 mm), color, white background, taken within last 6 months", group: "Identity & Application", visaTypes: [.b1b2, .f1, .h1b, .j1]),
        DocumentItem(name: "MRV Fee Payment Receipt", detail: "Proof you paid the non-refundable visa application fee at ustraveldocs.com", group: "Identity & Application", visaTypes: [.b1b2, .f1, .h1b, .j1]),

        // B1/B2 — Financial
        DocumentItem(name: "Bank Statements (last 6 months)", detail: "Shows sufficient funds to cover your trip costs and return home", group: "Financial Documents", visaTypes: [.b1b2, .j1]),
        DocumentItem(name: "Pay Stubs or Salary Certificate", detail: "From your employer, showing current salary and active employment status", group: "Financial Documents", visaTypes: [.b1b2, .j1]),
        DocumentItem(name: "Income Tax Returns (last 2 years)", detail: "Establishes your financial history, stability, and income level", group: "Financial Documents", visaTypes: [.b1b2]),
        DocumentItem(name: "Sponsorship Letter (if applicable)", detail: "If someone else is funding your trip, include their financial documents too", group: "Financial Documents", visaTypes: [.b1b2, .j1]),

        // B1/B2 — Ties to Home
        DocumentItem(name: "Employment Letter from Employer", detail: "Confirms your job title, salary, tenure, and approved leave dates", group: "Ties to Home", visaTypes: [.b1b2, .j1]),
        DocumentItem(name: "Property Deed or Mortgage Statement", detail: "Proves you own real estate in your home country — a strong tie", group: "Ties to Home", visaTypes: [.b1b2]),

        // B1/B2 — Travel
        DocumentItem(name: "Round-Trip Flight Itinerary", detail: "Confirmed booking showing entry and exit dates — avoid one-way tickets", group: "Travel Documents", visaTypes: [.b1b2, .j1]),
        DocumentItem(name: "Hotel Reservations", detail: "Print confirmations for all accommodations, or provide your host's address", group: "Travel Documents", visaTypes: [.b1b2]),
        DocumentItem(name: "Travel Insurance", detail: "Recommended — demonstrates preparedness and financial responsibility", group: "Travel Documents", visaTypes: [.b1b2]),

        // F-1 — University
        DocumentItem(name: "Form I-20 from University", detail: "Certificate of Eligibility issued by your school — includes your SEVIS ID", group: "University Documents", visaTypes: [.f1]),
        DocumentItem(name: "SEVIS Fee Receipt (Form I-901)", detail: "Proof you paid the $350 SEVIS fee at fmjfee.com before your interview", group: "University Documents", visaTypes: [.f1]),
        DocumentItem(name: "University Acceptance Letter", detail: "Official letter of admission from your US institution", group: "University Documents", visaTypes: [.f1]),

        // F-1 — Financial
        DocumentItem(name: "Financial Support Documentation", detail: "Bank statements or sponsor letter showing funds for full tuition + living costs", group: "Financial Documents", visaTypes: [.f1]),
        DocumentItem(name: "Scholarship Award Letter (if applicable)", detail: "Official award letter if you are receiving a scholarship or fellowship", group: "Financial Documents", visaTypes: [.f1]),

        // F-1 — Academic
        DocumentItem(name: "Academic Transcripts", detail: "All prior university and high school transcripts — official sealed copies preferred", group: "Academic Records", visaTypes: [.f1]),
        DocumentItem(name: "English Proficiency Scores (TOEFL/IELTS)", detail: "Required by most US universities; bring original score report", group: "Academic Records", visaTypes: [.f1]),
        DocumentItem(name: "GRE / GMAT Scores (if applicable)", detail: "For graduate programs that required them for admission", group: "Academic Records", visaTypes: [.f1]),

        // H-1B — Petition
        DocumentItem(name: "I-797 Approval Notice (Original)", detail: "USCIS approval of your H-1B petition — bring the original, not a photocopy", group: "Petition Documents", visaTypes: [.h1b]),
        DocumentItem(name: "Copy of I-129 Petition", detail: "The full H-1B petition package filed by your employer with USCIS", group: "Petition Documents", visaTypes: [.h1b]),
        DocumentItem(name: "Labor Condition Application (LCA)", detail: "DOL-certified LCA — usually included in your employer's petition package", group: "Petition Documents", visaTypes: [.h1b]),

        // H-1B — Employment
        DocumentItem(name: "Offer Letter from US Employer", detail: "On company letterhead, specifying salary, role title, and start date", group: "Employment Documents", visaTypes: [.h1b]),
        DocumentItem(name: "Support Letter from Employer", detail: "Explains your role, qualifications, and why the position is a specialty occupation", group: "Employment Documents", visaTypes: [.h1b]),

        // H-1B — Academic
        DocumentItem(name: "Degree Certificate and Transcripts", detail: "Proves your academic qualification for the specialty occupation requirement", group: "Academic Records", visaTypes: [.h1b]),
        DocumentItem(name: "Resume / CV", detail: "Updated resume showing work history and skills relevant to the petitioned role", group: "Academic Records", visaTypes: [.h1b]),

        // J-1
        DocumentItem(name: "Form DS-2019 (Certificate of Eligibility)", detail: "Issued by your J-1 program sponsor — required for all J-1 applicants", group: "Program Documents", visaTypes: [.j1]),
        DocumentItem(name: "SEVIS Fee Receipt (I-901)", detail: "J-1 applicants pay a $220 SEVIS fee at fmjfee.com before the interview", group: "Program Documents", visaTypes: [.j1]),
        DocumentItem(name: "Sponsor Program Letter", detail: "Official letter from your J-1 sponsor describing the exchange program and your role", group: "Program Documents", visaTypes: [.j1])
    ]
}

// MARK: - Officer Personality Mode (Feature 6)

public enum OfficerMode: String, CaseIterable, Identifiable, Sendable {
    case friendly     = "Friendly"
    case professional = "Professional"
    case strict       = "Strict"

    public var id: String { rawValue }

    public var icon: String {
        switch self {
        case .friendly:     return "person.fill.checkmark"
        case .professional: return "briefcase.fill"
        case .strict:       return "shield.fill"
        }
    }

    public var description: String {
        switch self {
        case .friendly:     return "Warm and conversational. Puts you at ease."
        case .professional: return "Neutral and formal. Standard embassy style."
        case .strict:       return "Terse and probing. High-pressure simulation."
        }
    }

    /// Prefix added before each question in mock interview
    public func questionPrefix(for question: String) -> String {
        switch self {
        case .friendly:
            return "Thanks for coming in today! \(question)"
        case .professional:
            return question
        case .strict:
            return question.uppercased().hasSuffix("?")
                ? question
                : "\(question). Answer clearly."
        }
    }

    public var greeting: String {
        switch self {
        case .friendly:
            return "Good morning! Please have a seat. I have a few questions for you today — just relax and answer honestly."
        case .professional:
            return "Good morning. I'll be conducting your visa interview. Please answer each question directly and completely."
        case .strict:
            return "State your name and passport number. I will be asking you a series of questions. Keep your answers brief and accurate."
        }
    }

    public var closingMessage: String {
        switch self {
        case .friendly:
            return "That's all for today! Your answers were helpful. We'll be in touch about your visa decision."
        case .professional:
            return "The interview is complete. You will be notified of the decision within the standard processing time."
        case .strict:
            return "Interview concluded. Your application is under review."
        }
    }
}

// MARK: - App Language (Feature 8)

public enum AppLanguage: String, CaseIterable, Identifiable, Sendable {
    case english    = "English"
    case spanish    = "Español"
    case chinese    = "中文"
    case french     = "Français"
    case portuguese = "Português"

    public var id: String { rawValue }
    public var code: String {
        switch self {
        case .english:    return "en"
        case .spanish:    return "es"
        case .chinese:    return "zh"
        case .french:     return "fr"
        case .portuguese: return "pt"
        }
    }
    public var flag: String {
        switch self {
        case .english:    return "🇺🇸"
        case .spanish:    return "🇪🇸"
        case .chinese:    return "🇨🇳"
        case .french:     return "🇫🇷"
        case .portuguese: return "🇧🇷"
        }
    }
}

// MARK: - Multilingual Question Content

public struct VisaQuestionLocalization: Sendable {
    public let text: String
    public let tips: [String]
    public let modelAnswer: String
}

// Translations keyed by AppLanguage.code for shared UI and interview content.
public enum VisaTranslations {
    public static func currentLanguage() -> AppLanguage {
        if let raw = UserDefaults.standard.string(forKey: "preferredLanguage"),
           let lang = AppLanguage(rawValue: raw) {
            return lang
        }
        return .english
    }

    public static func uiString(_ key: String) -> String {
        uiString(key, language: currentLanguage())
    }

    public static func uiString(_ key: String, language: AppLanguage) -> String {
        guard language != .english else { return key }
        return uiTable[key]?[language.code] ?? key
    }

    public static let uiTable: [String: [String: String]] = [
        // Tab Titles
        "Home": ["es": "Inicio", "zh": "首页", "fr": "Accueil", "pt": "Início"],
        "Practice": ["es": "Práctica", "zh": "练习", "fr": "Pratique", "pt": "Prática"],
        "Checklist": ["es": "Requisitos", "zh": "清单", "fr": "Documents", "pt": "Checklist"],
        "Mock": ["es": "Simulación", "zh": "模拟面试", "fr": "Simulation", "pt": "Simulação"],

        // General Home UI
        "Good Morning": ["es": "Buenos Días", "zh": "早上好", "fr": "Bon matin", "pt": "Bom Dia"],
        "Good Afternoon": ["es": "Buenas Tardes", "zh": "下午好", "fr": "Bon après-midi", "pt": "Boa Tarde"],
        "Good Evening": ["es": "Buenas Noches", "zh": "晚上好", "fr": "Bonsoir", "pt": "Boa Noite"],
        "Interview Prep": ["es": "Prep. de Entrevista", "zh": "面试准备", "fr": "Prép. Entretien", "pt": "Prep. de Entrevista"],
        "Interview Language": ["es": "Idioma de la Entrevista", "zh": "面试语言", "fr": "Langue de l'entretien", "pt": "Idioma da Entrevista"],
        "Affects questions & answers": ["es": "Afecta preguntas y respuestas", "zh": "影响提问和回答", "fr": "Affecte les questions & réponses", "pt": "Afeta perguntas e respostas"],
        "Your Visa Type": ["es": "Su Tipo de Visa", "zh": "您的签证类型", "fr": "Votre type de visa", "pt": "Seu Tipo de Visto"],
        "Changes all content": ["es": "Cambia todo el contenido", "zh": "切换全部内容", "fr": "Modifie tout el contenu", "pt": "Altera todo o conteúdo"],
        "Readiness": ["es": "Preparación", "zh": "就绪度", "fr": "État de préparation", "pt": "Preparação"],
        "History": ["es": "Historial", "zh": "历史记录", "fr": "Historique", "pt": "Histórico"],
        "PREPARED": ["es": "PREPARADO", "zh": "就绪度", "fr": "PRÊT", "pt": "PREPARADO"],
        "7-Day Trend": ["es": "Tendencia de 7 Días", "zh": "7天趋势", "fr": "Tendance sur 7 jours", "pt": "Tendência de 7 Dias"],
        "Docs": ["es": "Docs", "zh": "文档", "fr": "Docs", "pt": "Docs"],
        "Questions": ["es": "Preguntas", "zh": "考题", "fr": "Questions", "pt": "Perguntas"],
        "Status": ["es": "Estado", "zh": "状态", "fr": "Statut", "pt": "Status"],
        "Ready": ["es": "Listo", "zh": "已就绪", "fr": "Prêt", "pt": "Pronto"],
        "In Prog.": ["es": "En Prog.", "zh": "进行中", "fr": "En cours", "pt": "Em Prog."],
        "available": ["es": "disponibles", "zh": "可用", "fr": "disponibles", "pt": "disponíveis"],
        "Docs Ready": ["es": "Docs Listos", "zh": "文件就绪", "fr": "Docs Prêts", "pt": "Docs Prontos"],
        "Q&A Available": ["es": "Preguntas Disp.", "zh": "可用问答", "fr": "Q&R Dispo", "pt": "Q&A Disponíveis"],
        "Today's Focus": ["es": "Enfoque de Hoy", "zh": "今日重点", "fr": "Objectif du Jour", "pt": "Foco de Hoje"],
        "Tourist & Business": ["es": "Turismo y negocios", "zh": "旅游与商务", "fr": "Tourisme et affaires", "pt": "Turismo e negócios"],
        "Student Visa": ["es": "Visa de estudiante", "zh": "学生签证", "fr": "Visa étudiant", "pt": "Visto de estudante"],
        "Work Visa": ["es": "Visa de trabajo", "zh": "工作签证", "fr": "Visa de travail", "pt": "Visto de trabalho"],
        "Exchange Visitor": ["es": "Visitante de intercambio", "zh": "交流访问者", "fr": "Visiteur d'échange", "pt": "Visitante de intercâmbio"],

        // Checklist screen
        "Document Checklist": ["es": "Lista de Documentos", "zh": "文件准备清单", "fr": "Liste de Documents", "pt": "Checklist de Documentos"],
        "Documents for": ["es": "Documentos para", "zh": "文件适用于", "fr": "Documents pour", "pt": "Documentos para"],
        "Reset Checklist": ["es": "Reiniciar Lista", "zh": "重置清单", "fr": "Réinitialiser la liste", "pt": "Redefinir Checklist"],
        "All documents gathered — you're ready!": ["es": "¡Todos los documentos reunidos, está listo!", "zh": "所有文件已备齐——您已准备就绪！", "fr": "Tous les documents sont réunis — vous êtes prêt !", "pt": "Todos os documentos reunidos — você está pronto!"],
        "remaining to collect": ["es": "restantes por recolectar", "zh": "待收集", "fr": "restant à collecter", "pt": "restantes para coletar"],
        "%d of %d documents ready": ["es": "%d de %d documentos listos", "zh": "%d / %d 个文件已就绪", "fr": "%d sur %d documents prêts", "pt": "%d de %d documentos prontos"],

        // Document Groups
        "Identity & Application": ["es": "Identidad y Solicitud", "zh": "身份与申请文件", "fr": "Identité & Demande", "pt": "Identidade & Solicitação"],
        "Financial Documents": ["es": "Documentos Financieros", "zh": "财务状况证明", "fr": "Documents Financiers", "pt": "Documentos Financeiros"],
        "Ties to Home": ["es": "Lazos con el País de Origen", "zh": "国内约束力证明", "fr": "Attaches avec le Pays d'Origine", "pt": "Vínculos com o País de Origem"],
        "Travel Documents": ["es": "Documentos de Viaje", "zh": "旅行相关文件", "fr": "Documents de Voyage", "pt": "Documentos de Viagem"],
        "University Documents": ["es": "Documentos Universitarios", "zh": "学术与学校文件", "fr": "Documents Universitaires", "pt": "Documents Universitários"],
        "Academic Records": ["es": "Registros Académicos", "zh": "学术记录与成绩", "fr": "Dossiers Académiques", "pt": "Registros Acadêmicos"],
        "Petition Documents": ["es": "Documentos de Petición", "zh": "工作请愿/申请文件", "fr": "Documents de Pétition", "pt": "Documentos de Petição"],
        "Employment Documents": ["es": "Documentos de Empleo", "zh": "雇佣与职位文件", "fr": "Documents d'Emploi", "pt": "Documentos de Emprego"],
        "Program Documents": ["es": "Documentos del Programa", "zh": "交流项目文件", "fr": "Documents de Programme", "pt": "Documentos do Programa"],

        // Documents
        "Valid Passport": ["es": "Pasaporte Válido", "zh": "有效护照", "fr": "Passeport Valide", "pt": "Passaporte Válido"],
        "Must be valid for at least 6 months beyond your intended stay in the US": ["es": "Debe ser válido por al menos 6 meses más allá de su estadía prevista en los EE. UU.", "zh": "有效期须超出预定在美停留期至少6个月", "fr": "Doit être valide pendant au moins 6 mois après votre séjour prévu aux États-Unis", "pt": "Deve ser válido por pelo menos 6 meses além da sua estadia pretendida nos EUA"],
        "DS-160 Confirmation Page": ["es": "Página de Confirmación del DS-160", "zh": "DS-160确认页", "fr": "Page de Confirmation du DS-160", "pt": "Página de Confirmação do DS-160"],
        "Print the confirmation page with barcode after completing the online application": ["es": "Imprima la página de confirmación con código de barras después de completar la solicitud en línea", "zh": "在线填写申请表后，打印带有条形码的确认页", "fr": "Imprimez la page de confirmation avec code-barres après avoir rempli la demande en ligne", "pt": "Imprima a página de confirmação com código de barras após concluir a inscrição online"],
        "Visa Application Photo": ["es": "Foto para la Solicitud de Visa", "zh": "签证申请照片", "fr": "Photo de Demande de Visa", "pt": "Foto para Solicitação de Visto"],
        "2×2 in (51×51 mm), color, white background, taken within last 6 months": ["es": "2×2 pulgadas (51×51 mm), a color, fondo blanco, tomada en los últimos 6 meses", "zh": "2×2英寸（51×51毫米），彩色，白底，在最近6个月内拍摄", "fr": "2×2 pouces (51×51 mm), en couleur, fond blanc, prise au cours des 6 derniers mois", "pt": "2×2 polegadas (51×51 mm), colorida, fundo branco, tirada nos últimos 6 meses"],
        "MRV Fee Payment Receipt": ["es": "Recibo de Pago de la Tarifa MRV", "zh": "MRV签证费缴费收据", "fr": "Reçu de Paiement des Frais MRV", "pt": "Recibo de Pagamento da Taxa MRV"],
        "Proof you paid the non-refundable visa application fee at ustraveldocs.com": ["es": "Prueba de que pagó la tarifa de solicitud de visa no reembolsable en ustraveldocs.com", "zh": "在 ustraveldocs.com 缴纳不可退还的签证申请费的证明", "fr": "Preuve que vous avez payé les frais de demande de visa non remboursables sur ustraveldocs.com", "pt": "Prova de que você pagou a taxa de solicitação de visto não reembolsável no ustraveldocs.com"],
        "Bank Statements (last 6 months)": ["es": "Estados de Cuenta Bancarios (últimos 6 meses)", "zh": "银行流水（最近6个月）", "fr": "Relevés Bancaires (6 derniers mois)", "pt": "Extratos Bancários (últimos 6 meses)"],
        "Shows sufficient funds to cover your trip costs and return home": ["es": "Muestra fondos suficientes para cubrir los costos del viaje y regresar a casa", "zh": "显示有足够的资金来支付您的旅费并返回祖国", "fr": "Montre des fonds suffisants pour couvrir les frais de voyage et de retour", "pt": "Mostra fundos suficientes para cobrir os custos da viagem e retornar para casa"],
        "Pay Stubs or Salary Certificate": ["es": "Recibos de Nómina o Certificado de Salario", "zh": "工资单或收入证明", "fr": "Fiches de Paie ou Certificat de Salaire", "pt": "Recibos de Pagamento ou Certificado de Salário"],
        "From your employer, showing current salary and active employment status": ["es": "De su empleador, que demuestre el salario actual y el estado laboral activo", "zh": "由雇主出具，显示当前薪资和在职状态", "fr": "De votre employeur, indiquant le salaire actuel et le statut d'emploi actif", "pt": "Do seu empregador, mostrando salário atual e status de emprego ativo"],
        "Income Tax Returns (last 2 years)": ["es": "Declaraciones de Impuestos sobre la Renta (últimos 2 años)", "zh": "个人所得税税单（最近2年）", "fr": "Déclarations de Revenus (2 dernières années)", "pt": "Declarações de Imposto de Renda (últimos 2 anos)"],
        "Establishes your financial history, stability, and income level": ["es": "Establece su historial financiero, estabilidad y nivel de ingresos", "zh": "证明您的财务历史、稳定性和收入水平", "fr": "Établit votre historique financier, votre stabilité et votre niveau de revenus", "pt": "Comprova seu histórico financeiro, estabilidade e nível de renda"],
        "Sponsorship Letter (if applicable)": ["es": "Carta de Patrocinio (si aplica)", "zh": "赞助信/担保函（如适用）", "fr": "Lettre de Parrainage (si applicable)", "pt": "Carta de Patrocínio (se aplicável)"],
        "If someone else is funding your trip, include their financial documents too": ["es": "Si alguien más financia su viaje, incluye también sus documentos financieros", "zh": "如果是他人资助您的旅行，请同时附上他们的财务证明文件", "fr": "Si quelqu'un d'autre finance votre voyage, incluez également ses documents financiers", "pt": "Se outra pessoa estiver financiando sua viagem, inclua os documentos financeiros dela também"],
        "Employment Letter from Employer": ["es": "Carta de Empleo de su Empleador", "zh": "工作证明信", "fr": "Attestation d'Emploi de l'Employeur", "pt": "Declaração de Emprego do Empregador"],
        "Confirms your job title, salary, tenure, and approved leave dates": ["es": "Confirma su puesto, salario, antigüedad y fechas de licencia aprobadas", "zh": "确认您的职位、薪资、任期以及批准的请假日期", "fr": "Confirme votre titre de poste, salaire, ancienneté et dates de congé approuvées", "pt": "Confirma seu cargo, salário, tempo de serviço e datas de licença aprovadas"],
        "Property Deed or Mortgage Statement": ["es": "Escritura de Propiedad o Estado de Hipoteca", "zh": "房产证 or 抵押贷款证明", "fr": "Titre de Propriété ou Relevé Hypothécaire", "pt": "Escritura de Propriedade ou Extrato de Hipoteca"],
        "Proves you own real estate in your home country — a strong tie": ["es": "Prueba que es propietario de bienes raíces en su país de origen — un lazo fuerte", "zh": "证明您在祖国拥有房地产——强有力的回国约束力证明", "fr": "Prouve que vous possédez des biens immobiliers dans votre pays d'origine — un lien fort", "pt": "Prova que você possui bens imóveis em seu país de origem — um forte vínculo"],
        "Round-Trip Flight Itinerary": ["es": "Itinerario de Vuelo de Ida y Vuelta", "zh": "往返机票行程单", "fr": "Itinéraire de Vol Aller-Retour", "pt": "Itinerário de Voo de Ida e Volta"],
        "Confirmed booking showing entry and exit dates — avoid one-way tickets": ["es": "Reserva confirmada que muestra las fechas de entrada y salida; evite boletos de solo ida", "zh": "显示入境和出境日期的已确认预订——避免单程票", "fr": "Réservation confirmée indiquant les dates d'entrée et de sortie — évitez les billets aller simple", "pt": "Reserva confirmada mostrando datas de entrada e saída — evite passagens de ida"],
        "Hotel Reservations": ["es": "Reservaciones de Hotel", "zh": "酒店预订确认单", "fr": "Réservations d'Hôtel", "pt": "Reservas de Hotel"],
        "Print confirmations for all accommodations, or provide your host's address": ["es": "Imprima las confirmaciones de todos los alojamientos o proporcione la dirección de su anfitrión", "zh": "打印所有住宿的确认单，或提供邀请人的地址", "fr": "Imprimez les confirmations de tous les hébergements, ou indiquez l'adresse de votre hôte", "pt": "Imprima as confirmações de todas as acomodações ou forneça o endereço do seu anfitrião"],
        "Travel Insurance": ["es": "Seguro de Viaje", "zh": "旅游保险证明", "fr": "Assurance Voyage", "pt": "Seguro de Viagem"],
        "Recommended — demonstrates preparedness and financial responsibility": ["es": "Recomendado — demuestra preparación y responsabilidad financiera", "zh": "建议携带——证明您的行前准备和财务责任感", "fr": "Recommandé — démontre votre préparation et votre responsabilité financière", "pt": "Recomendado — demonstra preparação e responsabilidade financeira"],
        "Form I-20 from University": ["es": "Formulario I-20 de la Universidad", "zh": "大学发出的I-20表格", "fr": "Formulaire I-20 de l'Université", "pt": "Formulário I-20 da Universidade"],
        "Certificate of Eligibility issued by your school — includes your SEVIS ID": ["es": "Certificado de elegibilidad emitido por su escuela — incluye su ID de SEVIS", "zh": "学校签发的入学资格证书——包含您的SEVIS ID", "fr": "Certificat d'éligibilité délivré par votre école — comprend votre identifiant SEVIS", "pt": "Certificado de Elegibilidade emitido pela sua escola — inclui seu ID SEVIS"],
        "SEVIS Fee Receipt (Form I-901)": ["es": "Recibo de la Tarifa SEVIS (Formulario I-901)", "zh": "SEVIS费收据（I-901表格）", "fr": "Reçu des Frais SEVIS (Formulaire I-901)", "pt": "Recibo da Taxa SEVIS (Formulário I-901)"],
        "Proof you paid the $350 SEVIS fee at fmjfee.com before your interview": ["es": "Prueba de que pagó la tarifa SEVIS de $350 en fmjfee.com antes de su entrevista", "zh": "证明您在面试前已在 fmjfee.com 缴纳了350美元的SEVIS费", "fr": "Preuve que vous avez payé les frais SEVIS de 350 $ sur fmjfee.com avant votre entretien", "pt": "Prova de que você pagou a taxa SEVIS de $350 no fmjfee.com antes da entrevista"],
        "University Acceptance Letter": ["es": "Carta de Aceptación Universitaria", "zh": "大学录取通知书", "fr": "Lettre d'Acceptation de l'Université", "pt": "Carta de Aceitação da Universidade"],
        "Official letter of admission from your US institution": ["es": "Carta oficial de admisión de su institución en los EE. UU.", "zh": "美国院校发出的正式录取信", "fr": "Lettre officielle d'admission de votre établissement américain", "pt": "Carta oficial de admissão da sua instituição nos EUA"],
        "Financial Support Documentation": ["es": "Documentación de Soporte Financiero", "zh": "资金支持证明文件", "fr": "Documentation de Soutien Financier", "pt": "Documentação de Suporte Financeiro"],
        "Bank statements or sponsor letter showing funds for full tuition + living costs": ["es": "Estados de cuenta bancarios o carta del patrocinador que muestre fondos para matrícula completa + costos de vida", "zh": "显示足额支付学费和生活费的银行对账单或资助人保证信", "fr": "Relevés bancaires ou lettre du garant indiquant des fonds pour la totalité des frais de scolarité et de subsistance", "pt": "Extratos bancários ou carta do patrocinador mostrando fundos para o valor total da mensalidade + custos de vida"],
        "Scholarship Award Letter (if applicable)": ["es": "Carta de Concesión de Beca (si aplica)", "zh": "奖学金证明信（如适用）", "fr": "Lettre d'Attribution de Bourse (si applicable)", "pt": "Carta de Concessão de Bolsa (se aplicável)"],
        "Official award letter if you are receiving a scholarship or fellowship": ["es": "Carta oficial de concesión si recibe una beca o subvención", "zh": "如果您获得奖学金或助学金，请出具官方证明信", "fr": "Lettre officielle si vous recevez une bourse ou une allocation", "pt": "Carta de concessão oficial se você estiver recebendo uma bolsa ou auxílio"],
        "Academic Transcripts": ["es": "Certificados Académicos / Transcripciones", "zh": "成绩单", "fr": "Relevés de Notes Académiques", "pt": "Histórico Escolar"],
        "All prior university and high school transcripts — official sealed copies preferred": ["es": "Copias oficiales selladas de todos los certificados previos de secundaria y universidad", "zh": "以往所有大学及高中的成绩单——建议携带官方密封盖章件", "fr": "Tous les relevés de notes universitaires et secondaires précédents — copies officielles scellées de préférence", "pt": "Todos os históricos escolares anteriores do ensino médio e da faculdade — cópias oficiais seladas são preferíveis"],
        "English Proficiency Scores (TOEFL/IELTS)": ["es": "Resultados de Competencia en Inglés (TOEFL/IELTS)", "zh": "英语能力成绩单（TOEFL/IELTS）", "fr": "Scores de Compétence en Anglais (TOEFL/IELTS)", "pt": "Resultados de Proficiência em Inglês (TOEFL/IELTS)"],
        "Required by most US universities; bring original score report": ["es": "Requerido por la mayoría de las universidades de EE. UU.; lleve el reporte de puntaje original", "zh": "大多数美国大学都有要求，请携带成绩单原件", "fr": "Requis par la plupart des universités américaines ; apportez le rapport de score original", "pt": "Exigido pela maioria das universidades dos EUA; traga o relatório de pontuação original"],
        "GRE / GMAT Scores (if applicable)": ["es": "Puntajes GRE / GMAT (si aplica)", "zh": "GRE/GMAT成绩单（如适用）", "fr": "Scores GRE / GMAT (si applicable)", "pt": "Pontuações GRE / GMAT (se aplicável)"],
        "For graduate programs that required them for admission": ["es": "Para programas de posgrado que los requirieron para la admisión", "zh": "针对要求提供该成绩作为入学条件的硕士/博士课程", "fr": "Pour les programmes d'études supérieures qui les exigeaient pour l'admission", "pt": "Para pós-graduações que os exigiram para admissão"],
        "I-797 Approval Notice (Original)": ["es": "Notificación de Aprobación I-797 (Original)", "zh": "I-797批准通知书（原件）", "fr": "Avis d'Approbation I-797 (Original)", "pt": "Notificação de Aprovação I-797 (Original)"],
        "USCIS approval of your H-1B petition — bring the original, not a photocopy": ["es": "Aprobación de la petición H-1B por parte de USCIS — traiga el original, no una fotocopia", "zh": "USCIS批准您的H-1B申请——请携带原件，而非复印件", "fr": "Approbation de votre pétition H-1B par l'USCIS — apportez l'original, pas une photocopie", "pt": "Aprovação do USCIS para a sua petição H-1B — traga o original, não uma cópia"],
        "Copy of I-129 Petition": ["es": "Copia de la Petición I-129", "zh": "I-129申请表副本", "fr": "Copie de la Pétition I-129", "pt": "Cópia da Petição I-129"],
        "The full H-1B petition package filed by your employer with USCIS": ["es": "El paquete completo de la petición H-1B presentado por su empleador ante USCIS", "zh": "您的雇主向USCIS提交的完整H-1B申请材料包", "fr": "Le dossier complet de la pétition H-1B déposé par votre employeur auprès de l'USCIS", "pt": "O pacote completo da petição H-1B enviado pelo seu empregador ao USCIS"],
        "Labor Condition Application (LCA)": ["es": "Solicitud de Condición Laboral (LCA)", "zh": "劳工情况申请（LCA）", "fr": "Demande de Condition de Travail (LCA)", "pt": "Solicitação de Condição de Trabalho (LCA)"],
        "DOL-certified LCA — usually included in your employer's petition package": ["es": "LCA certificado por el Departamento de Trabajo — generalmente incluido en el paquete de su empleador", "zh": "经过劳工部认证的LCA——通常包含在您雇主的申请材料包中", "fr": "LCA certifiée par le DOL — généralement incluse dans le dossier de pétition de votre employeur", "pt": "LCA certificada pelo DOL — geralmente incluída no pacote de petição do seu empregador"],
        "Offer Letter from US Employer": ["es": "Carta de Oferta del Empleador en EE. UU.", "zh": "美国雇主录取信/工作Offer", "fr": "Lettre d'Offre de l'Employeur Américain", "pt": "Carta de Oferta do Empregador nos EUA"],
        "On company letterhead, specifying salary, role title, and start date": ["es": "En hoja con membrete de la empresa, especificando salario, puesto y fecha de inicio", "zh": "使用公司信纸印制，详细说明薪资、职位名称和入职日期", "fr": "Sur papier à en-tête de l'entreprise, précisant le salaire, le titre du poste et la date de début", "pt": "Em papel timbrado da empresa, especificando salário, cargo e data de início"],
        "Support Letter from Employer": ["es": "Carta de Soporte del Empleador", "zh": "雇主支持信", "fr": "Lettre de Soutien de l'Employeur", "pt": "Carta de Suporte do Empregador"],
        "Explains your role, qualifications, and why the position is a specialty occupation": ["es": "Explica su puesto, calificaciones y por qué la posición es una ocupación especializada", "zh": "阐述您的岗位、资质，以及为什么该职位属于专业技能职业", "fr": "Explique votre rôle, vos qualifications et pourquoi le poste est une profession spécialisée", "pt": "Explica seu cargo, qualificações e por que a posição é uma ocupação especializada"],
        "Degree Certificate and Transcripts": ["es": "Título Universitario y Certificado de Notas", "zh": "学位证书和成绩单", "fr": "Diplôme et Relevés de Notes", "pt": "Diploma e Histórico Escolar"],
        "Proves your academic qualification for the specialty occupation requirement": ["es": "Prueba su calificación académica para el requisito de ocupación especializada", "zh": "证明您的学术资质符合专业技能职业的要求", "fr": "Prouve votre qualification académique pour l'exigence de profession spécialisée", "pt": "Comprova sua qualificação acadêmica para o requisito de ocupação especializada"],
        "Resume / CV": ["es": "Currículum Vitae (CV)", "zh": "个人简历（Resume / CV）", "fr": "Curriculum Vitae (CV)", "pt": "Currículo (CV)"],
        "Updated resume showing work history and skills relevant to the petitioned role": ["es": "Actualizado, que muestre historial laboral y habilidades relevantes para el puesto solicitado", "zh": "更新后的简历，展示与申请职位相关的工作经验和技能", "fr": "CV mis à jour indiquant l'historique de travail et les compétences pertinentes pour le rôle", "pt": "Currículo atualizado mostrando trabalho e habilidades relevantes para o cargo da petição"],
        "Form DS-2019 (Certificate of Eligibility)": ["es": "Formulario DS-2019 (Certificado de Elegibilidad)", "zh": "DS-2019表格（交流访问学者资格证书）", "fr": "Formulaire DS-2019 (Certificat d'Éligibilité)", "pt": "Formulário DS-2019 (Certificado de Elegibilidade)"],
        "Issued by your J-1 program sponsor — required for all J-1 applicants": ["es": "Emitido por el patrocinador de su programa J-1 — requerido para todos los solicitantes J-1", "zh": "由您的J-1项目赞助商签发——所有J-1申请人均须携带", "fr": "Délivré par le parrain de votre programme J-1 — requis pour tous les candidats J-1", "pt": "Emitido pelo patrocinador do seu programa J-1 — exigido para todos os candidatos J-1"],
        "SEVIS Fee Receipt (I-901)": ["es": "Recibo de la Tarifa SEVIS (I-901)", "zh": "SEVIS费缴费收据（I-901表格）", "fr": "Reçu des Frais SEVIS (I-901)", "pt": "Recibo da Taxa SEVIS (I-901)"],
        "J-1 applicants pay a $220 SEVIS fee at fmjfee.com before the interview": ["es": "Los solicitantes de J-1 pagan una tarifa SEVIS de $220 en fmjfee.com antes de la entrevista", "zh": "J-1申请人在面试前须在 fmjfee.com 缴纳220美元的SEVIS费", "fr": "Les candidats J-1 paient des frais SEVIS de 220 $ sur fmjfee.com avant l'entretien", "pt": "Candidatos J-1 pagam uma taxa SEVIS de $220 no fmjfee.com antes da entrevista"],
        "Sponsor Program Letter": ["es": "Carta del Programa del Patrocinador", "zh": "赞助商项目函", "fr": "Lettre de Programme du Parrain", "pt": "Carta do Programa do Patrocinador"],
        "Official letter from your J-1 sponsor describing the exchange program and your role": ["es": "Carta oficial de su patrocinador J-1 que describe el programa de intercambio y su puesto", "zh": "您的J-1担保方发出的官方信函，阐述交流项目内容以及您的岗位", "fr": "Lettre officielle de votre parrain J-1 décrivant le programme d'échange et votre rôle", "pt": "Carta oficial do patrocinador J-1 descrevendo o programa de intercâmbio e sua função"],

        // Mock Setup screen & Report
        "AI Mock Interview": ["es": "Simulación de Entrevista con IA", "zh": "AI 模拟签证面试", "fr": "Simulation d'Entretien IA", "pt": "Simulação de Entrevista com IA"],
        "Simulate a real %@ visa interview": ["es": "Simule una entrevista de visa %@ real", "zh": "模拟真实的 %@ 签证官问答", "fr": "Simuler un véritable entretien de visa %@", "pt": "Simule uma entrevista de visto %@ real"],
        "Live visa interview coach": ["es": "Coach de entrevista de visa en vivo", "zh": "实时签证面试教练", "fr": "Coach d'entretien de visa en direct", "pt": "Coach de entrevista de visto ao vivo"],
        "Practice for your %@ interview": ["es": "Practique para su entrevista %@", "zh": "为 %@ 面试做准备", "fr": "Entraînez-vous pour votre entretien %@", "pt": "Pratique para sua entrevista %@"],
        "Officer Style": ["es": "Estilo del Oficial", "zh": "签证官风格", "fr": "Style de l'officier", "pt": "Estilo do Cônsul"],
        "Choose how direct the consular officer should feel.": ["es": "Elija qué tan directo debe sentirse el oficial consular.", "zh": "选择签证官的提问强度和沟通风格。", "fr": "Choisissez le niveau de fermeté de l'agent consulaire.", "pt": "Escolha o quão direto o cônsul deve parecer."],
        "Friendly": ["es": "Amable", "zh": "友好", "fr": "Amical", "pt": "Amigável"],
        "Professional": ["es": "Profesional", "zh": "专业", "fr": "Professionnel", "pt": "Profissional"],
        "Strict": ["es": "Estricto", "zh": "严格", "fr": "Strict", "pt": "Rigoroso"],
        "Warm and conversational. Puts you at ease.": ["es": "Cálido y conversacional. Le ayuda a relajarse.", "zh": "温和、自然对话，帮助您放松进入状态。", "fr": "Chaleureux et conversationnel. Vous met à l'aise.", "pt": "Caloroso e conversacional. Ajuda você a ficar à vontade."],
        "Neutral and formal. Standard embassy style.": ["es": "Neutral y formal. Estilo estándar de embajada.", "zh": "中立、正式，接近标准使领馆面试风格。", "fr": "Neutre et formel. Style standard d'ambassade.", "pt": "Neutro e formal. Estilo padrão de embaixada."],
        "Terse and probing. High-pressure simulation.": ["es": "Breve e incisivo. Simulación de alta presión.", "zh": "简短、追问更深，模拟高压面试环境。", "fr": "Bref et incisif. Simulation sous pression.", "pt": "Direto e investigativo. Simulação de alta pressão."],
        "Number of Questions": ["es": "Número de Preguntas", "zh": "面试问题数量", "fr": "Nombre de questions", "pt": "Número de Perguntas"],
        "About %@ min, one question at a time.": ["es": "Aproximadamente %@ min, una pregunta a la vez.", "zh": "预计 %@ 分钟，每次只问一个问题。", "fr": "Environ %@ min, une question à la fois.", "pt": "Cerca de %@ min, uma pergunta por vez."],
        "Estimate": ["es": "Duración", "zh": "预计", "fr": "Durée", "pt": "Estimativa"],
        "Question preview": ["es": "Vista previa de preguntas", "zh": "问题预览", "fr": "Aperçu des questions", "pt": "Prévia das perguntas"],
        "Start Interview": ["es": "Iniciar Entrevista", "zh": "开始面试", "fr": "Démarrer l'entretien", "pt": "Iniciar Entrevista"],
        "Start live interview": ["es": "Iniciar entrevista en vivo", "zh": "开始实时面试", "fr": "Démarrer l'entretien en direct", "pt": "Iniciar entrevista ao vivo"],
        "Mock Interview": ["es": "Simulación de Visa", "zh": "模拟面试", "fr": "Simulation de Visa", "pt": "Simulação de Visto"],
        "Interview Completed": ["es": "Entrevista Completada", "zh": "面试已完成", "fr": "Entretien Terminé", "pt": "Entrevista Concluída"],
        "Consular Officer Feedback": ["es": "Retroalimentación del Oficial", "zh": "签证官评估报告", "fr": "Retour de l'agent consulaire", "pt": "Feedback do Cônsul"],
        "Duration": ["es": "Duración", "zh": "面试用时", "fr": "Durée", "pt": "Duração"],
        "Visa Type": ["es": "Tipo de Visa", "zh": "签证类型", "fr": "Type de visa", "pt": "Tipo de Visto"],
        "Language": ["es": "Idioma", "zh": "语言", "fr": "Langue", "pt": "Idioma"],
        "Metric breakdown": ["es": "Desglose de métricas", "zh": "评分指标维度", "fr": "Détail des scores", "pt": "Detalhamento das métricas"],
        "Communication": ["es": "Comunicación", "zh": "沟通表达能力", "fr": "Communication", "pt": "Comunicação"],
        "Confidence": ["es": "Confianza", "zh": "自信度与状态", "fr": "Confiance", "pt": "Confiança"],
        "Answer relevance": ["es": "Relevancia de respuestas", "zh": "问题回答切题度", "fr": "Pertinence de la réponse", "pt": "Relevância da resposta"],
        "What went well": ["es": "Qué salió bien", "zh": "答得好的地方（优势）", "fr": "Ce qui s'est bien passé", "pt": "O que correu bem"],
        "Areas for improvement": ["es": "Áreas de mejora", "zh": "有待提高的地方（不足）", "fr": "Axes d'amélioration", "pt": "Áreas para melhoria"],
        "Interview Transcript": ["es": "Transcripción de la Entrevista", "zh": "面试对话实录", "fr": "Transcription de l'entretien", "pt": "Transcrição da Entrevista"],
        "Practice Again": ["es": "Practicar de Nuevo", "zh": "再试一次", "fr": "S'entraîner à nouveau", "pt": "Praticar Novamente"],
        "Get Feedback": ["es": "Obtener Reporte", "zh": "生成评估报告", "fr": "Obtenir le retour", "pt": "Obter Relatório"],
        "Done Answering": ["es": "Terminar Respuesta", "zh": "回答完毕", "fr": "Réponse terminée", "pt": "Responder Depois"],
        "End Interview": ["es": "Terminar Entrevista", "zh": "结束面试", "fr": "Terminer l'entretien", "pt": "Terminar Entrevista"],
        "Ready for report": ["es": "Listo para reporte", "zh": "已就绪可评估", "fr": "Prêt pour le rapport", "pt": "Pronto para relatório"],
        "Connecting": ["es": "Conectando", "zh": "正在连接中", "fr": "Connexion en cours", "pt": "Conectando"],
        "Officer speaking": ["es": "Oficial hablando", "zh": "签证官提问中", "fr": "L'agent parle", "pt": "Cônsul falando"],
        "Listening": ["es": "Escuchando", "zh": "正在倾听您的回答", "fr": "À l'écoute", "pt": "Ouvindo"],
        "Needs retry": ["es": "Requiere reintento", "zh": "连接失败需要重试", "fr": "Réessayer", "pt": "Precisa repetir"],
        "Live transcript": ["es": "Transcripción en vivo", "zh": "实时对话字幕", "fr": "Transcription en direct", "pt": "Transcrição em tempo real"],
        "Answers will appear as text": ["es": "Las respuestas aparecerán como texto", "zh": "您的回答会被识别为文本", "fr": "Les réponses apparaîtront en texte", "pt": "As respostas aparecerão como texto"],
        "Create report": ["es": "Crear reporte", "zh": "创建报告", "fr": "Créer le rapport", "pt": "Criar relatório"],
        "Feedback report": ["es": "Reporte de evaluación", "zh": "评估报告", "fr": "Rapport d'évaluation", "pt": "Relatório de feedback"],
        "Tap Get feedback to review performance": ["es": "Toque Obtener reporte para ver su desempeño", "zh": "点击生成报告来复盘表现", "fr": "Appuyez sur Obtenir pour voir vos résultats", "pt": "Toque em Obter feedback para ver seu desempenho"],
        "Generated after ending": ["es": "Generado al finalizar", "zh": "面试结束后生成", "fr": "Généré à la fin", "pt": "Gerado após o término"],
        "Practice Focus": ["es": "Enfoque de Práctica", "zh": "训练重心", "fr": "Focus de pratique", "pt": "Foco de Prática"],

        // General labels
        "Practice questions": ["es": "Practicar preguntas", "zh": "练习签证考题", "fr": "Pratiquer les questions", "pt": "Praticar perguntas"],
        "Complete your document checklist": ["es": "Complete su lista de documentos", "zh": "完成您的文件清单", "fr": "Complétez votre liste de documents", "pt": "Complete seu checklist de documentos"],
        "Start with 'Purpose of Visit' — consular officers almost always ask this first.": ["es": "Comience con 'Propósito de la visita': los oficiales consulares casi siempre preguntan esto primero.", "zh": "从“出行目的”开始——签证官几乎总是先问这个问题。", "fr": "Commencez par 'Objet de la visite' — les agents consulaires le demandent presque toujours en premier.", "pt": "Comece com 'Objetivo da visita' — os cônsules quase sempre perguntam isso primeiro."],
        "You're missing 1 document — check them off as you gather each one.": ["es": "Le falta 1 documento; márquelo cuando lo reúna.", "zh": "您还缺少 1 份文件——收集到后请勾选。", "fr": "Il vous manque 1 document ; cochez-le lorsque vous l'avez.", "pt": "Falta 1 documento; marque quando reunir."],
        "You're missing %d documents — check them off as you gather each one.": ["es": "Le faltan %d documentos; márquelos cuando los reúna.", "zh": "您还缺少 %d 份文件——收集到后请逐一勾选。", "fr": "Il vous manque %d documents ; cochez-les lorsque vous les avez.", "pt": "Faltam %d documentos; marque quando reunir."],
        "Practice questions (%@)": ["es": "Practicar preguntas (%@)", "zh": "练习签证考题 (%@)", "fr": "Pratiquer les questions (%@)", "pt": "Praticar perguntas (%@)"],
        "Practice Questions": ["es": "Preguntas de práctica", "zh": "签证考题练习", "fr": "Questions d'entraînement", "pt": "Perguntas de prática"],
        "Answer Library": ["es": "Biblioteca de respuestas", "zh": "参考答案库", "fr": "Bibliothèque de réponses", "pt": "Biblioteca de respostas"],
        "Library": ["es": "Biblioteca", "zh": "答案库", "fr": "Bibliothèque", "pt": "Biblioteca"],
        "All": ["es": "Todas", "zh": "全部", "fr": "Tout", "pt": "Todas"],
        "Tips": ["es": "Consejos", "zh": "答题提示", "fr": "Conseils", "pt": "Dicas"],
        "Model Answer": ["es": "Respuesta modelo", "zh": "参考答案", "fr": "Réponse modèle", "pt": "Resposta modelo"],
        "English": ["es": "Inglés", "zh": "英文", "fr": "Anglais", "pt": "Inglês"],
        "No questions in this category": ["es": "No hay preguntas en esta categoría", "zh": "该分类暂无考题", "fr": "Aucune question dans cette catégorie", "pt": "Não há perguntas nesta categoria"],
        "Search answers…": ["es": "Buscar respuestas…", "zh": "搜索答案…", "fr": "Rechercher des réponses…", "pt": "Pesquisar respostas…"],
        "No answers in this category": ["es": "No hay respuestas en esta categoría", "zh": "该分类暂无答案", "fr": "Aucune réponse dans cette catégorie", "pt": "Não há respostas nesta categoria"],
        "No results for \"%@\"": ["es": "No hay resultados para \"%@\"", "zh": "没有找到“%@”", "fr": "Aucun résultat pour \"%@\"", "pt": "Nenhum resultado para \"%@\""],
        "answers": ["es": "respuestas", "zh": "个答案", "fr": "réponses", "pt": "respostas"],
        "answer": ["es": "respuesta", "zh": "个答案", "fr": "réponse", "pt": "resposta"],
        "questions": ["es": "preguntas", "zh": "道题", "fr": "questions", "pt": "perguntas"],
        "question": ["es": "pregunta", "zh": "道题", "fr": "question", "pt": "pergunta"],
        "tap to see tips & model answer": ["es": "toque para ver consejos y respuesta modelo", "zh": "点击查看答题提示和参考答案", "fr": "touchez pour voir les conseils et la réponse modèle", "pt": "toque para ver dicas e resposta modelo"],
        "Scan a visa document": ["es": "Escanear un documento de visa", "zh": "扫描签证文件", "fr": "Scanner un document de visa", "pt": "Escanear um documento de visto"],
        "Use on-device OCR to classify files, extract fields, and update your checklist.": ["es": "Use OCR en el dispositivo para clasificar archivos, extraer campos y actualizar su lista.", "zh": "使用设备端 OCR 分类文件、提取字段并更新清单。", "fr": "Utilisez l'OCR sur l'appareil pour classer les fichiers, extraire les champs et mettre à jour la liste.", "pt": "Use OCR no dispositivo para classificar arquivos, extrair campos e atualizar sua checklist."],
        "Scan": ["es": "Escanear", "zh": "扫描", "fr": "Scanner", "pt": "Escanear"],
        "Upload": ["es": "Subir", "zh": "上传", "fr": "Importer", "pt": "Enviar"],
        "Cancel": ["es": "Cancelar", "zh": "取消", "fr": "Annuler", "pt": "Cancelar"],
        "Verify checklist document": ["es": "Verificar documento de la lista", "zh": "验证清单文件", "fr": "Vérifier le document de la liste", "pt": "Verificar documento da checklist"],
        "Verified document already attached": ["es": "Documento verificado ya adjunto", "zh": "已上传并验证过文件", "fr": "Document vérifié déjà joint", "pt": "Documento verificado já anexado"],
        "Replace verified document": ["es": "Reemplazar documento verificado", "zh": "更换已验证文件", "fr": "Remplacer le document vérifié", "pt": "Substituir documento verificado"],
        "Keep current document": ["es": "Conservar documento actual", "zh": "保留当前文件", "fr": "Conserver le document actuel", "pt": "Manter documento atual"],
        "A verified document is already attached for %@. Would you like to upload a replacement for review?": ["es": "Ya hay un documento verificado para %@. ¿Desea subir un reemplazo para revisión?", "zh": "%@ 已经有验证通过的文件。是否要上传新的文件进行替换审核？", "fr": "Un document vérifié est déjà joint pour %@. Voulez-vous importer un remplacement pour vérification ?", "pt": "Já há um documento verificado para %@. Deseja enviar um substituto para revisão?"],
        "Upload or scan %@. CareerVivid will read the document on device and check it off only after it matches this checklist item.": ["es": "Suba o escanee %@. CareerVivid leerá el documento en el dispositivo y solo lo marcará cuando coincida con este elemento.", "zh": "请上传或扫描 %@。CareerVivid 会在设备端读取文件，只有确认与该清单项匹配后才会自动打勾。", "fr": "Importez ou scannez %@. CareerVivid lira le document sur l'appareil et ne le cochera que s'il correspond à cet élément.", "pt": "Envie ou escaneie %@. O CareerVivid lerá o documento no dispositivo e só marcará após corresponder a este item."],
        "Scan with camera": ["es": "Escanear con cámara", "zh": "使用相机扫描", "fr": "Scanner avec l'appareil photo", "pt": "Escanear com a câmera"],
        "Upload from Photos": ["es": "Subir desde Fotos", "zh": "从照片上传", "fr": "Importer depuis Photos", "pt": "Enviar das Fotos"],
        "Your previous verified status will remain unless the replacement is successfully verified.": ["es": "El estado verificado anterior se mantendrá salvo que el reemplazo se verifique correctamente.", "zh": "在新文件成功验证之前，原来的已验证状态会继续保留。", "fr": "Le statut vérifié précédent restera actif tant que le remplacement n'est pas validé.", "pt": "O status verificado anterior será mantido até que o substituto seja verificado com sucesso."],
        "Reading document locally": ["es": "Leyendo el documento localmente", "zh": "正在本地读取文件", "fr": "Lecture locale du document", "pt": "Lendo o documento localmente"],
        "Apple Vision is extracting text on this device.": ["es": "Apple Vision está extrayendo texto en este dispositivo.", "zh": "Apple Vision 正在此设备上提取文字。", "fr": "Apple Vision extrait le texte sur cet appareil.", "pt": "O Apple Vision está extraindo texto neste dispositivo."],
        "Document type detected": ["es": "Tipo de documento detectado", "zh": "已识别文件类型", "fr": "Type de document détecté", "pt": "Tipo de documento detectado"],
        "Checklist updated": ["es": "Lista actualizada", "zh": "清单已更新", "fr": "Liste mise à jour", "pt": "Checklist atualizada"],
        "Extracted fields": ["es": "Campos extraídos", "zh": "已提取字段", "fr": "Champs extraits", "pt": "Campos extraídos"],
        "Missing field: %@": ["es": "Campo faltante: %@", "zh": "缺少字段：%@", "fr": "Champ manquant : %@", "pt": "Campo ausente: %@"],
        "Recognized text": ["es": "Texto reconocido", "zh": "识别出的文字", "fr": "Texte reconnu", "pt": "Texto reconhecido"],
        "No recognized text.": ["es": "No se reconoció texto.", "zh": "没有识别到文字。", "fr": "Aucun texte reconnu.", "pt": "Nenhum texto reconhecido."],
        "match": ["es": "match", "zh": "匹配", "fr": "match", "pt": "match"],
        "confidence": ["es": "conf.", "zh": "置信度", "fr": "conf.", "pt": "conf."],
        "Not in current checklist": ["es": "No está en la lista actual", "zh": "未匹配当前清单", "fr": "Absent de la liste actuelle", "pt": "Fora da checklist atual"],
        "Document camera is not available on this device.": ["es": "La cámara de documentos no está disponible en este dispositivo.", "zh": "此设备不支持文档相机。", "fr": "La caméra de documents n'est pas disponible sur cet appareil.", "pt": "A câmera de documentos não está disponível neste dispositivo."],
        "We could not read that image. Try scanning the document instead.": ["es": "No pudimos leer esa imagen. Intente escanear el documento.", "zh": "无法读取该图片。请尝试直接扫描文件。", "fr": "Impossible de lire cette image. Essayez de scanner le document.", "pt": "Não conseguimos ler essa imagem. Tente escanear o documento."],
        "Low confidence. Retake the photo with better lighting and keep all page edges visible.": ["es": "Baja confianza. Tome otra foto con mejor luz y mantenga visibles todos los bordes de la página.", "zh": "置信度较低。请在更好光线下重拍，并确保页面边缘完整可见。", "fr": "Faible confiance. Reprenez la photo avec un meilleur éclairage et tous les bords visibles.", "pt": "Baixa confiança. Tire outra foto com melhor iluminação e todos os cantos visíveis."],
        "Very little text was detected. This may be a blurry image, non-document photo, or missing page.": ["es": "Se detectó muy poco texto. Puede ser una imagen borrosa, una foto que no es documento o una página incompleta.", "zh": "检测到的文字很少。可能是图片模糊、不是文件照片，或页面缺失。", "fr": "Très peu de texte détecté. L'image peut être floue, hors document ou incomplète.", "pt": "Muito pouco texto foi detectado. A imagem pode estar borrada, não ser documento ou faltar página."],
        "No checklist item was matched automatically. Review the recognized text before marking this document ready.": ["es": "No se asoció automáticamente ningún elemento. Revise el texto reconocido antes de marcarlo como listo.", "zh": "没有自动匹配到清单项。请先检查识别文字，再手动标记文件就绪。", "fr": "Aucun élément de checklist n'a été associé automatiquement. Vérifiez le texte reconnu avant de marquer le document prêt.", "pt": "Nenhum item foi associado automaticamente. Revise o texto reconhecido antes de marcar como pronto."],
        "This document belongs to a different visa type. Switch visa type to update the matching checklist.": ["es": "Este documento pertenece a otro tipo de visa. Cambie el tipo de visa para actualizar la lista correspondiente.", "zh": "这个文件属于其他签证类型。请切换签证类型后再自动更新对应清单。", "fr": "Ce document appartient à un autre type de visa. Changez de type de visa pour mettre à jour la liste correspondante.", "pt": "Este documento pertence a outro tipo de visto. Troque o tipo de visto para atualizar a checklist correta."],
        "The uploaded document does not match %@. Please upload the correct document for this checklist item.": ["es": "El documento subido no coincide con %@. Suba el documento correcto para este elemento.", "zh": "上传的文件与 %@ 不匹配。请为该清单项上传正确文件。", "fr": "Le document importé ne correspond pas à %@. Importez le bon document pour cet élément.", "pt": "O documento enviado não corresponde a %@. Envie o documento correto para este item."],
        "Passport expiry date was not clearly detected.": ["es": "La fecha de vencimiento del pasaporte no se detectó claramente.", "zh": "未清楚识别到护照有效期。", "fr": "La date d'expiration du passeport n'a pas été clairement détectée.", "pt": "A data de validade do passaporte não foi detectada claramente."],
        "Passport number": ["es": "Número de pasaporte", "zh": "护照号码", "fr": "Numéro de passeport", "pt": "Número do passaporte"],
        "Date found": ["es": "Fecha encontrada", "zh": "识别日期", "fr": "Date trouvée", "pt": "Data encontrada"],
        "DS-160 application ID": ["es": "ID de solicitud DS-160", "zh": "DS-160 申请编号", "fr": "ID de demande DS-160", "pt": "ID da solicitação DS-160"],
        "SEVIS ID": ["es": "SEVIS ID", "zh": "SEVIS ID", "fr": "SEVIS ID", "pt": "SEVIS ID"],
        "USCIS receipt number": ["es": "Número de recibo USCIS", "zh": "USCIS 收据号码", "fr": "Numéro de reçu USCIS", "pt": "Número de recibo USCIS"],
        "School / institution": ["es": "Escuela / institución", "zh": "学校 / 机构", "fr": "École / institution", "pt": "Escola / instituição"],
        "Amount": ["es": "Monto", "zh": "金额", "fr": "Montant", "pt": "Valor"],
        "Purpose of Visit": ["es": "Propósito de la visita", "zh": "出行目的", "fr": "Objet de la visite", "pt": "Objetivo da visita"],
        "Ties to Home Country": ["es": "Vínculos con su país", "zh": "回国约束力", "fr": "Attaches au pays d'origine", "pt": "Vínculos com o país de origem"],
        "Financial Proof": ["es": "Prueba financiera", "zh": "资金证明", "fr": "Preuve financière", "pt": "Comprovação financeira"],
        "Travel History": ["es": "Historial de viaje", "zh": "旅行记录", "fr": "Historique de voyage", "pt": "Histórico de viagem"],
        "Background": ["es": "Antecedentes", "zh": "背景信息", "fr": "Antécédents", "pt": "Histórico"],
        "Education & Plans": ["es": "Educación y planes", "zh": "教育与计划", "fr": "Études et projets", "pt": "Educação e planos"],
        "Building your feedback report": ["es": "Construyendo su reporte de retroalimentación", "zh": "正在生成您的评估反馈报告", "fr": "Création de votre rapport d'évaluation", "pt": "Construindo seu relatório de feedback"],
        "Analyzing your language fluency, communication scores, and answer logic.": ["es": "Analizando su fluidez lingüística, puntajes de comunicación y lógica de respuesta.", "zh": "正在深度分析您的语言流利度、沟通得分和回答逻辑结构。", "fr": "Analyse de votre fluidité linguistique, de vos scores de communication et de votre logique de réponse.", "pt": "Analisando sua fluência no idioma, pontuações de comunicação e lógica de resposta."],
        "Transcript": ["es": "Transcripción", "zh": "对话文本", "fr": "Transcription", "pt": "Transcrição"],
        "Scoring": ["es": "Calificación", "zh": "得分打分", "fr": "Notation", "pt": "Pontuação"],
        "Report": ["es": "Reporte", "zh": "报告", "fr": "Rapport", "pt": "Relatório"]
    ]

    /// Returns localized content for a question ID and language, or nil if not available
    public static func localization(for questionId: UUID, language: AppLanguage) -> VisaQuestionLocalization? {
        guard language != .english else { return nil }
        return table[questionId]?[language.code]
    }

    public static func localization(for question: VisaQuestion, language: AppLanguage) -> VisaQuestionLocalization? {
        guard language != .english else { return nil }
        if let localized = questionTextTable[question.text]?[language.code] {
            return VisaQuestionLocalization(
                text: localized,
                tips: localizedTips(for: question.tips, language: language),
                modelAnswer: localizedModelAnswer(for: question.modelAnswer, language: language)
            )
        }
        return localization(for: question.id, language: language)
    }

    private static func localizedTips(for tips: [String], language: AppLanguage) -> [String] {
        tips.map { uiString($0, language: language) }
    }

    private static func localizedModelAnswer(for answer: String, language: AppLanguage) -> String {
        uiString(answer, language: language)
    }

    private static let questionTextTable: [String: [String: String]] = [
        "What is the purpose of your visit to the United States?": [
            "es": "¿Cuál es el propósito de su visita a los Estados Unidos?",
            "zh": "您访问美国的目的是什么？",
            "fr": "Quel est l'objet de votre visite aux États-Unis ?",
            "pt": "Qual é o objetivo da sua visita aos Estados Unidos?"
        ],
        "How long do you plan to stay in the United States?": [
            "es": "¿Cuánto tiempo piensa permanecer en los Estados Unidos?",
            "zh": "您计划在美国停留多长时间？",
            "fr": "Combien de temps prévoyez-vous de rester aux États-Unis ?",
            "pt": "Por quanto tempo você planeja ficar nos Estados Unidos?"
        ],
        "Where will you be staying during your visit?": [
            "es": "¿Dónde se alojará durante su visita?",
            "zh": "您访问期间会住在哪里？",
            "fr": "Où logerez-vous pendant votre visite ?",
            "pt": "Onde você ficará durante a visita?"
        ],
        "Why can't you handle this meeting or conference virtually instead of traveling?": [
            "es": "¿Por qué no puede realizar esta reunión o conferencia virtualmente en lugar de viajar?",
            "zh": "为什么不能线上参加这次会议或活动，而必须亲自前往？",
            "fr": "Pourquoi ne pouvez-vous pas gérer cette réunion ou conférence virtuellement au lieu de voyager ?",
            "pt": "Por que você não pode participar dessa reunião ou conferência virtualmente em vez de viajar?"
        ],
        "Have you been invited by a person or a company in the United States?": [
            "es": "¿Lo ha invitado una persona o empresa en los Estados Unidos?",
            "zh": "您是否收到美国个人或公司的邀请？",
            "fr": "Avez-vous été invité par une personne ou une entreprise aux États-Unis ?",
            "pt": "Você foi convidado por uma pessoa ou empresa nos Estados Unidos?"
        ],
        "What is your current job and who is your employer?": [
            "es": "¿Cuál es su trabajo actual y quién es su empleador?",
            "zh": "您目前的工作是什么？雇主是谁？",
            "fr": "Quel est votre emploi actuel et qui est votre employeur ?",
            "pt": "Qual é o seu emprego atual e quem é seu empregador?"
        ],
        "Do you have a spouse, children, or parents in your home country?": [
            "es": "¿Tiene cónyuge, hijos o padres en su país de origen?",
            "zh": "您在本国是否有配偶、子女或父母？",
            "fr": "Avez-vous un conjoint, des enfants ou des parents dans votre pays d'origine ?",
            "pt": "Você tem cônjuge, filhos ou pais em seu país de origem?"
        ],
        "Do you own property or have financial obligations in your home country?": [
            "es": "¿Posee propiedades o tiene obligaciones financieras en su país de origen?",
            "zh": "您在本国是否拥有房产或承担财务义务？",
            "fr": "Possédez-vous des biens ou avez-vous des obligations financières dans votre pays d'origine ?",
            "pt": "Você possui propriedade ou tem obrigações financeiras em seu país de origem?"
        ],
        "Have you traveled internationally before? Which countries?": [
            "es": "¿Ha viajado internacionalmente antes? ¿A qué países?",
            "zh": "您以前有过国际旅行经历吗？去过哪些国家？",
            "fr": "Avez-vous déjà voyagé à l'étranger ? Dans quels pays ?",
            "pt": "Você já viajou internacionalmente antes? Para quais países?"
        ],
        "Who is paying for this trip and how much money do you have available?": [
            "es": "¿Quién pagará este viaje y cuánto dinero tiene disponible?",
            "zh": "谁支付这次旅行费用？您有多少可用资金？",
            "fr": "Qui paie ce voyage et de combien d'argent disposez-vous ?",
            "pt": "Quem está pagando por esta viagem e quanto dinheiro você tem disponível?"
        ],
        "What is your monthly or annual salary?": [
            "es": "¿Cuál es su salario mensual o anual?",
            "zh": "您的月薪或年薪是多少？",
            "fr": "Quel est votre salaire mensuel ou annuel ?",
            "pt": "Qual é o seu salário mensal ou anual?"
        ],
        "Do you have any relatives or close friends living in the United States?": [
            "es": "¿Tiene familiares o amigos cercanos viviendo en los Estados Unidos?",
            "zh": "您是否有亲属或密友住在美国？",
            "fr": "Avez-vous des parents ou des amis proches vivant aux États-Unis ?",
            "pt": "Você tem parentes ou amigos próximos morando nos Estados Unidos?"
        ],
        "What social media platforms do you use? What are your usernames?": [
            "es": "¿Qué plataformas de redes sociales usa? ¿Cuáles son sus nombres de usuario?",
            "zh": "您使用哪些社交媒体平台？用户名是什么？",
            "fr": "Quelles plateformes de réseaux sociaux utilisez-vous ? Quels sont vos noms d'utilisateur ?",
            "pt": "Quais plataformas de mídia social você usa? Quais são seus nomes de usuário?"
        ],
        "Have you ever been denied a US visa or any other immigration benefit?": [
            "es": "¿Alguna vez le han negado una visa estadounidense u otro beneficio migratorio?",
            "zh": "您是否曾被拒签美国签证或被拒绝其他移民福利？",
            "fr": "Vous a-t-on déjà refusé un visa américain ou un autre avantage migratoire ?",
            "pt": "Você já teve um visto americano ou outro benefício imigratório negado?"
        ],
        "Do you intend to work or seek employment while in the United States?": [
            "es": "¿Tiene intención de trabajar o buscar empleo mientras esté en los Estados Unidos?",
            "zh": "您是否打算在美国工作或寻找工作？",
            "fr": "Avez-vous l'intention de travailler ou de chercher un emploi pendant votre séjour aux États-Unis ?",
            "pt": "Você pretende trabalhar ou procurar emprego enquanto estiver nos Estados Unidos?"
        ],
        "Have you previously visited the United States? When and why?": [
            "es": "¿Ha visitado antes los Estados Unidos? ¿Cuándo y por qué?",
            "zh": "您以前去过美国吗？什么时候？目的是什么？",
            "fr": "Avez-vous déjà visité les États-Unis ? Quand et pourquoi ?",
            "pt": "Você já visitou os Estados Unidos antes? Quando e por quê?"
        ],
        "Have you ever overstayed a visa in the US or any other country?": [
            "es": "¿Alguna vez excedió el tiempo permitido por una visa en EE. UU. o en otro país?",
            "zh": "您是否曾在美国或其他国家逾期停留？",
            "fr": "Avez-vous déjà dépassé la durée autorisée d'un visa aux États-Unis ou dans un autre pays ?",
            "pt": "Você já ultrapassou o período permitido de um visto nos EUA ou em outro país?"
        ],
        "Have you ever been arrested, charged with a crime, or convicted of any offense?": [
            "es": "¿Alguna vez ha sido arrestado, acusado de un delito o condenado por alguna infracción?",
            "zh": "您是否曾被逮捕、被刑事指控或被判有罪？",
            "fr": "Avez-vous déjà été arrêté, inculpé ou condamné pour une infraction ?",
            "pt": "Você já foi preso, acusado de crime ou condenado por alguma infração?"
        ],
        "Why do you want to study in the United States instead of your home country?": [
            "es": "¿Por qué desea estudiar en Estados Unidos en lugar de su país de origen?",
            "zh": "为什么您想在美国学习，而不是在本国学习？",
            "fr": "Pourquoi voulez-vous étudier aux États-Unis plutôt que dans votre pays d'origine ?",
            "pt": "Por que você quer estudar nos Estados Unidos em vez de no seu país?"
        ],
        "Why did you choose this specific university?": [
            "es": "¿Por qué eligió esta universidad en particular?",
            "zh": "为什么选择这所特定的大学？",
            "fr": "Pourquoi avez-vous choisi cette université en particulier ?",
            "pt": "Por que você escolheu esta universidade específica?"
        ],
        "What is your undergraduate GPA or academic standing?": [
            "es": "¿Cuál es su GPA de pregrado o nivel académico?",
            "zh": "您的本科 GPA 或学术成绩情况如何？",
            "fr": "Quelle est votre moyenne universitaire ou votre niveau académique ?",
            "pt": "Qual é seu GPA de graduação ou desempenho acadêmico?"
        ],
        "What field will you study and how does it connect to your career goals at home?": [
            "es": "¿Qué área estudiará y cómo se conecta con sus metas profesionales en su país?",
            "zh": "您将学习什么专业？它如何关联您回国后的职业目标？",
            "fr": "Quel domaine allez-vous étudier et comment est-il lié à vos objectifs professionnels dans votre pays ?",
            "pt": "Que área você estudará e como ela se conecta aos seus objetivos profissionais no seu país?"
        ],
        "What are your plans immediately after you finish your degree?": [
            "es": "¿Cuáles son sus planes inmediatamente después de terminar su carrera?",
            "zh": "完成学位后，您的下一步计划是什么？",
            "fr": "Quels sont vos projets immédiatement après l'obtention de votre diplôme ?",
            "pt": "Quais são seus planos imediatamente após concluir o curso?"
        ],
        "Why did you choose this program over cheaper options in Canada, UK, or Australia?": [
            "es": "¿Por qué eligió este programa en lugar de opciones más baratas en Canadá, Reino Unido o Australia?",
            "zh": "为什么选择这个项目，而不是加拿大、英国或澳大利亚更便宜的项目？",
            "fr": "Pourquoi avez-vous choisi ce programme plutôt que des options moins chères au Canada, au Royaume-Uni ou en Australie ?",
            "pt": "Por que escolheu este programa em vez de opções mais baratas no Canadá, Reino Unido ou Austrália?"
        ],
        "How will you finance your tuition and living expenses?": [
            "es": "¿Cómo financiará su matrícula y sus gastos de manutención?",
            "zh": "您将如何支付学费和生活费？",
            "fr": "Comment financerez-vous vos frais de scolarité et de subsistance ?",
            "pt": "Como você financiará sua mensalidade e despesas de vida?"
        ],
        "What do your parents do for a living? What is their approximate income?": [
            "es": "¿A qué se dedican sus padres? ¿Cuál es su ingreso aproximado?",
            "zh": "您的父母从事什么工作？大概收入是多少？",
            "fr": "Que font vos parents comme travail ? Quel est leur revenu approximatif ?",
            "pt": "O que seus pais fazem? Qual é a renda aproximada deles?"
        ],
        "Have you received any scholarship, assistantship, or fellowship?": [
            "es": "¿Ha recibido alguna beca, ayudantía o fellowship?",
            "zh": "您是否获得奖学金、助教/助研岗位或 fellowship？",
            "fr": "Avez-vous reçu une bourse, un poste d'assistant ou une fellowship ?",
            "pt": "Você recebeu alguma bolsa, assistência ou fellowship?"
        ],
        "Are you planning to work during your studies?": [
            "es": "¿Planea trabajar durante sus estudios?",
            "zh": "您是否计划在学习期间工作？",
            "fr": "Prévoyez-vous de travailler pendant vos études ?",
            "pt": "Você planeja trabalhar durante os estudos?"
        ],
        "What company has petitioned for your H-1B and what does that company do?": [
            "es": "¿Qué empresa presentó su petición H-1B y a qué se dedica?",
            "zh": "哪家公司为您提交 H-1B 申请？该公司做什么业务？",
            "fr": "Quelle entreprise a déposé votre demande H-1B et que fait-elle ?",
            "pt": "Qual empresa solicitou seu H-1B e o que ela faz?"
        ],
        "What is your job title and what do you do on a daily basis?": [
            "es": "¿Cuál es su cargo y qué hace diariamente?",
            "zh": "您的职位是什么？日常工作内容是什么？",
            "fr": "Quel est votre titre de poste et que faites-vous au quotidien ?",
            "pt": "Qual é seu cargo e o que você faz no dia a dia?"
        ],
        "Why can't an American worker do this job instead of you?": [
            "es": "¿Por qué un trabajador estadounidense no puede hacer este trabajo en lugar de usted?",
            "zh": "为什么不能由美国本地员工来做这份工作？",
            "fr": "Pourquoi un travailleur américain ne peut-il pas faire ce travail à votre place ?",
            "pt": "Por que um trabalhador americano não pode fazer este trabalho em seu lugar?"
        ],
        "What is your annual salary for this position?": [
            "es": "¿Cuál es su salario anual para este puesto?",
            "zh": "该职位的年薪是多少？",
            "fr": "Quel est votre salaire annuel pour ce poste ?",
            "pt": "Qual é o seu salário anual para esta posição?"
        ],
        "How does your educational background qualify you for this specialty occupation?": [
            "es": "¿Cómo lo califica su formación académica para esta ocupación especializada?",
            "zh": "您的教育背景如何使您符合这个专业职业的要求？",
            "fr": "Comment votre formation vous qualifie-t-elle pour cette profession spécialisée ?",
            "pt": "Como sua formação acadêmica o qualifica para esta ocupação especializada?"
        ],
        "Where exactly will you be working — what is the worksite address?": [
            "es": "¿Dónde trabajará exactamente? ¿Cuál es la dirección del lugar de trabajo?",
            "zh": "您具体会在哪里工作？工作地点地址是什么？",
            "fr": "Où travaillerez-vous exactement ? Quelle est l'adresse du lieu de travail ?",
            "pt": "Onde exatamente você trabalhará? Qual é o endereço do local de trabalho?"
        ],
        "Is your employer a consulting or staffing company placing you at a client site?": [
            "es": "¿Su empleador es una consultora o agencia que lo asignará a un cliente?",
            "zh": "您的雇主是否为咨询或派遣公司，并将您安排到客户现场？",
            "fr": "Votre employeur est-il une société de conseil ou de placement vous affectant chez un client ?",
            "pt": "Seu empregador é uma consultoria ou empresa de staffing que o colocará em um cliente?"
        ],
        "What is your J-1 program and who is your sponsoring organization?": [
            "es": "¿Cuál es su programa J-1 y quién es la organización patrocinadora?",
            "zh": "您的 J-1 项目是什么？赞助机构是谁？",
            "fr": "Quel est votre programme J-1 et quelle est votre organisation sponsor ?",
            "pt": "Qual é seu programa J-1 e quem é a organização patrocinadora?"
        ],
        "What will you do when your J-1 program ends?": [
            "es": "¿Qué hará cuando termine su programa J-1?",
            "zh": "J-1 项目结束后您会做什么？",
            "fr": "Que ferez-vous lorsque votre programme J-1 se terminera ?",
            "pt": "O que você fará quando seu programa J-1 terminar?"
        ],
        "What specific skills or knowledge will you bring back to your home country?": [
            "es": "¿Qué habilidades o conocimientos específicos llevará de regreso a su país?",
            "zh": "您会把哪些具体技能或知识带回本国？",
            "fr": "Quelles compétences ou connaissances spécifiques rapporterez-vous dans votre pays ?",
            "pt": "Quais habilidades ou conhecimentos específicos você levará de volta ao seu país?"
        ],
        "Are you aware of the two-year home residency requirement (212(e))? Does it apply to you?": [
            "es": "¿Conoce el requisito de residencia de dos años en el país de origen (212(e))? ¿Se aplica a usted?",
            "zh": "您是否了解两年回国居住要求（212(e)）？它是否适用于您？",
            "fr": "Connaissez-vous l'obligation de résidence de deux ans dans le pays d'origine (212(e)) ? S'applique-t-elle à vous ?",
            "pt": "Você conhece a exigência de residência de dois anos no país de origem (212(e))? Ela se aplica a você?"
        ]
    ]

    // Populated with translations for question IDs matching VisaSampleData.questions[0...4] (B1/B2)
    // We use a lazy static so question UUIDs stabilize after first access
    public static let table: [UUID: [String: VisaQuestionLocalization]] = {
        // Grab the first 5 B1/B2 questions
        let b1b2Qs = VisaSampleData.questions.filter { $0.visaTypes.contains(.b1b2) }.prefix(5)
        var result: [UUID: [String: VisaQuestionLocalization]] = [:]

        let translations: [[String: VisaQuestionLocalization]] = [
            // Q0 — Purpose of visit
            [
                "es": VisaQuestionLocalization(
                    text: "¿Cuál es el propósito de su visita a los Estados Unidos?",
                    tips: ["Sea específico: turismo, negocios o ambos", "Mencione destinos o actividades clave", "Evite decir 'solo quiero ver el país'"],
                    modelAnswer: "Planeo visitar los Estados Unidos durante dos semanas por turismo. Tengo planeado visitar Nueva York y Washington D.C., explorar los monumentos y museos, y disfrutar de la cultura americana. Tengo reservaciones confirmadas de hotel y vuelo de regreso."
                ),
                "zh": VisaQuestionLocalization(
                    text: "您访问美国的目的是什么？",
                    tips: ["明确说明目的：旅游、商务或两者兼有", "提及具体目的地或活动", "避免模糊的回答"],
                    modelAnswer: "我计划赴美进行为期两周的旅游。我将参观纽约和华盛顿特区，游览著名的纪念碑和博物馆，体验美国文化。我已预订了酒店和回程机票。"
                ),
                "fr": VisaQuestionLocalization(
                    text: "Quel est l'objet de votre visite aux États-Unis ?",
                    tips: ["Soyez précis : tourisme, affaires ou les deux", "Mentionnez des destinations ou activités clés", "Évitez de dire 'je veux juste visiter le pays'"],
                    modelAnswer: "Je prévois de visiter les États-Unis pendant deux semaines pour le tourisme. J'ai prévu de visiter New York et Washington D.C., d'explorer les monuments et les musées, et de profiter de la culture américaine. J'ai des réservations d'hôtel confirmées et un billet de retour."
                ),
                "pt": VisaQuestionLocalization(
                    text: "Qual é o propósito da sua visita aos Estados Unidos?",
                    tips: ["Seja específico: turismo, negócios ou ambos", "Mencione destinos ou atividades principais", "Evite respostas vagas"],
                    modelAnswer: "Planejo visitar os Estados Unidos por duas semanas para turismo. Tenho planos de visitar Nova York e Washington D.C., explorar os monumentos e museus e desfrutar da cultura americana. Tenho reservas de hotel confirmadas e passagem de volta."
                )
            ],
            // Q1 — How long
            [
                "es": VisaQuestionLocalization(
                    text: "¿Cuánto tiempo planea quedarse?",
                    tips: ["Dé una duración específica con fechas", "No exceda la validez de su visa", "Mencione que tiene boleto de regreso"],
                    modelAnswer: "Planeo quedarme exactamente 14 días, del 15 al 29 de julio. Tengo mi boleto de regreso confirmado para el 29 de julio."
                ),
                "zh": VisaQuestionLocalization(
                    text: "您计划停留多长时间？",
                    tips: ["提供具体日期", "不超过签证有效期", "提及已购买返程机票"],
                    modelAnswer: "我计划停留14天，从7月15日到7月29日。我已经购买了7月29日的回程机票。"
                ),
                "fr": VisaQuestionLocalization(
                    text: "Combien de temps prévoyez-vous de rester ?",
                    tips: ["Donnez une durée précise avec des dates", "Ne dépassez pas la validité de votre visa", "Mentionnez votre billet de retour"],
                    modelAnswer: "Je prévois de rester exactement 14 jours, du 15 au 29 juillet. J'ai mon billet de retour confirmé pour le 29 juillet."
                ),
                "pt": VisaQuestionLocalization(
                    text: "Por quanto tempo você planeja ficar?",
                    tips: ["Forneça datas específicas", "Não exceda a validade do visto", "Mencione o bilhete de volta"],
                    modelAnswer: "Planejo ficar exatamente 14 dias, de 15 a 29 de julho. Tenho minha passagem de volta confirmada para 29 de julho."
                )
            ],
            // Q2 — Who is paying
            [
                "es": VisaQuestionLocalization(
                    text: "¿Quién financiará su viaje?",
                    tips: ["Mencione montos específicos si es posible", "Lleve extractos bancarios como respaldo", "Si alguien más paga, explique la relación"],
                    modelAnswer: "Yo mismo financiaré el viaje con mis ahorros. Actualmente tengo $5,000 en mi cuenta bancaria, lo cual es más que suficiente para mis gastos de viaje estimados de $3,000."
                ),
                "zh": VisaQuestionLocalization(
                    text: "谁来支付您的旅行费用？",
                    tips: ["如可能，提供具体金额", "携带银行存款证明", "如他人支付，说明关系"],
                    modelAnswer: "我将用个人积蓄支付旅行费用。我的银行账户目前有5000美元，足以支付我预计3000美元的旅行开销。"
                ),
                "fr": VisaQuestionLocalization(
                    text: "Qui financera votre voyage ?",
                    tips: ["Mentionnez des montants précis si possible", "Apportez des relevés bancaires", "Si quelqu'un d'autre paie, expliquez la relation"],
                    modelAnswer: "Je financerai moi-même le voyage avec mes économies. J'ai actuellement 5 000 $ sur mon compte bancaire, ce qui est largement suffisant pour mes dépenses de voyage estimées à 3 000 $."
                ),
                "pt": VisaQuestionLocalization(
                    text: "Quem vai financiar sua viagem?",
                    tips: ["Mencione valores específicos se possível", "Leve extratos bancários", "Se outra pessoa pagar, explique a relação"],
                    modelAnswer: "Financiarei a viagem com minhas economias pessoais. Atualmente tenho $5.000 na minha conta bancária, o que é mais do que suficiente para meus gastos estimados de $3.000."
                )
            ],
            // Q3 — Employment/ties to home
            [
                "es": VisaQuestionLocalization(
                    text: "¿Está empleado actualmente? ¿Dónde trabaja?",
                    tips: ["Sea específico sobre su rol y empleador", "Mencione cuánto tiempo lleva en ese trabajo", "Muestre que tiene razones para regresar"],
                    modelAnswer: "Sí, soy ingeniero de software en TechCorp en Madrid. Llevo tres años con la empresa y tengo un contrato indefinido. Tengo 21 días de vacaciones aprobadas por mi gerente para este viaje."
                ),
                "zh": VisaQuestionLocalization(
                    text: "您目前是否在职？在哪里工作？",
                    tips: ["具体说明职位和雇主", "说明在职时间", "体现您有回国的理由"],
                    modelAnswer: "是的，我在马德里的TechCorp担任软件工程师，已工作三年，签有无固定期限合同。我的经理已批准了21天假期用于此次旅行。"
                ),
                "fr": VisaQuestionLocalization(
                    text: "Êtes-vous actuellement employé ? Où travaillez-vous ?",
                    tips: ["Soyez précis sur votre rôle et votre employeur", "Mentionnez depuis combien de temps vous travaillez là", "Montrez que vous avez des raisons de revenir"],
                    modelAnswer: "Oui, je suis ingénieur logiciel chez TechCorp à Madrid. Je suis avec l'entreprise depuis trois ans et j'ai un contrat à durée indéterminée. Mon responsable a approuvé 21 jours de congés pour ce voyage."
                ),
                "pt": VisaQuestionLocalization(
                    text: "Você está empregado atualmente? Onde você trabalha?",
                    tips: ["Seja específico sobre seu cargo e empregador", "Mencione há quanto tempo está no emprego", "Mostre que tem motivos para voltar"],
                    modelAnswer: "Sim, sou engenheiro de software na TechCorp em Madrid. Estou na empresa há três anos com contrato por tempo indeterminado. Meu gerente aprovou 21 dias de férias para esta viagem."
                )
            ],
            // Q4 — Have you been to the US before
            [
                "es": VisaQuestionLocalization(
                    text: "¿Ha visitado los Estados Unidos anteriormente?",
                    tips: ["Sea honesto sobre visitas anteriores", "Mencione si cumplió con los términos de visas anteriores", "Si nunca ha ido, exprese interés genuino"],
                    modelAnswer: "No, esta sería mi primera visita a los Estados Unidos. Siempre he querido explorar el país, especialmente la Ciudad de Nueva York y los Parques Nacionales, y finalmente tengo la oportunidad de hacerlo."
                ),
                "zh": VisaQuestionLocalization(
                    text: "您以前去过美国吗？",
                    tips: ["如实回答以往签证情况", "提及遵守过往签证规定", "若从未去过，表达真诚兴趣"],
                    modelAnswer: "没有，这将是我第一次访问美国。我一直很想探索这个国家，尤其是纽约市和国家公园，现在终于有机会了。"
                ),
                "fr": VisaQuestionLocalization(
                    text: "Avez-vous déjà visité les États-Unis auparavant ?",
                    tips: ["Soyez honnête sur les visites précédentes", "Mentionnez si vous avez respecté les conditions des visas précédents", "Si vous n'y êtes jamais allé, exprimez un intérêt sincère"],
                    modelAnswer: "Non, ce serait ma première visite aux États-Unis. J'ai toujours voulu explorer le pays, notamment New York et les parcs nationaux, et j'en ai enfin l'opportunité."
                ),
                "pt": VisaQuestionLocalization(
                    text: "Você já visitou os Estados Unidos anteriormente?",
                    tips: ["Seja honesto sobre visitas anteriores", "Mencione se cumpriu os termos de vistos anteriores", "Se nunca foi, expresse interesse genuíno"],
                    modelAnswer: "Não, esta seria minha primeira visita aos Estados Unidos. Sempre quis explorar o país, especialmente a cidade de Nova York e os Parques Nacionais, e finalmente tenho a oportunidade."
                )
            ]
        ]

        var idx = 0
        for q in b1b2Qs {
            if idx < translations.count {
                result[q.id] = translations[idx]
            }
            idx += 1
        }
        return result
    }()
}

// MARK: - Readiness History (Feature 7)

public struct ReadinessEntry: Codable, Identifiable, Sendable {
    public let id: UUID
    public let date: Date
    public let score: Double          // 0.0 – 1.0
    public let visaType: String
    public let docsChecked: Int
    public let totalDocs: Int
    public let questionsReviewed: Int

    public init(date: Date = .now, score: Double, visaType: String, docsChecked: Int, totalDocs: Int, questionsReviewed: Int) {
        self.id = UUID()
        self.date = date
        self.score = score
        self.visaType = visaType
        self.docsChecked = docsChecked
        self.totalDocs = totalDocs
        self.questionsReviewed = questionsReviewed
    }
}

public enum ReadinessHistory {
    private static let key = "readinessHistoryV1"
    private static let maxEntries = 30

    public static func load() -> [ReadinessEntry] {
        guard let data = UserDefaults.standard.data(forKey: key),
              let entries = try? JSONDecoder().decode([ReadinessEntry].self, from: data)
        else { return [] }
        return entries.sorted { $0.date < $1.date }
    }

    /// Save an entry. Deduplicates by calendar day for the same visa type.
    public static func record(_ entry: ReadinessEntry) {
        var entries = load()
        let cal = Calendar.current
        // Remove existing entry for same day + visa type
        entries.removeAll {
            cal.isDate($0.date, inSameDayAs: entry.date) && $0.visaType == entry.visaType
        }
        entries.append(entry)
        // Keep most recent maxEntries
        if entries.count > maxEntries {
            entries = Array(entries.suffix(maxEntries))
        }
        if let data = try? JSONEncoder().encode(entries) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    public static func recent(count: Int = 14) -> [ReadinessEntry] {
        Array(load().suffix(count))
    }
}

// MARK: - Mock Interview Session (Feature 4)

public struct MockSessionResult: Identifiable, Sendable {
    public let id = UUID()
    public let question: VisaQuestion
    public let selfRating: Int  // 1–5, 0 = skipped
    public let secondsTaken: Int
}

public enum MockInterviewPhase: Equatable {
    case setup
    case briefing
    case question(index: Int)
    case revealed(index: Int)
    case complete
}
