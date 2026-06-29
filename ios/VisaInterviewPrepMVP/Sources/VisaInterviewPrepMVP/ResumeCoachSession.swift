@preconcurrency import AVFoundation
import Foundation

enum ResumeCoachSpeaker: String, Equatable, Sendable {
    case coach = "Coach"
    case user = "You"
}

struct ResumeCoachMessage: Identifiable, Equatable, Sendable {
    let id: UUID
    var speaker: ResumeCoachSpeaker
    var text: String
    var isLive: Bool

    init(id: UUID = UUID(), speaker: ResumeCoachSpeaker, text: String, isLive: Bool = false) {
        self.id = id
        self.speaker = speaker
        self.text = text
        self.isLive = isLive
    }
}

enum ResumeCoachSessionState: Equatable {
    case idle
    case connecting
    case speaking
    case waitingForAnswer
    case listening
    case readyToGenerate
    case failed(String)
}

enum ResumeCoachSessionError: Error, LocalizedError {
    case microphonePermissionDenied
    case audioEngineFailed
    case invalidServerMessage
    case missingLiveToken

    var errorDescription: String? {
        switch self {
        case .microphonePermissionDenied:
            return "Microphone access is required for the live resume coach."
        case .audioEngineFailed:
            return "The microphone could not start. Please check Simulator or device microphone input."
        case .invalidServerMessage:
            return "The resume coach live session returned an unexpected message."
        case .missingLiveToken:
            return "CareerVivid could not create a live resume coach token."
        }
    }
}

private struct ResumeCoachLiveToken: Decodable {
    let accessToken: String
    let project: String
    let location: String
    let model: String
    let sessionId: String
}

@MainActor
final class ResumeCoachSession: ObservableObject {
    @Published private(set) var messages: [ResumeCoachMessage] = []
    @Published private(set) var state: ResumeCoachSessionState = .idle
    @Published private(set) var questionIndex = 0
    @Published private(set) var liveTranscript = ""

    let questions = [
        "Understand the target role and the story the resume should tell.",
        "Learn the user's recent work history through a relaxed conversation.",
        "Explore day-to-day ownership, tools, systems, users, and responsibilities.",
        "Draw out achievements, metrics, business impact, and proof points.",
        "Capture projects, portfolio work, open-source work, demos, and technical stack.",
        "Collect education, certifications, languages, awards, and domain knowledge.",
        "Confirm contact details and what the final resume should emphasize."
    ]

    private let tokenService = ResumeCoachLiveTokenService()
    private let inputAudioEngine = AVAudioEngine()
    private let outputAudioEngine = AVAudioEngine()
    private let outputPlayer = AVAudioPlayerNode()
    private var webSocketTask: URLSessionWebSocketTask?
    private var sessionTask: Task<Void, Never>?
    private var isOutputAudioPrepared = false
    private var pendingOutputBufferIds = Set<UUID>()
    private var estimatedOutputTailSeconds: Double = 0
    private var shouldListenAfterPlayback = false
    private var currentCoachMessageId: UUID?
    private var currentUserMessageId: UUID?
    private var hasCompleted = false
    private var modelRequestedCompletion = false
    private let coachPlaybackSafetyDelay: TimeInterval = 1.1

    var progressText: String {
        "\(min(questionIndex + 1, questions.count)) / \(questions.count)"
    }

    var canStartAnswering: Bool {
        state == .waitingForAnswer || state == .idle
    }

