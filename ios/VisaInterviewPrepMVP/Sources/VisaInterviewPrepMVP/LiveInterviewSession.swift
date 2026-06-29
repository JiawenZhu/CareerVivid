@preconcurrency import AVFoundation
import Foundation

enum LiveInterviewSessionState: Equatable {
    case idle
    case connecting
    case interviewerSpeaking
    case listening
    case ended
    case failed(String)
}

enum LiveInterviewSessionError: Error, LocalizedError {
    case microphonePermissionDenied
    case audioEngineFailed
    case invalidServerMessage
    case missingLiveToken

    var errorDescription: String? {
        switch self {
        case .microphonePermissionDenied:
            return "Microphone access is required for the live mock interview."
        case .audioEngineFailed:
            return "The microphone could not start. Please check Simulator or device microphone input."
        case .invalidServerMessage:
            return "The live interview returned an unexpected message."
        case .missingLiveToken:
            return "CareerVivid could not create a live interview token."
        }
    }
}

@MainActor
final class LiveInterviewSession: ObservableObject {
    @Published private(set) var messages: [InterviewLiveMessage] = []
    @Published private(set) var state: LiveInterviewSessionState = .idle
    @Published private(set) var questionIndex = 0
    @Published private(set) var liveTranscript = ""
    @Published private(set) var sessionId: String?

    private let tokenService = InterviewPracticeService()
    private let inputAudioEngine = AVAudioEngine()
    private let outputAudioEngine = AVAudioEngine()
    private let outputPlayer = AVAudioPlayerNode()
    private var config: InterviewLiveConfig?
    private var webSocketTask: URLSessionWebSocketTask?
    private var sessionTask: Task<Void, Never>?
    private var isOutputAudioPrepared = false
    private var pendingOutputBufferIds = Set<UUID>()
    private var shouldListenAfterPlayback = false
    private var shouldEndAfterPlayback = false
    private var currentInterviewerMessageId: UUID?
    private var currentUserMessageId: UUID?
    private var hasCompleted = false
    private var modelRequestedEnd = false
    private var startedAt: Date?
    private let interviewerPlaybackSafetyDelay: TimeInterval = 1.0

    var progressText: String {
        let total = max(config?.questions.count ?? 7, 1)
        return "\(min(questionIndex + 1, total)) / \(total)"
    }

    var elapsedSeconds: Int {
        guard let startedAt else { return 0 }
        return max(Int(Date().timeIntervalSince(startedAt)), 1)
    }

    var canFinishAnswer: Bool {
        state == .listening
    }

    var canRequestFeedback: Bool {
        state == .ended && transcriptEntries().contains { $0.speaker == .user }
    }

    func start(config: InterviewLiveConfig) {
        cancel(resetToIdle: true)
        self.config = config
        messages = []
        questionIndex = 0
        liveTranscript = ""
        sessionId = nil
        hasCompleted = false
        modelRequestedEnd = false
        shouldEndAfterPlayback = false
        startedAt = Date()
        state = .connecting

        sessionTask = Task { [weak self] in
            await self?.connectLiveSession()
        }
    }

    func cancel(resetToIdle: Bool = true) {
        sessionTask?.cancel()
        sessionTask = nil
        stopMicrophone(removeEmptyLiveUserMessage: true)
        stopOutputAudio()
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        if resetToIdle {
            state = .idle
            hasCompleted = false
        }
    }

    func finishAnswering() {
        guard state == .listening else { return }
        state = .interviewerSpeaking
        stopMicrophone()
        finishLiveMessage(for: .user)

        if hasEnoughInterviewContent {
            sendClientText("The candidate has provided enough information. Give a brief closing and append <END_INTERVIEW> to text output only.")
        } else {
            advanceQuestionProgress()
            sendJSON(["realtimeInput": ["audioStreamEnd": true]])
        }
    }

    func endInterview() {
        guard state != .ended else { return }
        hasCompleted = true
        modelRequestedEnd = false
        stopMicrophone(removeEmptyLiveUserMessage: true)
        stopOutputAudio()
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        state = .ended
    }

    private func completeInterviewFromModel() {
        guard state != .ended else { return }
        updateQuestionProgress(to: max(config?.questions.count ?? 7, 1))
        endInterview()
    }

    func transcriptEntries() -> [InterviewTranscriptEntry] {
        messages.compactMap { message in
            let cleanText = message.text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !cleanText.isEmpty, cleanText != "Listening..." else { return nil }
            return InterviewTranscriptEntry(
                speaker: message.speaker,
                text: cleanText,
                isFinal: !message.isLive,
                timestamp: message.timestamp
            )
        }
    }

