import Foundation

private extension KeyedDecodingContainer {
    func decodeString(forKey key: Key, default defaultValue: String = "") -> String {
        (try? decodeIfPresent(String.self, forKey: key)) ?? defaultValue
    }

    func decodeBool(forKey key: Key, default defaultValue: Bool? = nil) -> Bool? {
        (try? decodeIfPresent(Bool.self, forKey: key)) ?? defaultValue
    }

    func decodeArray<T: Decodable>(_ type: [T].Type, forKey key: Key) -> [T] {
        (try? decodeIfPresent(type, forKey: key)) ?? []
    }
}

public struct WebsitePersonalDetails: Codable, Equatable, Sendable {
    public var jobTitle: String
    public var photo: String
    public var firstName: String
    public var lastName: String
    public var email: String
    public var phone: String
    public var address: String
    public var city: String
    public var postalCode: String
    public var country: String

    public init(
        jobTitle: String = "",
        photo: String = "",
        firstName: String = "",
        lastName: String = "",
        email: String = "",
        phone: String = "",
        address: String = "",
        city: String = "",
        postalCode: String = "",
        country: String = ""
    ) {
        self.jobTitle = jobTitle
        self.photo = photo
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.phone = phone
        self.address = address
        self.city = city
        self.postalCode = postalCode
        self.country = country
    }

    private enum CodingKeys: String, CodingKey {
        case jobTitle, photo, firstName, lastName, email, phone, address, city, postalCode, country
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.jobTitle = container.decodeString(forKey: .jobTitle)
        self.photo = container.decodeString(forKey: .photo)
        self.firstName = container.decodeString(forKey: .firstName)
        self.lastName = container.decodeString(forKey: .lastName)
        self.email = container.decodeString(forKey: .email)
        self.phone = container.decodeString(forKey: .phone)
        self.address = container.decodeString(forKey: .address)
        self.city = container.decodeString(forKey: .city)
        self.postalCode = container.decodeString(forKey: .postalCode)
        self.country = container.decodeString(forKey: .country)
    }
}

public struct WebsiteLinkData: Codable, Equatable, Sendable {
    public var id: String
    public var label: String
    public var url: String
    public var icon: String?
    public var showUrl: Bool?
    public var platform: String?

    public init(
        id: String = UUID().uuidString,
        label: String = "",
        url: String = "",
        icon: String? = nil,
        showUrl: Bool? = nil,
        platform: String? = nil
    ) {
        self.id = id
        self.label = label
        self.url = url
        self.icon = icon
        self.showUrl = showUrl
        self.platform = platform
    }

    private enum CodingKeys: String, CodingKey {
        case id, label, url, icon, showUrl, platform
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = container.decodeString(forKey: .id, default: UUID().uuidString)
        self.label = container.decodeString(forKey: .label)
        self.url = container.decodeString(forKey: .url)
        self.icon = try container.decodeIfPresent(String.self, forKey: .icon)
        self.showUrl = container.decodeBool(forKey: .showUrl)
        self.platform = try container.decodeIfPresent(String.self, forKey: .platform)
    }
}

public struct WebsiteSkillData: Codable, Equatable, Sendable {
    public var id: String
    public var name: String
    public var level: String

    public init(id: String = UUID().uuidString, name: String = "", level: String = "Intermediate") {
        self.id = id
        self.name = name
        self.level = level
    }

    private enum CodingKeys: String, CodingKey {
        case id, name, level
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = container.decodeString(forKey: .id, default: UUID().uuidString)
        self.name = container.decodeString(forKey: .name)
        self.level = container.decodeString(forKey: .level, default: "Intermediate")
    }
}

public struct WebsiteLanguageData: Codable, Equatable, Sendable {
    public var id: String
    public var name: String
    public var level: String

    public init(id: String = UUID().uuidString, name: String = "", level: String = "") {
        self.id = id
        self.name = name
        self.level = level
    }

    private enum CodingKeys: String, CodingKey {
        case id, name, level
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = container.decodeString(forKey: .id, default: UUID().uuidString)
        self.name = container.decodeString(forKey: .name)
        self.level = container.decodeString(forKey: .level)
    }
}

public struct WebsiteEmploymentHistoryData: Codable, Equatable, Sendable {
    public var id: String
    public var jobTitle: String
    public var employer: String
    public var city: String
    public var startDate: String
    public var endDate: String
    public var description: String

    public init(
        id: String = UUID().uuidString,
        jobTitle: String = "",
        employer: String = "",
        city: String = "",
        startDate: String = "",
        endDate: String = "",
        description: String = ""
    ) {
        self.id = id
        self.jobTitle = jobTitle
        self.employer = employer
        self.city = city
        self.startDate = startDate
        self.endDate = endDate
        self.description = description
    }

