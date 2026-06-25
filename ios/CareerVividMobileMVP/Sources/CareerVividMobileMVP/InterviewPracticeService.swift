import Foundation

enum InterviewPracticeServiceError: Error, LocalizedError {
    case invalidResponse
    case functionError(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "CareerVivid returned a response the app could not read."
        case .functionError(let message):
            return message
        }
    }
}

struct InterviewLiveConfig: Equatable, Sendable {
    var job: JobLead
    var category: PracticeCategory
    var questions: [String]
    var remediationContextId: String?
    var remediationFocus: [String] = []

    var prompt: String {
        let base = "\(category.rawValue) interview for \(job.title) at \(job.company). Focus on role-specific proof, communication, decision quality, and practical experience."
        guard !remediationFocus.isEmpty else { return base }
        return "\(base) This is a targeted weakness remediation interview. Focus on: \(remediationFocus.joined(separator: "; "))."
    }
}

enum InterviewLiveSpeaker: String, Codable, Equatable, Sendable {
    case interviewer = "ai"
    case user = "user"

    var displayName: String {
        switch self {
        case .interviewer: return "Vivid"
        case .user: return "You"
        }
    }
}

struct InterviewLiveMessage: Identifiable, Equatable, Sendable {
    let id: UUID
    var speaker: InterviewLiveSpeaker
    var text: String
    var isLive: Bool
    var timestamp: Int

    init(id: UUID = UUID(), speaker: InterviewLiveSpeaker, text: String, isLive: Bool = false, timestamp: Int = Int(Date().timeIntervalSince1970 * 1000)) {
        self.id = id
        self.speaker = speaker
        self.text = text
        self.isLive = isLive
        self.timestamp = timestamp
    }
}

struct InterviewTranscriptEntry: Codable, Equatable, Sendable {
    var speaker: InterviewLiveSpeaker
    var text: String
    var isFinal: Bool
    var timestamp: Int
}

struct InterviewAnalysisResult: Codable, Equatable, Sendable {
    var id: String
    var timestamp: Int
    var overallScore: Int
    var communicationScore: Int
    var confidenceScore: Int
    var relevanceScore: Int
    var strengths: String
    var areasForImprovement: String
    var transcript: [InterviewTranscriptEntry]
    var durationInSeconds: Int?
}

struct InterviewLiveToken: Decodable, Sendable {
    let accessToken: String
    let project: String
    let location: String
    let model: String
    let sessionId: String
    let questions: [String]?
}

private struct InterviewAPIErrorResponse: Decodable {
    var error: String?
    var message: String?
}

private struct MobileInterviewAnalyzeResponse: Decodable {
    var success: Bool
    var practiceId: String
    var analysis: InterviewAnalysisResult
}

