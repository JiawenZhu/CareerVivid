import Foundation

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