    private enum CodingKeys: String, CodingKey {
        case id, jobTitle, employer, city, startDate, endDate, description
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = container.decodeString(forKey: .id, default: UUID().uuidString)
        self.jobTitle = container.decodeString(forKey: .jobTitle)
        self.employer = container.decodeString(forKey: .employer)
        self.city = container.decodeString(forKey: .city)
        self.startDate = container.decodeString(forKey: .startDate)
        self.endDate = container.decodeString(forKey: .endDate)
        self.description = container.decodeString(forKey: .description)
    }
}

public struct WebsiteEducationData: Codable, Equatable, Sendable {
    public var id: String
    public var school: String
    public var degree: String
    public var city: String
    public var startDate: String
    public var endDate: String
    public var description: String

    public init(
        id: String = UUID().uuidString,
        school: String = "",
        degree: String = "",
        city: String = "",
        startDate: String = "",
        endDate: String = "",
        description: String = ""
    ) {
        self.id = id
        self.school = school
        self.degree = degree
        self.city = city
        self.startDate = startDate
        self.endDate = endDate
        self.description = description
    }

    private enum CodingKeys: String, CodingKey {
        case id, school, degree, city, startDate, endDate, description
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = container.decodeString(forKey: .id, default: UUID().uuidString)
        self.school = container.decodeString(forKey: .school)
        self.degree = container.decodeString(forKey: .degree)
        self.city = container.decodeString(forKey: .city)
        self.startDate = container.decodeString(forKey: .startDate)
        self.endDate = container.decodeString(forKey: .endDate)
        self.description = container.decodeString(forKey: .description)
    }
}

public struct WebsiteResumeData: Codable, Equatable, Sendable {
    public var id: String?
    public var title: String
    public var updatedAt: String
    public var templateId: String
    public var personalDetails: WebsitePersonalDetails
    public var professionalSummary: String
    public var websites: [WebsiteLinkData]
    public var skills: [WebsiteSkillData]
    public var employmentHistory: [WebsiteEmploymentHistoryData]
    public var education: [WebsiteEducationData]
    public var languages: [WebsiteLanguageData]
    public var themeColor: String
    public var titleFont: String
    public var bodyFont: String
    public var language: String
    public var section: String?

    public init(
        id: String? = nil,
        title: String = "Untitled Resume",
        updatedAt: String = ISO8601DateFormatter().string(from: Date()),
        templateId: String = "Modern",
        personalDetails: WebsitePersonalDetails = WebsitePersonalDetails(),
        professionalSummary: String = "",
        websites: [WebsiteLinkData] = [],
        skills: [WebsiteSkillData] = [],
        employmentHistory: [WebsiteEmploymentHistoryData] = [],
        education: [WebsiteEducationData] = [],
        languages: [WebsiteLanguageData] = [],
        themeColor: String = "#625bd5",
        titleFont: String = "Montserrat",
        bodyFont: String = "Crimson Text",
        language: String = "English",
        section: String? = "resumes"
    ) {
        self.id = id
        self.title = title
        self.updatedAt = updatedAt
        self.templateId = templateId
        self.personalDetails = personalDetails
        self.professionalSummary = professionalSummary
        self.websites = websites
        self.skills = skills
        self.employmentHistory = employmentHistory
        self.education = education
        self.languages = languages
        self.themeColor = themeColor
        self.titleFont = titleFont
        self.bodyFont = bodyFont
        self.language = language
        self.section = section
    }

    private enum CodingKeys: String, CodingKey {
        case id
        case title
        case updatedAt
        case templateId
        case personalDetails
        case professionalSummary
        case websites
        case skills
        case employmentHistory
        case education
        case languages
        case themeColor
        case titleFont
        case bodyFont
        case language
        case section
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.id = try container.decodeIfPresent(String.self, forKey: .id)
        self.title = container.decodeString(forKey: .title, default: "Untitled Resume")
        self.updatedAt = container.decodeString(forKey: .updatedAt, default: ISO8601DateFormatter().string(from: Date()))
        self.templateId = container.decodeString(forKey: .templateId, default: "Modern")
        self.personalDetails = (try? container.decodeIfPresent(WebsitePersonalDetails.self, forKey: .personalDetails)) ?? WebsitePersonalDetails()
        self.professionalSummary = container.decodeString(forKey: .professionalSummary)
        self.websites = container.decodeArray([WebsiteLinkData].self, forKey: .websites)
        self.skills = container.decodeArray([WebsiteSkillData].self, forKey: .skills)
        self.employmentHistory = container.decodeArray([WebsiteEmploymentHistoryData].self, forKey: .employmentHistory)
        self.education = container.decodeArray([WebsiteEducationData].self, forKey: .education)
        self.languages = container.decodeArray([WebsiteLanguageData].self, forKey: .languages)
        self.themeColor = container.decodeString(forKey: .themeColor, default: "#625bd5")
        self.titleFont = container.decodeString(forKey: .titleFont, default: "Montserrat")
        self.bodyFont = container.decodeString(forKey: .bodyFont, default: "Crimson Text")
        self.language = container.decodeString(forKey: .language, default: "English")
        self.section = try container.decodeIfPresent(String.self, forKey: .section) ?? "resumes"
    }
}