    var canGenerate: Bool {
        state != .connecting &&
        state != .speaking &&
        state != .listening &&
        messages.contains { $0.speaker == .user && !$0.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }

    func start() {
        cancel()
        messages = []
        questionIndex = 0
        liveTranscript = ""
        hasCompleted = false
        modelRequestedCompletion = false
        state = .connecting

        sessionTask = Task { [weak self] in
            await self?.connectLiveSession()
        }
    }

    func cancel() {
        sessionTask?.cancel()
        sessionTask = nil
        stopMicrophone(removeEmptyLiveUserMessage: true)
        stopOutputAudio()
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        if state != .readyToGenerate {
            state = .idle
        }
    }

    func startAnswering() {
        if case .failed = state {
            start()
            return
        }
        Task {
            do {
                try await startMicrophone()
            } catch {
                state = .failed(error.localizedDescription)
            }
        }
    }

    func finishAnswering() {
        guard state == .listening else { return }
        state = .speaking
        stopMicrophone()

        if questionIndex >= questions.count - 1 {
            finishLiveMessage(for: .user)
            markReadyToGenerate()
            return
        }

        advanceQuestionProgress()
        sendJSON(["realtimeInput": ["audioStreamEnd": true]])
    }

    func skipQuestion() {
        guard state == .waitingForAnswer || state == .listening || state == .idle else { return }
        state = .speaking
        stopMicrophone(removeEmptyLiveUserMessage: true)
        advanceQuestionProgress()
        sendClientText("Skip this question and ask the next resume-building question.")
    }

    func transcriptForGeneration() -> String {
        messages
            .filter { !$0.isLive }
            .map { "\($0.speaker.rawValue): \($0.text)" }
            .joined(separator: "\n")
    }

    private func connectLiveSession() async {
        do {
            let token = try await tokenService.fetchToken()
            try await openWebSocket(with: token)
        } catch {
            guard !hasCompleted, !Task.isCancelled else { return }
            state = .failed(error.localizedDescription)
        }
    }

    private func openWebSocket(with token: ResumeCoachLiveToken) async throws {
        guard !token.accessToken.isEmpty else { throw ResumeCoachSessionError.missingLiveToken }

        let encodedToken = token.accessToken.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? token.accessToken
        let url = URL(string: "wss://\(token.location)-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=\(encodedToken)")!
        let task = URLSession.shared.webSocketTask(with: url)
        webSocketTask = task
        task.resume()

        let setup: [String: Any] = [
            "setup": [
                "model": token.model,
                "generationConfig": [
                    "responseModalities": ["AUDIO"]
                ],
                "inputAudioTranscription": [:],
                "outputAudioTranscription": [:],
                "systemInstruction": [
                    "parts": [
                        ["text": systemInstruction]
                    ]
                ]
            ]
        ]
        sendJSON(setup)
        try await receiveMessages()
    }

    private var systemInstruction: String {
        """
        You are CareerVivid's live resume coach. You are not a generic assistant.
        Speak like a calm human career coach in a relaxed conversation.
        Start with one open-ended prompt about the role or resume story. Do not start by asking for all contact details.
        Ask exactly one question per turn. Never bundle name, role, location, email, phone, LinkedIn, and portfolio into the same question.
        Keep each spoken prompt under two short sentences, and use brief acknowledgements like "Got it" or "That helps."
        Give the user time to finish. If an answer is short or unclear, ask a gentle follow-up instead of moving on quickly.
        If the transcript looks like your own previous question or only repeats a few words from your speech, treat it as audio echo and ignore it.
        The user may answer briefly, out of order, or with incomplete details; collect missing details naturally later.
        Preserve technical terms, company names, product names, tools, and metrics exactly when possible.
        After enough information is collected, say that you have enough to create an editable resume draft and append the exact text token <RESUME_READY> to your text output only. Do not speak the token.

        Information to collect:
        \(questions.enumerated().map { "\($0.offset + 1). \($0.element)" }.joined(separator: "\n"))
        """
    }

    private func sendKickoff() {
        sendClientText("Start the resume coach session now. Begin with one natural open-ended question about the role or resume story, not a list of fields.")
    }

    private func sendClientText(_ text: String) {
        sendJSON([
            "clientContent": [
                "turns": [
                    [
                        "role": "user",
                        "parts": [
                            ["text": text]
                        ]
                    ]
                ],
                "turnComplete": true
            ]
        ])
    }

    private func receiveMessages() async throws {
        while !Task.isCancelled, let task = webSocketTask {
            let message = try await task.receive()
            switch message {
            case .string(let text):
                try handleServerMessage(text)
            case .data(let data):
                guard let text = String(data: data, encoding: .utf8) else {
                    throw ResumeCoachSessionError.invalidServerMessage
                }
                try handleServerMessage(text)
            @unknown default:
                throw ResumeCoachSessionError.invalidServerMessage
            }
        }
    }

    private func handleServerMessage(_ text: String) throws {
        guard
            let data = text.data(using: .utf8),
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            throw ResumeCoachSessionError.invalidServerMessage
        }

        if json["setupComplete"] != nil {
            state = .speaking
            sendKickoff()
            return
        }

        guard let serverContent = json["serverContent"] as? [String: Any] else { return }

        processTranscription(serverContent["inputTranscription"] as? [String: Any], speaker: .user)
        processTranscription(serverContent["outputTranscription"] as? [String: Any], speaker: .coach)
        playModelAudio(from: serverContent)

        if (serverContent["interrupted"] as? Bool) == true {
            stopOutputAudio()
        }

        if (serverContent["turnComplete"] as? Bool) == true {
            finishLiveMessage(for: .coach)
            finishLiveMessage(for: .user)
            guard !hasCompleted else { return }
            if modelRequestedCompletion, hasEnoughResumeContent {
                markReadyToGenerate()
                return
            } else if modelRequestedCompletion {
                modelRequestedCompletion = false
            }
            if hasPendingOutputAudio {
                shouldListenAfterPlayback = true
            } else {
                enterListeningAfterCoachPause()
            }
        }
    }