actor InterviewPracticeService {
    private let projectId: String
    private let region: String
    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(projectId: String = "jastalk-firebase", region: String = "us-west1", session: URLSession = .shared) {
        self.projectId = projectId
        self.region = region
        self.session = session
    }

    func fetchLiveToken(config: InterviewLiveConfig) async throws -> InterviewLiveToken {
        let endpoint = URL(string: "https://\(region)-\(projectId).cloudfunctions.net/mobileInterviewLiveToken")!
        var payload = basePayload(config: config)
        payload["source"] = "ios"
        return try await post(endpoint: endpoint, payload: payload, responseType: InterviewLiveToken.self)
    }

    func analyze(
        config: InterviewLiveConfig,
        sessionId: String?,
        transcript: [InterviewTranscriptEntry],
        durationInSeconds: Int
    ) async throws -> InterviewAnalysisResult {
        let endpoint = URL(string: "https://\(region)-\(projectId).cloudfunctions.net/mobileInterviewAnalyze")!
        var payload = basePayload(config: config)
        payload["sessionId"] = sessionId ?? ""
        payload["prompt"] = config.prompt
        payload["durationInSeconds"] = max(durationInSeconds, 1)
        payload["transcript"] = transcript.map { entry in
            [
                "speaker": entry.speaker.rawValue,
                "text": entry.text,
                "isFinal": entry.isFinal,
                "timestamp": entry.timestamp,
            ] as [String: Any]
        }
        let response = try await post(endpoint: endpoint, payload: payload, responseType: MobileInterviewAnalyzeResponse.self)
        guard response.success else {
            throw InterviewPracticeServiceError.invalidResponse
        }
        return response.analysis
    }

    private func basePayload(config: InterviewLiveConfig) -> [String: Any] {
        var payload: [String: Any] = [
            "jobTitle": config.job.title,
            "company": config.job.company,
            "category": config.category.rawValue,
            "questions": config.questions,
        ]
        if let remediationContextId = config.remediationContextId {
            payload["remediationContextId"] = remediationContextId
        }
        if !config.remediationFocus.isEmpty {
            payload["remediationFocus"] = config.remediationFocus
        }
        return payload
    }

    private func post<T: Decodable>(
        endpoint: URL,
        payload: [String: Any],
        responseType: T.Type
    ) async throws -> T {
        let auth = try await CVFirebaseAuth.shared.authToken()
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        request.timeoutInterval = endpoint.lastPathComponent == "mobileInterviewAnalyze" ? 150 : 30
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(auth.idToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await session.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            #if DEBUG
            print("[InterviewPracticeService] \(endpoint.lastPathComponent) failed with HTTP \(http.statusCode): \(String(data: data, encoding: .utf8) ?? "<unreadable body>")")
            #endif
            let message = decodeErrorMessage(from: data) ?? defaultErrorMessage(statusCode: http.statusCode, endpoint: endpoint)
            throw InterviewPracticeServiceError.functionError(message)
        }

        do {
            return try decoder.decode(responseType, from: data)
        } catch {
            throw InterviewPracticeServiceError.functionError("CareerVivid returned data, but the app could not read it. \(describeDecodeError(error))")
        }
    }

    private func decodeErrorMessage(from data: Data) -> String? {
        guard let payload = try? decoder.decode(InterviewAPIErrorResponse.self, from: data) else {
            return nil
        }
        let message = (payload.error ?? payload.message)?.trimmingCharacters(in: .whitespacesAndNewlines)
        return message?.isEmpty == false ? message : nil
    }

    private func defaultErrorMessage(statusCode: Int, endpoint: URL) -> String {
        if statusCode == 404, endpoint.lastPathComponent.hasPrefix("mobileInterview") {
            return "Mobile interview endpoint returned HTTP 404. The function is deployed, so reinstall the latest app build or check the endpoint path: \(endpoint.lastPathComponent)."
        }
        return "CareerVivid API returned HTTP \(statusCode)."
    }

    private func describeDecodeError(_ error: Error) -> String {
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

struct LocalInterviewReportSnapshot: Codable, Equatable, Sendable {
    var jobTitle: String
    var company: String
    var category: String
    var savedAt: Int
    var analysis: InterviewAnalysisResult
}

struct InterviewReportSnapshot: Identifiable, Equatable, Sendable {
    var id: String
    var practiceId: String
    var jobTitle: String
    var company: String
    var category: PracticeCategory
    var questions: [String]
    var savedAt: Int
    var analysis: InterviewAnalysisResult

    var config: InterviewLiveConfig {
        let job = JobLead(
            title: jobTitle.isEmpty ? "Interview Practice" : jobTitle,
            company: company.isEmpty ? "CareerVivid" : company,
            matchScore: 80,
            stage: .interview,
            nextStep: "Review report"
        )
        return InterviewLiveConfig(
            job: job,
            category: category,
            questions: questions.isEmpty ? roleSpecificQuestions(job: job, category: category) : questions
        )
    }

    var displayDate: String {
        let date = Date(timeIntervalSince1970: TimeInterval(savedAt) / 1000)
        return date.formatted(.dateTime.month(.abbreviated).day().hour().minute())
    }

    static func local(_ snapshot: LocalInterviewReportSnapshot) -> InterviewReportSnapshot {
        InterviewReportSnapshot(
            id: "local-\(snapshot.analysis.id)",
            practiceId: snapshot.analysis.id,
            jobTitle: snapshot.jobTitle,
            company: snapshot.company,
            category: Self.parseCategory(snapshot.category),
            questions: [],
            savedAt: snapshot.savedAt,
            analysis: snapshot.analysis
        )
    }

    static func current(result: InterviewAnalysisResult, config: InterviewLiveConfig) -> InterviewReportSnapshot {
        InterviewReportSnapshot(
            id: "current-\(result.id)",
            practiceId: result.id,
            jobTitle: config.job.title,
            company: config.job.company,
            category: config.category,
            questions: config.questions,
            savedAt: result.timestamp,
            analysis: result
        )
    }

    private static func parseCategory(_ value: String) -> PracticeCategory {
        PracticeCategory(rawValue: value)
            ?? PracticeCategory.allCases.first { $0.rawValue.caseInsensitiveCompare(value) == .orderedSame }
            ?? .behavioral
    }
}

enum LocalInterviewReportCache {
    private static let key = "cv_local_interview_reports_v1"
    private static let limit = 12

    static func save(result: InterviewAnalysisResult, config: InterviewLiveConfig) {
        var reports = load()
        let snapshot = LocalInterviewReportSnapshot(
            jobTitle: config.job.title,
            company: config.job.company,
            category: config.category.rawValue,
            savedAt: Int(Date().timeIntervalSince1970 * 1000),
            analysis: result
        )
        reports.removeAll { $0.analysis.id == result.id }
        reports.insert(snapshot, at: 0)
        reports = Array(reports.prefix(limit))

        guard let data = try? JSONEncoder().encode(reports) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }

    static func load() -> [LocalInterviewReportSnapshot] {
        guard
            let data = UserDefaults.standard.data(forKey: key),
            let reports = try? JSONDecoder().decode([LocalInterviewReportSnapshot].self, from: data)
        else {
            return []
        }
        return reports
    }
}

actor RemoteInterviewReportStore {
    private let projectId: String
    private let session: URLSession

    init(projectId: String = "jastalk-firebase", session: URLSession = .shared) {
        self.projectId = projectId
        self.session = session
    }

    func loadReports(limit: Int = 12) async throws -> [InterviewReportSnapshot] {
        let auth = try await CVFirebaseAuth.shared.authToken()
        let encodedUID = auth.uid.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? auth.uid
        let urlString = "https://firestore.googleapis.com/v1/projects/\(projectId)/databases/(default)/documents/users/\(encodedUID)/practiceHistory?pageSize=\(max(limit * 2, limit))&orderBy=timestamp%20desc"
        guard let url = URL(string: urlString) else { return [] }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        request.timeoutInterval = 30
        request.setValue("Bearer \(auth.idToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await session.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw InterviewPracticeServiceError.functionError("CareerVivid could not load saved interview reports. HTTP \(http.statusCode).")
        }

        guard
            let root = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let documents = root["documents"] as? [[String: Any]]
        else {
            return []
        }

        let reports = documents.flatMap(Self.reports(from:))
            .sorted { $0.savedAt > $1.savedAt }
        return Array(reports.prefix(limit))
    }

    private static func reports(from document: [String: Any]) -> [InterviewReportSnapshot] {
        guard let fields = document["fields"] as? [String: Any] else { return [] }
        let practiceId = documentNameTail(document["name"] as? String)
        let job = FirestoreValue.mapField(fields, "job")
        let jobTitle = FirestoreValue.stringField(job, "title")
            ?? FirestoreValue.stringField(fields, "jobTitle")
            ?? "Interview Practice"
        let company = FirestoreValue.stringField(job, "company")
            ?? FirestoreValue.stringField(fields, "company")
            ?? "CareerVivid"
        let questions = FirestoreValue.stringArrayField(fields, "questions")
        let categoryText = FirestoreValue.stringField(fields, "lastInterviewCategory")
            ?? FirestoreValue.stringField(fields, "category")
            ?? "Behavioral"
        let category = parseCategory(categoryText)
        let documentTimestamp = FirestoreValue.millisecondsField(fields, "timestamp") ?? Int(Date().timeIntervalSince1970 * 1000)
        let documentTranscript = FirestoreValue.mapArrayField(fields, "transcript")
            .compactMap(Self.transcriptEntry(from:))

        return FirestoreValue.mapArrayField(fields, "interviewHistory").compactMap { analysisFields in
            guard let analysis = analysisResult(from: analysisFields, fallbackTranscript: documentTranscript, fallbackTimestamp: documentTimestamp) else {
                return nil
            }
            return InterviewReportSnapshot(
                id: "\(practiceId)-\(analysis.id)",
                practiceId: practiceId,
                jobTitle: jobTitle,
                company: company,
                category: category,
                questions: questions,
                savedAt: analysis.timestamp > 0 ? analysis.timestamp : documentTimestamp,
                analysis: analysis
            )
        }
    }

    private static func analysisResult(
        from fields: [String: Any],
        fallbackTranscript: [InterviewTranscriptEntry],
        fallbackTimestamp: Int
    ) -> InterviewAnalysisResult? {
        let id = FirestoreValue.stringField(fields, "id") ?? "analysis-\(fallbackTimestamp)"
        let transcript = FirestoreValue.mapArrayField(fields, "transcript")
            .compactMap(Self.transcriptEntry(from:))
        let strengths = FirestoreValue.stringField(fields, "strengths") ?? ""
        let areasForImprovement = FirestoreValue.stringField(fields, "areasForImprovement") ?? ""

        guard !strengths.isEmpty || !areasForImprovement.isEmpty else {
            return nil
        }

        return InterviewAnalysisResult(
            id: id,
            timestamp: FirestoreValue.millisecondsField(fields, "timestamp") ?? fallbackTimestamp,
            overallScore: FirestoreValue.intField(fields, "overallScore") ?? FirestoreValue.intField(fields, "score") ?? 0,
            communicationScore: FirestoreValue.intField(fields, "communicationScore") ?? 0,
            confidenceScore: FirestoreValue.intField(fields, "confidenceScore") ?? 0,
            relevanceScore: FirestoreValue.intField(fields, "relevanceScore") ?? 0,
            strengths: strengths,
            areasForImprovement: areasForImprovement,
            transcript: transcript.isEmpty ? fallbackTranscript : transcript,
            durationInSeconds: FirestoreValue.intField(fields, "durationInSeconds")
        )
    }

    private static func transcriptEntry(from fields: [String: Any]) -> InterviewTranscriptEntry? {
        guard let text = FirestoreValue.stringField(fields, "text"), !text.isEmpty else { return nil }
        let rawSpeaker = (FirestoreValue.stringField(fields, "speaker") ?? "ai").lowercased()
        let speaker: InterviewLiveSpeaker = ["user", "candidate"].contains(rawSpeaker) ? .user : .interviewer
        return InterviewTranscriptEntry(
            speaker: speaker,
            text: text,
            isFinal: FirestoreValue.boolField(fields, "isFinal") ?? true,
            timestamp: FirestoreValue.intField(fields, "timestamp") ?? Int(Date().timeIntervalSince1970 * 1000)
        )
    }

    private static func documentNameTail(_ name: String?) -> String {
        guard let name, let tail = name.split(separator: "/").last else {
            return "practice-\(Date().timeIntervalSince1970)"
        }
        return String(tail)
    }

    private static func parseCategory(_ value: String) -> PracticeCategory {
        PracticeCategory(rawValue: value)
            ?? PracticeCategory.allCases.first { $0.rawValue.caseInsensitiveCompare(value) == .orderedSame }
            ?? .behavioral
    }
}

private enum FirestoreValue {
    static func stringField(_ fields: [String: Any]?, _ key: String) -> String? {
        guard let value = fields?[key] as? [String: Any] else { return nil }
        return string(from: value)
    }

    static func intField(_ fields: [String: Any]?, _ key: String) -> Int? {
        guard let value = fields?[key] as? [String: Any] else { return nil }
        return int(from: value)
    }

    static func boolField(_ fields: [String: Any]?, _ key: String) -> Bool? {
        guard let value = fields?[key] as? [String: Any] else { return nil }
        return value["booleanValue"] as? Bool
    }

    static func millisecondsField(_ fields: [String: Any]?, _ key: String) -> Int? {
        guard let value = fields?[key] as? [String: Any] else { return nil }
        if let intValue = int(from: value) { return intValue }
        guard let timestamp = value["timestampValue"] as? String else { return nil }
        return milliseconds(fromISO8601: timestamp)
    }

    static func mapField(_ fields: [String: Any]?, _ key: String) -> [String: Any] {
        guard
            let value = fields?[key] as? [String: Any],
            let map = value["mapValue"] as? [String: Any],
            let mapFields = map["fields"] as? [String: Any]
        else {
            return [:]
        }
        return mapFields
    }

    static func mapArrayField(_ fields: [String: Any]?, _ key: String) -> [[String: Any]] {
        guard
            let value = fields?[key] as? [String: Any],
            let array = value["arrayValue"] as? [String: Any],
            let values = array["values"] as? [[String: Any]]
        else {
            return []
        }
        return values.compactMap { value in
            guard
                let map = value["mapValue"] as? [String: Any],
                let fields = map["fields"] as? [String: Any]
            else {
                return nil
            }
            return fields
        }
    }

    static func stringArrayField(_ fields: [String: Any]?, _ key: String) -> [String] {
        guard
            let value = fields?[key] as? [String: Any],
            let array = value["arrayValue"] as? [String: Any],
            let values = array["values"] as? [[String: Any]]
        else {
            return []
        }
        return values.compactMap(string)
    }

    private static func string(from value: [String: Any]) -> String? {
        if let string = value["stringValue"] as? String { return string }
        if let number = int(from: value) { return String(number) }
        return nil
    }

    private static func int(from value: [String: Any]) -> Int? {
        if let integer = value["integerValue"] as? String { return Int(integer) }
        if let integer = value["integerValue"] as? Int { return integer }
        if let double = value["doubleValue"] as? Double { return Int(double.rounded()) }
        return nil
    }

    private static func milliseconds(fromISO8601 timestamp: String) -> Int? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: timestamp) ?? ISO8601DateFormatter().date(from: timestamp)
        guard let date else { return nil }
        return Int(date.timeIntervalSince1970 * 1000)
    }
}
