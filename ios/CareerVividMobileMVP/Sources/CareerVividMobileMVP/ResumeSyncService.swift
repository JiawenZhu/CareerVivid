import Foundation

public enum ResumeAIAction: String, CaseIterable, Identifiable, Sendable {
    case analyze
    case tailor
    case refine
    case condense
    case atsInject = "ats_inject"

    public var id: String { rawValue }
}

public struct ResumeAIAnalysis: Codable, Equatable, Sendable {
    public var score: Int
    public var missingKeywords: [String]
    public var suggestions: [String]

    public init(score: Int = 0, missingKeywords: [String] = [], suggestions: [String] = []) {
        self.score = score
        self.missingKeywords = missingKeywords
        self.suggestions = suggestions
    }
}

public struct ResumeAIResult: Equatable, Sendable {
    public var resume: EditableResume?
    public var analysis: ResumeAIAnalysis?
    public var injectedKeywords: [String]
    public var keywordCoverage: Double?

    public init(
        resume: EditableResume? = nil,
        analysis: ResumeAIAnalysis? = nil,
        injectedKeywords: [String] = [],
        keywordCoverage: Double? = nil
    ) {
        self.resume = resume
        self.analysis = analysis
        self.injectedKeywords = injectedKeywords
        self.keywordCoverage = keywordCoverage
    }
}

public enum ResumeSyncError: Error, LocalizedError {
    case missingRemoteId
    case badResponse(Int)
    case functionError(String)
    case invalidResponse
    case decodeFailure(String)

    public var errorDescription: String? {
        switch self {
        case .missingRemoteId:
            return "This resume has not been created in CareerVivid yet."
        case .badResponse(let status):
            return "CareerVivid API returned HTTP \(status)."
        case .functionError(let message):
            return message
        case .invalidResponse:
            return "CareerVivid API returned a response the app could not read."
        case .decodeFailure(let message):
            return message
        }
    }
}

private struct CareerVividAPIErrorResponse: Decodable {
    var error: String?
    var message: String?
    var transcript: String?
}

public protocol ResumeSyncing {
    func loadResumes() async throws -> [EditableResume]
    func createResume(_ resume: EditableResume) async throws -> EditableResume
    func createResumeFromCoachTranscript(_ transcript: String, title: String) async throws -> EditableResume
    func saveResume(_ resume: EditableResume) async throws -> EditableResume
    func deleteResume(_ resume: EditableResume) async throws
    func runAI(
        action: ResumeAIAction,
        resume: EditableResume,
        jobDescription: String,
        instruction: String
    ) async throws -> ResumeAIResult
}

public actor MockCareerVividResumeService: ResumeSyncing {
    private var resumes: [EditableResume]

    public init(resumes: [EditableResume] = [SampleCareerVividData.editableResume]) {
        self.resumes = resumes
    }

    public func loadResumes() async throws -> [EditableResume] {
        resumes
    }

    public func createResume(_ resume: EditableResume) async throws -> EditableResume {
        var created = resume
        created.remoteId = created.remoteId ?? UUID().uuidString
        created.updatedAt = ISO8601DateFormatter().string(from: Date())
        resumes.insert(created, at: 0)
        return created
    }

    public func createResumeFromCoachTranscript(_ transcript: String, title: String) async throws -> EditableResume {
        var created = EditableResume(
            remoteId: UUID().uuidString,
            templateID: .modern,
            personalInfo: PersonalInfo(
                name: "Resume Coach Draft",
                title: "Target role from coaching session",
                email: "you@example.com"
            ),
            summary: transcript.split(separator: "\n").prefix(2).joined(separator: " "),
            experiences: [
                WorkExperience(
                    company: "Your company",
                    role: "Your role",
                    period: "Recent",
                    bullets: ["Turn the strongest coach-session answer into a measurable achievement."]
                )
            ],
            skills: ["Resume coach", "CareerVivid", "AI draft"]
        )
        created.updatedAt = ISO8601DateFormatter().string(from: Date())
        resumes.insert(created, at: 0)
        return created
    }

    public func saveResume(_ resume: EditableResume) async throws -> EditableResume {
        var saved = resume
        saved.remoteId = saved.remoteId ?? UUID().uuidString
        saved.updatedAt = ISO8601DateFormatter().string(from: Date())
        if let index = resumes.firstIndex(where: { $0.id == saved.id }) {
            resumes[index] = saved
        } else {
            resumes.insert(saved, at: 0)
        }
        return saved
    }

    public func deleteResume(_ resume: EditableResume) async throws {
        resumes.removeAll { $0.id == resume.id }
    }

    public func runAI(
        action: ResumeAIAction,
        resume: EditableResume,
        jobDescription: String,
        instruction: String
    ) async throws -> ResumeAIResult {
        switch action {
        case .analyze:
            let matchedSkills = resume.skills.filter { skill in
                jobDescription.localizedCaseInsensitiveContains(skill)
            }
            return ResumeAIResult(
                analysis: ResumeAIAnalysis(
                    score: min(95, 55 + matchedSkills.count * 8),
                    missingKeywords: ["Impact metrics", "Role-specific keywords"],
                    suggestions: ["Add measurable outcomes to the latest role.", "Mirror the job title and core tools naturally."]
                )
            )
        case .tailor, .refine, .atsInject:
            var updated = resume
            let skill = action == .atsInject ? "ATS keyword matching" : "Role-aligned impact"
            if !updated.skills.contains(skill) {
                updated.skills.append(skill)
            }
            if !instruction.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                updated.summary = instruction
            } else if !updated.summary.localizedCaseInsensitiveContains("impact") {
                updated.summary += " Focused on measurable product impact and role-aligned delivery."
            }
            return ResumeAIResult(
                resume: updated,
                injectedKeywords: [skill],
                keywordCoverage: 82
            )
        case .condense:
            var updated = resume
            updated.experiences = updated.experiences.map { experience in
                var condensed = experience
                condensed.bullets = Array(condensed.bullets.prefix(2))
                return condensed
            }
            return ResumeAIResult(resume: updated)
        }
    }
}