    private func processTranscription(_ payload: [String: Any]?, speaker: ResumeCoachSpeaker) {
        guard let payload else { return }

        if speaker == .user, shouldSuppressUserTranscription() {
            return
        }

        if var text = payload["text"] as? String, !text.isEmpty {
            if speaker == .coach, text.contains("<RESUME_READY>") {
                text = text.replacingOccurrences(of: "<RESUME_READY>", with: "")
                modelRequestedCompletion = true
            }
            appendLiveMessage(speaker: speaker, text: text)
        }

        if (payload["finished"] as? Bool) == true {
            if speaker == .coach {
                finishLiveMessage(for: speaker)
            }
        }

        if modelRequestedCompletion, hasEnoughResumeContent {
            markReadyToGenerate()
        }
    }

    private var hasEnoughResumeContent: Bool {
        let userMessages = messages.filter { message in
            message.speaker == .user &&
            !message.isLive &&
            message.text.trimmingCharacters(in: .whitespacesAndNewlines).count >= 12
        }
        let transcriptLength = userMessages
            .map(\.text)
            .joined(separator: " ")
            .count
        return userMessages.count >= 3 || transcriptLength >= 220 || questionIndex >= questions.count - 1
    }

    private func shouldSuppressUserTranscription() -> Bool {
        hasPendingOutputAudio || (state == .speaking && currentUserMessageId == nil)
    }

    private func appendLiveMessage(speaker: ResumeCoachSpeaker, text: String) {
        let messageId: UUID
        switch speaker {
        case .coach:
            if let currentCoachMessageId {
                messageId = currentCoachMessageId
            } else {
                messageId = UUID()
                currentCoachMessageId = messageId
                messages.append(ResumeCoachMessage(id: messageId, speaker: speaker, text: "", isLive: true))
            }
        case .user:
            if let currentUserMessageId {
                messageId = currentUserMessageId
            } else {
                messageId = UUID()
                currentUserMessageId = messageId
                messages.append(ResumeCoachMessage(id: messageId, speaker: speaker, text: "", isLive: true))
            }
        }

        guard let index = messages.firstIndex(where: { $0.id == messageId }) else { return }
        if messages[index].text == "Listening..." {
            messages[index].text = text.trimmingCharacters(in: .whitespacesAndNewlines)
        } else if speaker == .user {
            messages[index].text = mergeUserTranscript(current: messages[index].text, fragment: text)
        } else {
            messages[index].text += text
        }
        if speaker == .user {
            liveTranscript = messages[index].text
        }
    }

    private func mergeUserTranscript(current: String, fragment: String) -> String {
        let cleanFragment = fragment.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanFragment.isEmpty else { return current }
        let cleanCurrent = current.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanCurrent.isEmpty else { return cleanFragment }

        let needsSpace = !cleanCurrent.hasSuffix(" ") && !cleanFragment.hasPrefix(" ")
        return cleanCurrent + (needsSpace ? " " : "") + cleanFragment
    }

    private func finishLiveMessage(for speaker: ResumeCoachSpeaker) {
        let messageId = speaker == .coach ? currentCoachMessageId : currentUserMessageId
        guard let messageId, let index = messages.firstIndex(where: { $0.id == messageId }) else { return }
        let cleanText = messages[index].text.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleanText.isEmpty {
            messages.remove(at: index)
        } else {
            messages[index].text = cleanText
            messages[index].isLive = false
        }

        if speaker == .coach {
            currentCoachMessageId = nil
        } else {
            currentUserMessageId = nil
            liveTranscript = ""
        }
    }