    private func connectLiveSession() async {
        do {
            guard let config else { throw LiveInterviewSessionError.missingLiveToken }
            let token = try await tokenService.fetchLiveToken(config: config)
            sessionId = token.sessionId
            try await openWebSocket(with: token)
        } catch {
            guard !hasCompleted, !Task.isCancelled else { return }
            state = .failed(error.localizedDescription)
        }
    }

    private func openWebSocket(with token: InterviewLiveToken) async throws {
        guard !token.accessToken.isEmpty else { throw LiveInterviewSessionError.missingLiveToken }

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
        let activeConfig = config ?? InterviewLiveConfig(
            job: SampleCareerVividData.jobs[0],
            category: .behavioral,
            questions: []
        )
        
        let jobTitle = activeConfig.job.title
        let isVisa = jobTitle.contains("B1/B2") || jobTitle.contains("F-1") || jobTitle.contains("H-1B") || jobTitle.contains("J-1")
        
        let questionList = activeConfig.questions.enumerated()
            .map { "\($0.offset + 1). \($0.element)" }
            .joined(separator: "\n")
            
        if isVisa {
            let company = activeConfig.job.company
            let officerStyle = company.replacingOccurrences(of: "US Consulate (", with: "").replacingOccurrences(of: ")", with: "")
            let lang = activeConfig.language
            
            return """
            You are a U.S. Consular Officer conducting a visa interview for a \(jobTitle).
            Your interviewing style is \(officerStyle).
            \(officerStyle == "Strict" ? "Be very terse, direct, slightly skeptical, and look for inconsistencies. Ask probing follow-up questions." : officerStyle == "Friendly" ? "Be warm, encouraging, polite, and conversational." : "Be professional, neutral, formal, and efficient.")
            
            IMPORTANT RULES:
            1. You must conduct the entire interview in \(lang).
            2. When asking the primary questions listed below, you must translate them into \(lang). Speak only in \(lang). Do not speak English under any circumstances.
            3. Speak naturally like a real consular officer. Keep every spoken turn under two short sentences.
            4. Ask one short question at a time. Never bundle multiple questions together.
            5. Listen to the candidate's answer, acknowledge it briefly, then ask the next primary question (or one concise follow-up if needed).
            6. There are \(max(activeConfig.questions.count, 1)) primary questions. You must work through them in order.
            7. When you ask a new primary question, append the exact control token <QUESTION_PROGRESS:N> to the text output only (where N is the 1-based question number). Do not speak the token.
            8. Do not end the interview until all primary questions have been asked and answered.
            9. Once the final answer is complete, close the interview briefly (stating whether their visa is approved or needs administrative processing) and append the exact token <END_INTERVIEW> to the text output only. Do not speak the token.
            
            Primary questions to ask in order:
            \(questionList)
            """
        } else {
            let remediationBlock = activeConfig.remediationFocus.isEmpty
                ? ""
                : """

            Targeted weakness remediation mode:
            The candidate is specifically practicing these weakness areas:
            \(activeConfig.remediationFocus.map { "- \($0)" }.joined(separator: "\n"))
            Ask questions that help the candidate repair these gaps through concrete examples, better structure, clearer language, and role-specific proof. Keep the tone encouraging but direct.
            """

            return """
            You are Vivid, CareerVivid's live mock interviewer.
            This is a \(activeConfig.category.rawValue) interview for \(activeConfig.job.title) at \(activeConfig.job.company).
            Speak naturally like a human interviewer, not like a form.
            Ask one short question at a time. Never bundle multiple fields or multiple interview questions together.
            Keep every spoken turn under two short sentences.
            Start with a friendly opening and one role-relevant question. Do not explain the whole interview upfront.
            Listen to the candidate's answer, acknowledge it briefly, then ask a focused follow-up or the next question.
            If the candidate's transcript looks like your own previous question or only repeats a few words from your speech, treat it as audio echo and ignore it.
            If the answer is unclear, ask one gentle clarification instead of moving on.
            Make questions specific to the role, tools, trade-offs, impact, and collaboration expectations.
            There are \(max(activeConfig.questions.count, 1)) primary questions. You must work through the primary questions in order.
            When you ask a new primary question, append the exact control token <QUESTION_PROGRESS:N> to the text output only, where N is the 1-based primary question number. Do not speak the token.
            Ask at most one concise follow-up for each primary question. After the candidate answers that follow-up, move to the next primary question instead of staying on the same topic.
            Do not end the interview until every primary question has been asked and the candidate has answered the final primary question.
            When the final answer is complete, close the interview briefly and append the exact token <END_INTERVIEW> to your text output only. Do not speak the token.

            Suggested question direction:
            \(questionList)
            \(remediationBlock)
            """
        }
    }