public struct CareerVividRESTConfig: Sendable {
    public var projectId: String
    public var region: String
    public var uid: String
    public var idToken: String

    public init(
        projectId: String = "jastalk-firebase",
        region: String = "us-west1",
        uid: String,
        idToken: String
    ) {
        self.projectId = projectId
        self.region = region
        self.uid = uid
        self.idToken = idToken
    }
}

public final class CareerVividRESTResumeService: ResumeSyncing {
    private let config: CareerVividRESTConfig
    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init(config: CareerVividRESTConfig, session: URLSession = .shared) {
        self.config = config
        self.session = session
    }

    public func loadResumes() async throws -> [EditableResume] {
        var request = URLRequest(url: resumesCollectionURL)
        request.httpMethod = "GET"
        authorize(&request)

        let data = try await data(for: request)
        let response = try decoder.decode(FirestoreListResponse.self, from: data)
        return try (response.documents ?? []).map { document in
            var payload = document.decodedFields()
            payload["id"] = document.documentId
            let jsonData = try JSONSerialization.data(withJSONObject: payload)
            let websiteResume = try decoder.decode(WebsiteResumeData.self, from: jsonData)
            return EditableResume(websiteResume: websiteResume)
        }
    }

    public func createResume(_ resume: EditableResume) async throws -> EditableResume {
        var websiteResume = resume.toWebsiteResumeData()
        websiteResume.updatedAt = ISO8601DateFormatter().string(from: Date())

        var request = URLRequest(url: resumesCollectionURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        authorize(&request)
        request.httpBody = try encoder.encode(FirestoreDocument(fields: websiteResume.firestoreFields()))

        let data = try await data(for: request)
        let document = try decoder.decode(FirestoreDocument.self, from: data)
        websiteResume.id = document.documentId
        return EditableResume(websiteResume: websiteResume)
    }

    public func createResumeFromCoachTranscript(_ transcript: String, title: String) async throws -> EditableResume {
        let endpoint = URL(string: "https://\(config.region)-\(config.projectId).cloudfunctions.net/resumeCoachCreate")!
        let requestData = ResumeCoachCreateRequest(
            title: title,
            transcript: transcript
        )

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        authorize(&request)
        request.httpBody = try encoder.encode(requestData)

        let data = try await data(for: request)
        let result: ResumeCoachCreateResponse
        do {
            result = try decoder.decode(ResumeCoachCreateResponse.self, from: data)
        } catch {
            throw ResumeSyncError.decodeFailure("CareerVivid created a response, but the app could not read its format. \(Self.describeDecodeError(error))")
        }

        if result.success == false {
            throw ResumeSyncError.functionError(result.message ?? "Resume coach generation did not complete.")
        }

        if let resume = result.resume {
            return EditableResume(websiteResume: resume)
        }

        guard let remoteId = result.resolvedResumeId, !remoteId.isEmpty else {
            throw ResumeSyncError.invalidResponse
        }

        do {
            return try await loadResume(remoteId: remoteId)
        } catch {
            throw ResumeSyncError.decodeFailure("CareerVivid saved the resume, but the app could not read the saved resume format. \(Self.describeDecodeError(error))")
        }
    }

    public func saveResume(_ resume: EditableResume) async throws -> EditableResume {
        guard let remoteId = resume.remoteId else {
            return try await createResume(resume)
        }

        var websiteResume = resume.toWebsiteResumeData()
        websiteResume.id = remoteId
        websiteResume.updatedAt = ISO8601DateFormatter().string(from: Date())

        var components = URLComponents(url: resumeDocumentURL(remoteId: remoteId), resolvingAgainstBaseURL: false)!
        components.queryItems = WebsiteResumeData.firestoreTopLevelFields.map {
            URLQueryItem(name: "updateMask.fieldPaths", value: $0)
        }

        var request = URLRequest(url: components.url!)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        authorize(&request)
        request.httpBody = try encoder.encode(FirestoreDocument(fields: websiteResume.firestoreFields()))

        _ = try await data(for: request)
        return EditableResume(websiteResume: websiteResume)
    }

    public func deleteResume(_ resume: EditableResume) async throws {
        guard let remoteId = resume.remoteId else { throw ResumeSyncError.missingRemoteId }
        var request = URLRequest(url: resumeDocumentURL(remoteId: remoteId))
        request.httpMethod = "DELETE"
        authorize(&request)
        _ = try await data(for: request)
    }

    public func runAI(
        action: ResumeAIAction,
        resume: EditableResume,
        jobDescription: String,
        instruction: String
    ) async throws -> ResumeAIResult {
        let endpoint = URL(string: "https://\(config.region)-\(config.projectId).cloudfunctions.net/tailorResume")!
        let requestData = TailorResumeCallableData(
            resume: resume.toWebsiteResumeData(),
            jobDescription: jobDescription,
            action: action.rawValue,
            instruction: instruction
        )
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        authorize(&request)
        request.httpBody = try encoder.encode(CallableRequest(data: requestData))

        let data = try await data(for: request)
        let envelope = try decoder.decode(CallableResponse<TailorResumeCallableResult>.self, from: data)
        if let error = envelope.error {
            throw ResumeSyncError.functionError(error.message)
        }
        guard let result = envelope.result else {
            throw ResumeSyncError.invalidResponse
        }
        let tailored = result.tailoredResume.map(EditableResume.init(websiteResume:))
        return ResumeAIResult(
            resume: tailored,
            analysis: result.analysis,
            injectedKeywords: result.injectedKeywords ?? [],
            keywordCoverage: result.keywordCoverage
        )
    }

    private var resumesCollectionURL: URL {
        URL(string: "https://firestore.googleapis.com/v1/projects/\(config.projectId)/databases/(default)/documents/users/\(config.uid)/resumes")!
    }

    private func resumeDocumentURL(remoteId: String) -> URL {
        URL(string: "https://firestore.googleapis.com/v1/projects/\(config.projectId)/databases/(default)/documents/users/\(config.uid)/resumes/\(remoteId)")!
    }

    private func loadResume(remoteId: String) async throws -> EditableResume {
        var request = URLRequest(url: resumeDocumentURL(remoteId: remoteId))
        request.httpMethod = "GET"
        authorize(&request)

        let data = try await data(for: request)
        let document = try decoder.decode(FirestoreDocument.self, from: data)
        var payload = document.decodedFields()
        payload["id"] = document.documentId ?? remoteId
        let jsonData = try JSONSerialization.data(withJSONObject: payload)
        let websiteResume = try decoder.decode(WebsiteResumeData.self, from: jsonData)
        return EditableResume(websiteResume: websiteResume)
    }

    private func authorize(_ request: inout URLRequest) {
        request.setValue("Bearer \(config.idToken)", forHTTPHeaderField: "Authorization")
    }

    private func data(for request: URLRequest) async throws -> Data {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { return data }
        guard (200..<300).contains(http.statusCode) else {
            if let message = decodeErrorMessage(from: data, statusCode: http.statusCode) {
                throw ResumeSyncError.functionError(message)
            }
            throw ResumeSyncError.badResponse(http.statusCode)
        }
        return data
    }

    private func decodeErrorMessage(from data: Data, statusCode: Int) -> String? {
        guard let payload = try? decoder.decode(CareerVividAPIErrorResponse.self, from: data) else {
            return nil
        }

        let message = (payload.error ?? payload.message)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard let message, !message.isEmpty else { return nil }

        if statusCode == 422, let transcript = payload.transcript?.trimmingCharacters(in: .whitespacesAndNewlines), !transcript.isEmpty {
            let excerpt = transcript.count > 80
                ? String(transcript.prefix(80)) + "..."
                : transcript
            return "\(message) Heard: \"\(excerpt)\""
        }

        return message
    }

    private static func describeDecodeError(_ error: Error) -> String {
        guard let decodingError = error as? DecodingError else {
            return error.localizedDescription
        }

        switch decodingError {
        case .keyNotFound(let key, let context):
            return "Missing field: \(key.stringValue). \(context.debugDescription)"
        case .typeMismatch(let type, let context):
            return "Type mismatch for \(type). \(context.debugDescription)"
        case .valueNotFound(let type, let context):
            return "Missing value for \(type). \(context.debugDescription)"
        case .dataCorrupted(let context):
            return "Invalid data. \(context.debugDescription)"
        @unknown default:
            return decodingError.localizedDescription
        }
    }
}

private struct FirestoreListResponse: Codable {
    var documents: [FirestoreDocument]?
}

private struct FirestoreDocument: Codable {
    var name: String?
    var fields: [String: FirestoreValue]