    private func playModelAudio(from serverContent: [String: Any]) {
        guard
            let modelTurn = serverContent["modelTurn"] as? [String: Any],
            let parts = modelTurn["parts"] as? [[String: Any]]
        else { return }

        for part in parts {
            guard
                let inlineData = part["inlineData"] as? [String: Any],
                let base64 = inlineData["data"] as? String,
                let audioData = Data(base64Encoded: base64)
            else { continue }

            do {
                try scheduleOutputAudio(audioData)
            } catch {
                state = .failed(error.localizedDescription)
            }
        }
    }

    private func scheduleOutputAudio(_ data: Data) throws {
        state = .speaking
        stopMicrophone(removeEmptyLiveUserMessage: true)
        try prepareOutputAudio()

        guard let format = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 24_000, channels: 1, interleaved: false) else {
            throw ResumeCoachSessionError.audioEngineFailed
        }

        let frameCount = AVAudioFrameCount(data.count / MemoryLayout<Int16>.size)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            throw ResumeCoachSessionError.audioEngineFailed
        }
        buffer.frameLength = frameCount
        data.withUnsafeBytes { rawBuffer in
            guard let source = rawBuffer.baseAddress, let destination = buffer.int16ChannelData?[0] else { return }
            destination.update(from: source.assumingMemoryBound(to: Int16.self), count: Int(frameCount))
        }

        let bufferId = UUID()
        pendingOutputBufferIds.insert(bufferId)
        let safetyDelay = coachPlaybackSafetyDelay
        outputPlayer.scheduleBuffer(buffer, completionCallbackType: .dataPlayedBack) { [weak self] _ in
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: UInt64(safetyDelay * 1_000_000_000))
                self?.completeOutputBuffer(bufferId)
            }
        }
    }

    private var hasPendingOutputAudio: Bool {
        !pendingOutputBufferIds.isEmpty
    }

    private func completeOutputBuffer(_ bufferId: UUID) {
        guard pendingOutputBufferIds.remove(bufferId) != nil else { return }
        if !hasPendingOutputAudio, shouldListenAfterPlayback, !hasCompleted {
            shouldListenAfterPlayback = false
            estimatedOutputTailSeconds = 0
            enterListeningAfterCoachPause()
        } else if !hasPendingOutputAudio {
            estimatedOutputTailSeconds = 0
        }
    }

    private func prepareOutputAudio() throws {
        if !isOutputAudioPrepared {
            outputAudioEngine.attach(outputPlayer)
            let format = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 24_000, channels: 1, interleaved: false)
            outputAudioEngine.connect(outputPlayer, to: outputAudioEngine.mainMixerNode, format: format)
            isOutputAudioPrepared = true
        }
        if !outputAudioEngine.isRunning {
            try outputAudioEngine.start()
        }
        if !outputPlayer.isPlaying {
            outputPlayer.play()
        }
    }

    private func stopOutputAudio() {
        outputPlayer.stop()
        if outputAudioEngine.isRunning {
            outputAudioEngine.stop()
        }
        pendingOutputBufferIds.removeAll()
        estimatedOutputTailSeconds = 0
        shouldListenAfterPlayback = false
    }

    private func advanceQuestionProgress() {
        questionIndex = min(questionIndex + 1, max(questions.count - 1, 0))
    }

    private func markReadyToGenerate() {
        hasCompleted = true
        modelRequestedCompletion = false
        state = .readyToGenerate
        stopMicrophone(removeEmptyLiveUserMessage: true)
        stopOutputAudio()
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
    }

    private func enterListeningAfterCoachPause() {
        Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(0.7 * 1_000_000_000))
            await MainActor.run {
                guard let self, !self.hasPendingOutputAudio, !self.hasCompleted else { return }
                self.enterListening()
            }
        }
    }

    private func enterListening() {
        Task {
            do {
                try await startMicrophone()
            } catch {
                state = .failed(error.localizedDescription)
            }
        }
    }

    private func startMicrophone() async throws {
        guard !hasCompleted, !hasPendingOutputAudio else { return }
        let micGranted = await requestMicrophonePermission()
        guard micGranted else { throw ResumeCoachSessionError.microphonePermissionDenied }

        #if os(iOS)
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .duckOthers])
        try session.setPreferredSampleRate(16_000)
        try session.setActive(true, options: .notifyOthersOnDeactivation)
        #endif

        if inputAudioEngine.isRunning {
            state = .listening
            beginUserLiveMessage()
            return
        }

        let inputNode = inputAudioEngine.inputNode
        inputNode.removeTap(onBus: 0)
        let inputFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { [weak self] buffer, _ in
            guard let data = Self.pcm16Data(from: buffer) else { return }
            Task { @MainActor in
                self?.sendAudioData(data)
            }
        }

        inputAudioEngine.prepare()
        do {
            try inputAudioEngine.start()
            state = .listening
            beginUserLiveMessage()
        } catch {
            stopMicrophone(removeEmptyLiveUserMessage: true)
            throw ResumeCoachSessionError.audioEngineFailed
        }
    }

    private func beginUserLiveMessage() {
        guard currentUserMessageId == nil else { return }
        let messageId = UUID()
        currentUserMessageId = messageId
        messages.append(ResumeCoachMessage(id: messageId, speaker: .user, text: "Listening...", isLive: true))
    }

    private func stopMicrophone(removeEmptyLiveUserMessage: Bool = false) {
        if inputAudioEngine.isRunning {
            inputAudioEngine.stop()
            inputAudioEngine.inputNode.removeTap(onBus: 0)
        }
        if removeEmptyLiveUserMessage {
            settleUserLiveMessageBeforeCoachSpeaks()
        }
    }

    private func settleUserLiveMessageBeforeCoachSpeaks() {
        guard
            let currentUserMessageId,
            let index = messages.firstIndex(where: { $0.id == currentUserMessageId })
        else { return }

        let cleanText = messages[index].text.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleanText.isEmpty || cleanText == "Listening..." {
            messages.remove(at: index)
        } else {
            messages[index].text = cleanText
            messages[index].isLive = false
        }
        self.currentUserMessageId = nil
        liveTranscript = ""
    }

    private func sendAudioData(_ data: Data) {
        guard state == .listening, !data.isEmpty, !hasPendingOutputAudio else { return }
        sendJSON([
            "realtimeInput": [
                "audio": [
                    "mimeType": "audio/pcm;rate=16000",
                    "data": data.base64EncodedString()
                ]
            ]
        ])
    }

    private func sendJSON(_ object: [String: Any]) {
        guard let webSocketTask else { return }
        do {
            let data = try JSONSerialization.data(withJSONObject: object)
            guard let text = String(data: data, encoding: .utf8) else { return }
            webSocketTask.send(.string(text)) { [weak self] error in
                guard let error else { return }
                Task { @MainActor in
                    self?.state = .failed(error.localizedDescription)
                }
            }
        } catch {
            state = .failed(error.localizedDescription)
        }
    }

    private func requestMicrophonePermission() async -> Bool {
        await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }

    nonisolated private static func pcm16Data(from buffer: AVAudioPCMBuffer) -> Data? {
        guard let targetFormat = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 16_000, channels: 1, interleaved: false) else {
            return nil
        }

        let inputFormat = buffer.format
        let ratio = targetFormat.sampleRate / inputFormat.sampleRate
        let frameCapacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 1
        guard
            let converter = AVAudioConverter(from: inputFormat, to: targetFormat),
            let outputBuffer = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: frameCapacity)
        else {
            return nil
        }

        var didProvideInput = false
        var conversionError: NSError?
        converter.convert(to: outputBuffer, error: &conversionError) { _, status in
            if didProvideInput {
                status.pointee = .noDataNow
                return nil
            }
            didProvideInput = true
            status.pointee = .haveData
            return buffer
        }

        guard conversionError == nil, let samples = outputBuffer.int16ChannelData?[0] else {
            return nil
        }

        return Data(bytes: samples, count: Int(outputBuffer.frameLength) * MemoryLayout<Int16>.size)
    }
}

private actor ResumeCoachLiveTokenService {
    private let decoder = JSONDecoder()

    func fetchToken() async throws -> ResumeCoachLiveToken {
        let auth = try await CVFirebaseAuth.shared.authToken()
        let endpoint = URL(string: "https://us-west1-jastalk-firebase.cloudfunctions.net/resumeCoachLiveToken")!
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(auth.idToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "role": "resume builder",
            "source": "ios"
        ])

        let (data, response) = try await URLSession.shared.data(for: request)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String
            throw ResumeSyncError.functionError(message ?? "CareerVivid API returned HTTP \(http.statusCode).")
        }

        return try decoder.decode(ResumeCoachLiveToken.self, from: data)
    }
}