    private func sendKickoff() {
        guard let activeConfig = config else { return }
        let jobTitle = activeConfig.job.title
        let isVisa = jobTitle.contains("B1/B2") || jobTitle.contains("F-1") || jobTitle.contains("H-1B") || jobTitle.contains("J-1")
        
        if isVisa {
            let company = activeConfig.job.company
            let officerStyle = company.replacingOccurrences(of: "US Consulate (", with: "").replacingOccurrences(of: ")", with: "")
            let lang = activeConfig.language
            sendClientText("Start a U.S. \(jobTitle) visa mock interview conducted in \(lang) with a \(officerStyle) officer. Introduce yourself and ask primary question 1 only, appending <QUESTION_PROGRESS:1> to text output only.")
        } else {
            let role = config?.job.title ?? "this role"
            let company = config?.job.company ?? "the company"
            let category = config?.category.rawValue ?? "Behavioral"
            if let focus = config?.remediationFocus, !focus.isEmpty {
                sendClientText("Start a short targeted \(category) skill booster for \(role) at \(company). Focus on \(focus.prefix(2).joined(separator: " and ")). Ask primary question 1 only and append <QUESTION_PROGRESS:1> to text output only.")
            } else {
                sendClientText("Start a short, natural \(category) mock interview for \(role) at \(company). Ask primary question 1 only and append <QUESTION_PROGRESS:1> to text output only.")
            }
        }
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
                    throw LiveInterviewSessionError.invalidServerMessage
                }
                try handleServerMessage(text)
            @unknown default:
                throw LiveInterviewSessionError.invalidServerMessage
            }
        }
    }

    private func handleServerMessage(_ text: String) throws {
        guard
            let data = text.data(using: .utf8),
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            throw LiveInterviewSessionError.invalidServerMessage
        }

        if json["setupComplete"] != nil {
            state = .interviewerSpeaking
            sendKickoff()
            return
        }

        guard let serverContent = json["serverContent"] as? [String: Any] else { return }

        processTranscription(serverContent["inputTranscription"] as? [String: Any], speaker: .user)
        processTranscription(serverContent["outputTranscription"] as? [String: Any], speaker: .interviewer)
        playModelAudio(from: serverContent)

        if (serverContent["interrupted"] as? Bool) == true {
            stopOutputAudio()
        }

        if (serverContent["turnComplete"] as? Bool) == true {
            finishLiveMessage(for: .interviewer)
            finishLiveMessage(for: .user)
            guard !hasCompleted else { return }

            if modelRequestedEnd && hasEnoughInterviewContent {
                if hasPendingOutputAudio {
                    shouldEndAfterPlayback = true
                } else {
                    completeInterviewFromModel()
                }
                return
            } else if modelRequestedEnd {
                modelRequestedEnd = false
            }

            if hasPendingOutputAudio {
                shouldListenAfterPlayback = true
            } else {
                enterListeningAfterInterviewerPause()
            }
        }
    }

    private func processTranscription(_ payload: [String: Any]?, speaker: InterviewLiveSpeaker) {
        guard let payload else { return }

        if speaker == .user, shouldSuppressUserTranscription() {
            return
        }

        if var text = payload["text"] as? String, !text.isEmpty {
            if speaker == .interviewer {
                text = processInterviewerControlTokens(in: text)
            }
            if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                appendLiveMessage(speaker: speaker, text: text)
            }
        }

        if (payload["finished"] as? Bool) == true {
            finishLiveMessage(for: speaker)
        }
    }

    private var hasEnoughInterviewContent: Bool {
        let userMessages = messages.filter { message in
            message.speaker == .user &&
            !message.isLive &&
            message.text.trimmingCharacters(in: .whitespacesAndNewlines).count >= 10
        }
        let totalQuestions = config?.questions.count ?? 7
        return questionIndex >= totalQuestions - 1 && userMessages.count >= min(totalQuestions, 5)
    }

    private func processInterviewerControlTokens(in rawText: String) -> String {
        var text = rawText

        if text.contains("<END_INTERVIEW>") {
            text = text.replacingOccurrences(of: "<END_INTERVIEW>", with: "")
            modelRequestedEnd = true
        }

        while let range = text.range(of: #"<QUESTION_PROGRESS:\s*\d+\s*>"#, options: .regularExpression) {
            let token = String(text[range])
            if let digitRange = token.range(of: #"\d+"#, options: .regularExpression),
               let questionNumber = Int(token[digitRange]) {
                updateQuestionProgress(to: questionNumber)
            }
            text.removeSubrange(range)
        }

        return text
    }

    private func updateQuestionProgress(to questionNumber: Int) {
        let total = max(config?.questions.count ?? 7, 1)
        let clamped = min(max(questionNumber, 1), total)
        questionIndex = max(questionIndex, clamped - 1)
    }

    private func shouldSuppressUserTranscription() -> Bool {
        hasPendingOutputAudio || (state == .interviewerSpeaking && currentUserMessageId == nil)
    }

    private func appendLiveMessage(speaker: InterviewLiveSpeaker, text: String) {
        let messageId: UUID
        switch speaker {
        case .interviewer:
            if let currentInterviewerMessageId {
                messageId = currentInterviewerMessageId
            } else {
                messageId = UUID()
                currentInterviewerMessageId = messageId
                messages.append(InterviewLiveMessage(id: messageId, speaker: speaker, text: "", isLive: true))
            }
        case .user:
            if let currentUserMessageId {
                messageId = currentUserMessageId
            } else {
                messageId = UUID()
                currentUserMessageId = messageId
                messages.append(InterviewLiveMessage(id: messageId, speaker: speaker, text: "", isLive: true))
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

    private func finishLiveMessage(for speaker: InterviewLiveSpeaker) {
        let messageId = speaker == .interviewer ? currentInterviewerMessageId : currentUserMessageId
        guard let messageId, let index = messages.firstIndex(where: { $0.id == messageId }) else { return }
        let cleanText = messages[index].text.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleanText.isEmpty || cleanText == "Listening..." {
            messages.remove(at: index)
        } else {
            messages[index].text = cleanText
            messages[index].isLive = false
        }

        if speaker == .interviewer {
            currentInterviewerMessageId = nil
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
        state = .interviewerSpeaking
        stopMicrophone(removeEmptyLiveUserMessage: true)
        try prepareOutputAudio()

        guard let format = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 24_000, channels: 1, interleaved: false) else {
            throw LiveInterviewSessionError.audioEngineFailed
        }

        let frameCount = AVAudioFrameCount(data.count / MemoryLayout<Int16>.size)
        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            throw LiveInterviewSessionError.audioEngineFailed
        }
        buffer.frameLength = frameCount
        data.withUnsafeBytes { rawBuffer in
            guard let source = rawBuffer.baseAddress, let destination = buffer.int16ChannelData?[0] else { return }
            destination.update(from: source.assumingMemoryBound(to: Int16.self), count: Int(frameCount))
        }

        let bufferId = UUID()
        pendingOutputBufferIds.insert(bufferId)
        let safetyDelay = interviewerPlaybackSafetyDelay
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
        if !hasPendingOutputAudio, shouldEndAfterPlayback {
            shouldEndAfterPlayback = false
            completeInterviewFromModel()
        } else if !hasPendingOutputAudio, shouldListenAfterPlayback, !hasCompleted {
            shouldListenAfterPlayback = false
            enterListeningAfterInterviewerPause()
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
        shouldListenAfterPlayback = false
    }

    private func advanceQuestionProgress() {
        let total = config?.questions.count ?? 7
        questionIndex = min(questionIndex + 1, max(total - 1, 0))
    }

    private func enterListeningAfterInterviewerPause() {
        Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(0.65 * 1_000_000_000))
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
        guard micGranted else { throw LiveInterviewSessionError.microphonePermissionDenied }

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
            throw LiveInterviewSessionError.audioEngineFailed
        }
    }

    private func beginUserLiveMessage() {
        guard currentUserMessageId == nil else { return }
        let messageId = UUID()
        currentUserMessageId = messageId
        messages.append(InterviewLiveMessage(id: messageId, speaker: .user, text: "Listening...", isLive: true))
    }

    private func stopMicrophone(removeEmptyLiveUserMessage: Bool = false) {
        if inputAudioEngine.isRunning {
            inputAudioEngine.stop()
            inputAudioEngine.inputNode.removeTap(onBus: 0)
        }
        if removeEmptyLiveUserMessage {
            settleUserLiveMessageBeforeInterviewerSpeaks()
        }
    }

    private func settleUserLiveMessageBeforeInterviewerSpeaks() {
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
