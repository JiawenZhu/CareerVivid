import Foundation

extension EditableResume {
    public init(websiteResume: WebsiteResumeData) {
        let firstName = websiteResume.personalDetails.firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        let lastName = websiteResume.personalDetails.lastName.trimmingCharacters(in: .whitespacesAndNewlines)
        let fullName = [firstName, lastName].filter { !$0.isEmpty }.joined(separator: " ")
        let linkedIn = websiteResume.websites.first { link in
            let label = link.label.lowercased()
            let platform = link.platform?.lowercased() ?? ""
            return label.contains("linkedin") || platform.contains("linkedin") || link.url.contains("linkedin.com")
        }?.url ?? ""

        let personalInfo = PersonalInfo(
            name: fullName,
            title: websiteResume.personalDetails.jobTitle,
            email: websiteResume.personalDetails.email,
            phone: websiteResume.personalDetails.phone,
            location: Self.joinLocation(
                city: websiteResume.personalDetails.city,
                address: websiteResume.personalDetails.address,
                country: websiteResume.personalDetails.country
            ),
            linkedin: linkedIn
        )

        self.init(
            id: Self.localUUID(remoteId: websiteResume.id),
            remoteId: websiteResume.id,
            templateID: ResumeTemplateID(rawValue: websiteResume.templateId) ?? .modern,
            personalInfo: personalInfo,
            summary: websiteResume.professionalSummary,
            experiences: websiteResume.employmentHistory.map(WorkExperience.init(websiteExperience:)),
            education: websiteResume.education.map(EducationEntry.init(websiteEducation:)),
            skills: websiteResume.skills.map(\.name).filter { !$0.isEmpty },
            updatedAt: websiteResume.updatedAt
        )
    }

    public func toWebsiteResumeData() -> WebsiteResumeData {
        let nameParts = splitName(personalInfo.name)
        let linkedInLink: [WebsiteLinkData] = personalInfo.linkedin.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? []
            : [
                WebsiteLinkData(
                    label: "LinkedIn",
                    url: personalInfo.linkedin,
                    showUrl: true,
                    platform: "linkedin"
                )
            ]

        return WebsiteResumeData(
            id: remoteId,
            title: personalInfo.name.isEmpty ? "Untitled Resume" : "\(personalInfo.name)'s Resume",
            updatedAt: ISO8601DateFormatter().string(from: Date()),
            templateId: templateID.rawValue,
            personalDetails: WebsitePersonalDetails(
                jobTitle: personalInfo.title,
                firstName: nameParts.firstName,
                lastName: nameParts.lastName,
                email: personalInfo.email,
                phone: personalInfo.phone,
                city: personalInfo.location
            ),
            professionalSummary: summary,
            websites: linkedInLink,
            skills: skills.map { WebsiteSkillData(name: $0, level: "Intermediate") },
            employmentHistory: experiences.map(\.websiteExperience),
            education: education.map(\.websiteEducation),
            languages: [],
            section: "resumes"
        )
    }

    private static func joinLocation(city: String, address: String, country: String) -> String {
        [city, address, country]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
    }

    private static func localUUID(remoteId: String?) -> UUID {
        guard let remoteId, let uuid = UUID(uuidString: remoteId) else {
            return UUID()
        }
        return uuid
    }

    private func splitName(_ fullName: String) -> (firstName: String, lastName: String) {
        var parts = fullName.split(separator: " ").map(String.init)
        let first = parts.isEmpty ? "" : parts.removeFirst()
        return (first, parts.joined(separator: " "))
    }
}

extension WorkExperience {
    init(websiteExperience: WebsiteEmploymentHistoryData) {
        self.init(
            id: UUID(uuidString: websiteExperience.id) ?? UUID(),
            company: websiteExperience.employer,
            role: websiteExperience.jobTitle,
            period: Self.joinPeriod(start: websiteExperience.startDate, end: websiteExperience.endDate),
            bullets: Self.splitBullets(websiteExperience.description)
        )
    }

    var websiteExperience: WebsiteEmploymentHistoryData {
        let periodParts = splitPeriod(period)
        return WebsiteEmploymentHistoryData(
            id: id.uuidString,
            jobTitle: role,
            employer: company,
            startDate: periodParts.start,
            endDate: periodParts.end,
            description: bullets.map { "• \($0)" }.joined(separator: "\n")
        )
    }

    private static func joinPeriod(start: String, end: String) -> String {
        let cleaned = [start, end].map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        if cleaned.allSatisfy(\.isEmpty) { return "" }
        return cleaned.joined(separator: " – ")
    }

    private static func splitBullets(_ description: String) -> [String] {
        let lines = description
            .components(separatedBy: .newlines)
            .flatMap { $0.components(separatedBy: "•") }
            .map { $0.trimmingCharacters(in: CharacterSet(charactersIn: " -\t")) }
            .filter { !$0.isEmpty }
        return lines.isEmpty && !description.isEmpty ? [description] : lines
    }

    private func splitPeriod(_ period: String) -> (start: String, end: String) {
        let parts = period
            .replacingOccurrences(of: "-", with: "–")
            .components(separatedBy: "–")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        return (parts.first ?? "", parts.dropFirst().joined(separator: " – "))
    }
}

extension EducationEntry {
    init(websiteEducation: WebsiteEducationData) {
        self.init(
            id: UUID(uuidString: websiteEducation.id) ?? UUID(),
            school: websiteEducation.school,
            degree: websiteEducation.degree,
            year: websiteEducation.endDate.isEmpty ? websiteEducation.startDate : websiteEducation.endDate
        )
    }

    var websiteEducation: WebsiteEducationData {
        WebsiteEducationData(
            id: id.uuidString,
            school: school,
            degree: degree,
            endDate: year
        )
    }
}