    var documentId: String? {
        name?.components(separatedBy: "/").last
    }

    func decodedFields() -> [String: Any] {
        fields.mapValues { $0.anyValue }
    }
}

private struct FirestoreValue: Codable {
    var stringValue: String?
    var integerValue: String?
    var doubleValue: Double?
    var booleanValue: Bool?
    var timestampValue: String?
    var arrayValue: FirestoreArrayValue?
    var mapValue: FirestoreMapValue?

    var anyValue: Any {
        if let stringValue { return stringValue }
        if let integerValue { return Int(integerValue) ?? 0 }
        if let doubleValue { return doubleValue }
        if let booleanValue { return booleanValue }
        if let timestampValue { return timestampValue }
        if let arrayValue { return arrayValue.values?.map(\.anyValue) ?? [] }
        if let mapValue { return mapValue.fields?.mapValues { $0.anyValue } ?? [:] }
        return NSNull()
    }

    static func encode(_ value: Any) -> FirestoreValue {
        switch value {
        case let value as String:
            return FirestoreValue(stringValue: value)
        case let value as Bool:
            return FirestoreValue(booleanValue: value)
        case let value as Int:
            return FirestoreValue(integerValue: String(value))
        case let value as Double:
            return FirestoreValue(doubleValue: value)
        case let value as [Any]:
            return FirestoreValue(arrayValue: FirestoreArrayValue(values: value.map(FirestoreValue.encode)))
        case let value as [String: Any]:
            return FirestoreValue(mapValue: FirestoreMapValue(fields: value.mapValues(FirestoreValue.encode)))
        default:
            return FirestoreValue(stringValue: String(describing: value))
        }
    }
}

private struct FirestoreArrayValue: Codable {
    var values: [FirestoreValue]?
}

private struct FirestoreMapValue: Codable {
    var fields: [String: FirestoreValue]?
}

private extension WebsiteResumeData {
    static let firestoreTopLevelFields = [
        "title",
        "updatedAt",
        "templateId",
        "personalDetails",
        "professionalSummary",
        "websites",
        "skills",
        "employmentHistory",
        "education",
        "languages",
        "themeColor",
        "titleFont",
        "bodyFont",
        "language",
        "section"
    ]

    func firestoreFields() throws -> [String: FirestoreValue] {
        let data = try JSONEncoder().encode(self)
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        return object.mapValues(FirestoreValue.encode)
    }
}

private struct CallableRequest<T: Encodable>: Encodable {
    var data: T
}

private struct CallableResponse<T: Decodable>: Decodable {
    var result: T?
    var error: CallableError?
}

private struct CallableError: Decodable {
    var message: String
}

private struct TailorResumeCallableData: Encodable {
    var resume: WebsiteResumeData
    var jobDescription: String
    var action: String
    var instruction: String
}

private struct TailorResumeCallableResult: Decodable {
    var success: Bool?
    var tailoredResume: WebsiteResumeData?
    var analysis: ResumeAIAnalysis?
    var injectedKeywords: [String]?
    var keywordCoverage: Double?
}

private struct ResumeCoachCreateRequest: Encodable {
    var title: String
    var transcript: String
}

private struct ResumeCoachCreateResponse: Decodable {
    var success: Bool?
    var resumeId: String?
    var id: String?
    var resume: WebsiteResumeData?
    var message: String?

    var resolvedResumeId: String? {
        resumeId ?? id ?? resume?.id
    }
}
