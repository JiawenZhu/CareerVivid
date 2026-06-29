import SwiftUI

private enum PracticeScreen {
    case setup
    case live
    case report
}

struct MockInterviewView: View {
    @AppStorage("selectedVisaType")  private var selectedVisaTypeRaw: String = VisaType.b1b2.rawValue
    @AppStorage("officerMode")       private var officerModeRaw: String = OfficerMode.professional.rawValue
    @AppStorage("preferredLanguage") private var langRaw: String = AppLanguage.english.rawValue

    @StateObject private var liveSession = LiveInterviewSession()
    @State private var screen: PracticeScreen = .setup
    @State private var questionCount: Int = 5
    @State private var activeConfig: InterviewLiveConfig?
    @State private var analysis: InterviewAnalysisResult?
    @State private var isAnalyzing = false
    @State private var errorMessage: String?

    private var visaType: VisaType { VisaType(rawValue: selectedVisaTypeRaw) ?? .b1b2 }
    private var officerMode: OfficerMode { OfficerMode(rawValue: officerModeRaw) ?? .professional }
    private var language: AppLanguage { AppLanguage(rawValue: langRaw) ?? .english }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.cvAppBackground.ignoresSafeArea()
                
                switch screen {
                case .setup:
                    SetupView(
                        visaType: visaType,
                        language: language,
                        officerMode: $officerModeRaw,
                        questionCount: $questionCount,
                        onStart: startLiveInterview
                    )
                case .live:
                    LivePracticeScreen(
                        session: liveSession,
                        config: activeConfig ?? currentConfig,
                        isAnalyzing: isAnalyzing,
                        errorMessage: errorMessage,
                        onDoneAnswering: finishAnswering,
                        onEndInterview: endInterview,
                        onFeedback: requestFeedback,
                        onRetry: retryInterview,
                        onClose: closeLiveInterview
                    )
                case .report:
                    PracticeReportScreen(
                        config: activeConfig ?? currentConfig,
                        analysis: analysis,
                        elapsedSeconds: liveSession.elapsedSeconds,
                        onPracticeAgain: practiceAgain,
                        onClose: closeLiveInterview
                    )
                }
            }
            .navigationTitle(VisaTranslations.uiString("Mock Interview"))
            .cvInlineNavigationTitle()
        }
    }
    
    private var currentConfig: InterviewLiveConfig {
        let pool = VisaSampleData.questions.filter { $0.visaTypes.contains(visaType) }.shuffled()
        let fallbackPool = pool.isEmpty ? VisaSampleData.questions.shuffled() : pool
        let questionsList = Array(fallbackPool.prefix(questionCount))
        
        return InterviewLiveConfig(
            job: JobLead(
                title: visaType.rawValue,
                company: "US Consulate (\(officerMode.rawValue))",
                matchScore: 99,
                stage: .interview,
                nextStep: "Complete interview"
            ),
            category: .behavioral,
            questions: questionsList.map { $0.localizedText(language: language) },
            language: language.rawValue
        )
    }
}

// MARK: - Actions

private extension MockInterviewView {
    func startLiveInterview() {
        let config = currentConfig
        activeConfig = config
        analysis = nil
        errorMessage = nil
        isAnalyzing = false
        screen = .live
        liveSession.start(config: config)
    }

    func retryInterview() {
        let config = activeConfig ?? currentConfig
        activeConfig = config
        analysis = nil
        errorMessage = nil
        isAnalyzing = false
        screen = .live
        liveSession.start(config: config)
    }

    func finishAnswering() {
        liveSession.finishAnswering()
    }

    func endInterview() {
        liveSession.endInterview()
    }

    func closeLiveInterview() {
        liveSession.cancel(resetToIdle: true)
        screen = .setup
        isAnalyzing = false
    }

    func practiceAgain() {
        let config = activeConfig ?? currentConfig
        activeConfig = config
        analysis = nil
        errorMessage = nil
        isAnalyzing = false
        screen = .live
        liveSession.start(config: config)
    }

    func requestFeedback() {
        guard !isAnalyzing else { return }
        let transcript = liveSession.transcriptEntries()
        guard transcript.contains(where: { $0.speaker == .user }) else {
            errorMessage = VisaTranslations.uiString("Answer at least one question before generating feedback.")
            return
        }

        let config = activeConfig ?? currentConfig
        isAnalyzing = true
        errorMessage = nil

        Task {
            do {
                let result = try await InterviewPracticeService().analyze(
                    config: config,
                    sessionId: liveSession.sessionId,
                    transcript: transcript,
                    durationInSeconds: liveSession.elapsedSeconds
                )
                
                let entry = ReadinessEntry(
                    score: Double(result.overallScore) / 100.0,
                    visaType: config.job.title,
                    docsChecked: 0,
                    totalDocs: 0,
                    questionsReviewed: transcript.filter { $0.speaker == .interviewer }.count
                )
                ReadinessHistory.record(entry)
                
                await MainActor.run {
                    self.analysis = result
                    self.isAnalyzing = false
                    self.screen = .report
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isAnalyzing = false
                }
            }
        }
    }
}

// MARK: - Setup Screen

private struct SetupView: View {
    let visaType: VisaType
    let language: AppLanguage
    @Binding var officerMode: String
    @Binding var questionCount: Int
    let onStart: () -> Void

    private let counts = [5, 10, 15]

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    InterviewSetupHero(visaType: visaType, language: language)

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(
                            title: VisaTranslations.uiString("Officer Style", language: language),
                            subtitle: VisaTranslations.uiString("Choose how direct the consular officer should feel.", language: language)
                        )

                        ForEach(OfficerMode.allCases) { mode in
                            OfficerModeRow(mode: mode, isSelected: officerMode == mode.rawValue, language: language) {
                                playImpactHaptic(.light)
                                withAnimation(.spring(response: 0.32, dampingFraction: 0.82)) {
                                    officerMode = mode.rawValue
                                }
                            }
                        }
                    }
                    .cvCard(padding: 18, radius: 26, raised: true)

                    VStack(alignment: .leading, spacing: 14) {
                        SectionHeader(
                            title: VisaTranslations.uiString("Number of Questions", language: language),
                            subtitle: String(format: VisaTranslations.uiString("About %@ min, one question at a time.", language: language), "\(estimatedMinutes)")
                        )

                        HStack(spacing: 10) {
                            ForEach(counts, id: \.self) { n in
                                QuestionCountButton(value: n, isSelected: questionCount == n) {
                                    playImpactHaptic(.light)
                                    withAnimation(.spring(response: 0.28, dampingFraction: 0.8)) {
                                        questionCount = n
                                    }
                                }
                            }
                        }

                        InterviewPlanPreview(
                            visaType: visaType,
                            language: language,
                            questionCount: questionCount,
                            estimatedMinutes: estimatedMinutes,
                            questions: previewQuestions
                        )
                    }
                    .cvCard(padding: 18, radius: 26, raised: true)
                }
                .padding(.horizontal, 20)
                .padding(.top, 22)
                .padding(.bottom, CVLayout.floatingTabContentPadding + 96)
            }

            VStack(spacing: 0) {
                Button {
                    playImpactHaptic(.medium)
                    onStart()
                } label: {
                    Label(VisaTranslations.uiString("Start live interview", language: language), systemImage: "mic.fill")
                        .font(.headline.weight(.black))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                }
                .cvPrimaryActionButton()
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, max(CVLayout.floatingTabContentPadding - 24, 72))
            }
            .background(
                LinearGradient(
                    colors: [
                        Color.cvAppBackground.opacity(0.82),
                        Color.cvAppBackground.opacity(0.96),
                        Color.cvAppBackground.opacity(0.92),
                        Color.cvAppBackground
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea(edges: .bottom)
            )
        }
    }

    private var estimatedMinutes: Int {
        max(4, Int((Double(questionCount) * 1.8).rounded()))
    }

    private var previewQuestions: [VisaQuestion] {
        let pool = VisaSampleData.questions.filter { $0.visaTypes.contains(visaType) }
        return Array((pool.isEmpty ? VisaSampleData.questions : pool).prefix(3))
    }
}

private struct InterviewSetupHero: View {
    let visaType: VisaType
    let language: AppLanguage

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(LinearGradient.cvBrandGradient)
                    Image(systemName: "mic.fill")
                        .font(.title3.weight(.black))
                        .foregroundStyle(.white)
                }
                .frame(width: 58, height: 58)
                .shadow(color: Color.cvBrand.opacity(0.24), radius: 16, x: 0, y: 8)

                VStack(alignment: .leading, spacing: 6) {
                    Text(VisaTranslations.uiString("Live visa interview coach", language: language))
                        .font(.caption.weight(.black))
                        .foregroundStyle(Color.cvBrand)
                    Text(VisaTranslations.uiString("AI Mock Interview", language: language))
                        .font(.title2.weight(.black))
                        .foregroundStyle(Color.cvInk)
                    Text(String(format: VisaTranslations.uiString("Practice for your %@ interview", language: language), visaType.rawValue))
                        .font(.subheadline)
                        .foregroundStyle(Color.cvInkSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }

            HStack(spacing: 10) {
                SetupBadge(icon: "text.bubble.fill", text: language.rawValue)
                SetupBadge(icon: "doc.text.magnifyingglass", text: VisaTranslations.uiString("Feedback report", language: language))
            }
        }
        .cvCard(padding: 18, radius: 28, raised: true)
    }
}

private struct SetupBadge: View {
    let icon: String
    let text: String

    var body: some View {
        Label(text, systemImage: icon)
            .font(.caption.weight(.bold))
            .foregroundStyle(Color.cvBrand)
            .lineLimit(1)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(Color.cvBrandSoft)
            .clipShape(Capsule())
    }
}

private struct SectionHeader: View {
    let title: String
    let subtitle: String

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline.weight(.black))
                    .foregroundStyle(Color.cvInk)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(Color.cvInkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
    }
}

private struct OfficerModeRow: View {
    let mode: OfficerMode
    let isSelected: Bool
    let language: AppLanguage
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                Image(systemName: mode.icon)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(isSelected ? .white : Color.cvBrand)
                    .frame(width: 46, height: 46)
                    .background(isSelected ? Color.cvBrand : Color.cvBrandSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                VStack(alignment: .leading, spacing: 2) {
                    Text(VisaTranslations.uiString(mode.rawValue, language: language))
                        .font(.body.weight(.black))
                        .foregroundStyle(isSelected ? Color.cvBrand : .primary)
                    Text(VisaTranslations.uiString(mode.description, language: language))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Color.cvBrand)
                }
            }
            .padding(14)
            .background(isSelected ? Color.cvBrandSofter : Color.cvTertiarySystemBackground)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(isSelected ? Color.cvSelectedBorder : Color.cvHairline.opacity(0.55), lineWidth: isSelected ? 1.5 : 1)
            )
            .shadow(color: isSelected ? Color.cvBrand.opacity(0.12) : .clear, radius: 12, x: 0, y: 6)
        }
        .buttonStyle(.plain)
    }
}

private struct QuestionCountButton: View {
    let value: Int
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 2) {
                Text("\(value)")
                    .font(.title2.weight(.black))
                Text(VisaTranslations.uiString("Questions"))
                    .font(.caption2.weight(.bold))
                    .textCase(.uppercase)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .foregroundStyle(isSelected ? .white : Color.cvInk)
            .background(isSelected ? AnyShapeStyle(LinearGradient.cvBrandGradient) : AnyShapeStyle(Color.cvTertiarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(isSelected ? Color.cvSelectedBorder.opacity(0.45) : Color.cvHairline.opacity(0.65), lineWidth: 1)
            )
            .shadow(color: isSelected ? Color.cvBrand.opacity(0.18) : .clear, radius: 10, x: 0, y: 6)
        }
        .buttonStyle(.plain)
    }
}

private struct InterviewPlanPreview: View {
    let visaType: VisaType
    let language: AppLanguage
    let questionCount: Int
    let estimatedMinutes: Int
    let questions: [VisaQuestion]

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                MiniPlanMetric(value: "\(questionCount)", label: VisaTranslations.uiString("Questions", language: language))
                MiniPlanMetric(value: "\(estimatedMinutes)m", label: VisaTranslations.uiString("Estimate", language: language))
                MiniPlanMetric(value: visaType.rawValue, label: VisaTranslations.uiString("Visa Type", language: language))
            }

            VStack(alignment: .leading, spacing: 10) {
                Label(VisaTranslations.uiString("Question preview", language: language), systemImage: "list.bullet.rectangle")
                    .font(.caption.weight(.black))
                    .foregroundStyle(Color.cvBrand)

                ForEach(Array(questions.enumerated()), id: \.element.id) { index, question in
                    HStack(alignment: .top, spacing: 10) {
                        Text("\(index + 1)")
                            .font(.caption.weight(.black))
                            .foregroundStyle(Color.cvBrand)
                            .frame(width: 24, height: 24)
                            .background(Color.cvBrandSoft)
                            .clipShape(Circle())
                        Text(question.localizedText(language: language))
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Color.cvInk)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if index < questions.count - 1 {
                        Divider().padding(.leading, 34)
                    }
                }
            }
            .padding(14)
            .background(Color.cvBrandSofter.opacity(0.72))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
    }
}

private struct MiniPlanMetric: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.subheadline.weight(.black))
                .foregroundStyle(Color.cvInk)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
            Text(label)
                .font(.caption2.weight(.bold))
                .foregroundStyle(Color.cvInkTertiary)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.cvTertiarySystemBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - Live Screen

private struct LivePracticeScreen: View {
    @ObservedObject var session: LiveInterviewSession
    let config: InterviewLiveConfig
    let isAnalyzing: Bool
    let errorMessage: String?
    let onDoneAnswering: () -> Void
    let onEndInterview: () -> Void
    let onFeedback: () -> Void
    let onRetry: () -> Void
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            LivePracticeHeader(
                state: session.state,
                progressText: session.progressText,
                onClose: onClose
            )
            Divider()

            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        LiveRoleContext(config: config)

                        if session.messages.isEmpty {
                            LiveInterviewPlaceholder(state: session.state)
                        } else {
                            ForEach(session.messages) { message in
                                InterviewMessageBubble(message: message)
                                    .id(message.id)
                            }
                        }

                        if let visibleErrorMessage {
                            PracticeErrorBanner(message: visibleErrorMessage)
                        }
                    }
                    .padding(20)
                    .padding(.bottom, 10)
                }
                .onChange(of: session.messages) { _, messages in
                    guard let last = messages.last else { return }
                    withAnimation(.easeOut(duration: 0.25)) {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }

            LivePracticeFooter(
                state: session.state,
                canFinishAnswer: session.canFinishAnswer,
                canRequestFeedback: session.canRequestFeedback,
                isAnalyzing: isAnalyzing,
                onDoneAnswering: onDoneAnswering,
                onEndInterview: onEndInterview,
                onFeedback: onFeedback,
                onRetry: onRetry,
                onClose: onClose
            )
        }
        .overlay {
            if isAnalyzing {
                InterviewProcessingOverlay()
                    .transition(.opacity.combined(with: .scale(scale: 0.97)))
            }
        }
        .animation(.easeInOut(duration: 0.22), value: isAnalyzing)
    }

    private var visibleErrorMessage: String? {
        if case .failed(let message) = session.state {
            return message
        }
        return errorMessage
    }
}

private struct LivePracticeHeader: View {
    let state: LiveInterviewSessionState
    let progressText: String
    let onClose: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            Label(statusText, systemImage: statusIcon)
                .font(.caption.weight(.black))
                .foregroundStyle(statusColor)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(statusColor.opacity(0.12))
                .clipShape(Capsule())

            Spacer()

            Text(progressText)
                .font(.caption.weight(.black))
                .foregroundStyle(.secondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.cvSecondarySystemBackground)
                .clipShape(Capsule())

            Button(action: onClose) {
                Image(systemName: "xmark")
                    .font(.headline.weight(.bold))
                    .frame(width: 38, height: 38)
                    .background(Color.cvSecondarySystemBackground)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }

    private var statusText: String {
        switch state {
        case .idle: return VisaTranslations.uiString("Ready")
        case .connecting: return VisaTranslations.uiString("Connecting")
        case .interviewerSpeaking: return VisaTranslations.uiString("Officer speaking")
        case .listening: return VisaTranslations.uiString("Listening")
        case .ended: return VisaTranslations.uiString("Ready for report")
        case .failed: return VisaTranslations.uiString("Needs retry")
        }
    }

    private var statusIcon: String {
        switch state {
        case .connecting: return "antenna.radiowaves.left.and.right"
        case .interviewerSpeaking: return "sparkles"
        case .listening: return "mic.fill"
        case .ended: return "checkmark.circle.fill"
        case .failed: return "exclamationmark.triangle.fill"
        case .idle: return "circle"
        }
    }

    private var statusColor: Color {
        switch state {
        case .failed: return .orange
        case .listening: return .green
        case .ended: return Color.cvBrand
        default: return Color.cvBrand
        }
    }
}

private struct LiveRoleContext: View {
    let config: InterviewLiveConfig

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "mic.fill")
                .foregroundStyle(Color.cvBrand)
                .frame(width: 36, height: 36)
                .background(Color.cvBrandSoft)
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(config.job.title)
                    .font(.subheadline.weight(.bold))
                Text("\(VisaTranslations.uiString(config.job.company)) · \(config.language)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .cvCard(padding: 14)
    }
}

private struct LiveInterviewPlaceholder: View {
    let state: LiveInterviewSessionState

    var body: some View {
        VStack(spacing: 14) {
            if isFailed {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.orange)
            } else {
                AgentActivityOrb(
                    systemImage: "sparkles",
                    tint: Color.cvBrand,
                    size: 74
                )
            }
            Text(title)
                .font(.subheadline.weight(.semibold))
            Text(subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            if !isFailed {
                InterviewPreparationSteps()
                    .padding(.top, 2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 34)
        .cvCard(padding: 18, radius: 24, raised: true)
    }

    private var isFailed: Bool {
        if case .failed = state { return true }
        return false
    }

    private var title: String {
        isFailed ? VisaTranslations.uiString("The live interview could not start.") : VisaTranslations.uiString("The officer is preparing your interview.")
    }

    private var subtitle: String {
        isFailed ? VisaTranslations.uiString("Check the message below, then retry after the service is available.") : VisaTranslations.uiString("Establishing secure link and opening the mic after the officer speaks.")
    }
}

private struct InterviewPreparationSteps: View {
    private let steps = [
        PreparationStep(title: VisaTranslations.uiString("Consulate Link"), systemImage: "checkmark.circle.fill"),
        PreparationStep(title: VisaTranslations.uiString("Live Voice"), systemImage: "waveform"),
        PreparationStep(title: VisaTranslations.uiString("Transcript"), systemImage: "text.bubble.fill")
    ]

    var body: some View {
        HStack(spacing: 8) {
            ForEach(steps) { step in
                Label(step.title, systemImage: step.systemImage)
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(Color.cvBrand)
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
                    .padding(.horizontal, 9)
                    .padding(.vertical, 6)
                    .background(Color.cvBrandSoft.opacity(0.9))
                    .clipShape(Capsule())
            }
        }
    }
}

private struct PreparationStep: Identifiable {
    let id = UUID()
    let title: String
    let systemImage: String
}

private struct InterviewProcessingOverlay: View {
    var body: some View {
        ZStack {
            Rectangle()
                .fill(.ultraThinMaterial)
                .ignoresSafeArea()

            VStack(spacing: 18) {
                AgentActivityOrb(
                    systemImage: "chart.bar.fill",
                    tint: Color.cvBrand,
                    size: 92
                )

                VStack(spacing: 6) {
                    Text(VisaTranslations.uiString("Building your feedback report"))
                        .font(.headline.weight(.black))
                    Text(VisaTranslations.uiString("Analyzing your language fluency, communication scores, and answer logic."))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }

                HStack(spacing: 10) {
                    ProcessingStepPill(title: VisaTranslations.uiString("Transcript"), systemImage: "text.bubble.fill")
                    ProcessingStepPill(title: VisaTranslations.uiString("Scoring"), systemImage: "speedometer")
                    ProcessingStepPill(title: VisaTranslations.uiString("Report"), systemImage: "doc.text.fill")
                }
            }
            .padding(22)
            .frame(maxWidth: 330)
            .background(Color.cvSurface.opacity(0.94))
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: .black.opacity(0.10), radius: 22, x: 0, y: 12)
            .padding(.horizontal, 28)
        }
    }
}

private struct ProcessingStepPill: View {
    let title: String
    let systemImage: String

    var body: some View {
        Label(title, systemImage: systemImage)
            .font(.caption2.weight(.bold))
            .foregroundStyle(Color.cvBrand)
            .lineLimit(1)
            .minimumScaleFactor(0.78)
            .padding(.horizontal, 9)
            .padding(.vertical, 7)
            .background(Color.cvBrandSoft)
            .clipShape(Capsule())
    }
}

private struct AgentActivityOrb: View {
    let systemImage: String
    let tint: Color
    var size: CGFloat
    @State private var isAnimating = false

    var body: some View {
        ZStack {
            Circle()
                .stroke(tint.opacity(0.14), lineWidth: 1)
                .frame(width: size * 1.45, height: size * 1.45)
                .scaleEffect(isAnimating ? 1.08 : 0.92)
                .opacity(isAnimating ? 0.2 : 0.55)

            Circle()
                .fill(tint.opacity(0.11))
                .frame(width: size * 1.08, height: size * 1.08)
                .scaleEffect(isAnimating ? 1.04 : 0.88)

            Circle()
                .trim(from: 0.12, to: 0.82)
                .stroke(
                    tint,
                    style: StrokeStyle(lineWidth: 4, lineCap: .round)
                )
                .frame(width: size, height: size)
                .rotationEffect(.degrees(isAnimating ? 360 : 0))

            Image(systemName: systemImage)
                .font(.system(size: size * 0.28, weight: .black))
                .foregroundStyle(tint)
                .scaleEffect(isAnimating ? 1.06 : 0.94)
        }
        .frame(width: size * 1.5, height: size * 1.5)
        .onAppear {
            withAnimation(.linear(duration: 1.15).repeatForever(autoreverses: false)) {
                isAnimating = true
            }
        }
        .accessibilityHidden(true)
    }
}

private struct InterviewMessageBubble: View {
    let message: InterviewLiveMessage

    var body: some View {
        HStack(alignment: .bottom) {
            if message.speaker == .user { Spacer(minLength: 44) }

            VStack(alignment: .leading, spacing: 6) {
                Label(message.speaker == .user ? VisaTranslations.uiString("You") : VisaTranslations.uiString("Officer"), systemImage: message.speaker == .user ? "person.fill" : "person.badge.shield.checkmark.fill")
                    .font(.caption.weight(.black))
                    .foregroundStyle(message.speaker == .user ? .white.opacity(0.85) : .secondary)
                Text(message.text)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(message.speaker == .user ? .white : .primary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(14)
            .background(message.speaker == .user ? Color.cvBrand : Color.cvSurface)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(color: .black.opacity(message.speaker == .user ? 0.10 : 0.055), radius: 14, x: 0, y: 7)
            .overlay(alignment: .topTrailing) {
                if message.isLive {
                    Text("Live")
                        .font(.caption2.weight(.black))
                        .foregroundStyle(message.speaker == .user ? Color.cvBrand : .secondary)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(.white.opacity(message.speaker == .user ? 0.9 : 0.65))
                        .clipShape(Capsule())
                        .offset(x: 8, y: -8)
                }
            }
            .frame(maxWidth: 280, alignment: message.speaker == .user ? .trailing : .leading)

            if message.speaker == .interviewer { Spacer(minLength: 44) }
        }
    }
}

private struct LivePracticeFooter: View {
    let state: LiveInterviewSessionState
    let canFinishAnswer: Bool
    let canRequestFeedback: Bool
    let isAnalyzing: Bool
    let onDoneAnswering: () -> Void
    let onEndInterview: () -> Void
    let onFeedback: () -> Void
    let onRetry: () -> Void
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                StepStatusRow(
                    title: VisaTranslations.uiString("Live transcript"),
                    subtitle: VisaTranslations.uiString("Answers will appear as text"),
                    isDone: hasTranscriptStarted
                )
                StepStatusRow(
                    title: canRequestFeedback ? VisaTranslations.uiString("Create report") : VisaTranslations.uiString("Feedback report"),
                    subtitle: canRequestFeedback ? VisaTranslations.uiString("Tap Get feedback to review performance") : VisaTranslations.uiString("Generated after ending"),
                    isDone: false
                )
            }

            HStack(spacing: 12) {
                Button(role: canEndInterview ? .destructive : nil, action: secondaryAction) {
                    Label(VisaTranslations.uiString(secondaryTitle), systemImage: secondarySystemImage)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(secondaryForeground)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(secondaryBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
                .buttonStyle(.plain)

                Button(action: primaryAction) {
                    primaryLabel
                        .font(.subheadline.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                }
                .cvPrimaryActionButton()
                .disabled(primaryDisabled)
                .opacity(primaryDisabled ? 0.48 : 1)
            }
        }
        .padding(16)
        .padding(.bottom, max(CVLayout.floatingTabContentPadding - 28, 64))
        .background(.ultraThinMaterial)
    }

    private var hasTranscriptStarted: Bool {
        switch state {
        case .listening, .ended: return true
        default: return false
        }
    }

    private var canEndInterview: Bool {
        state != .ended && state != .connecting && state != .idle
    }

    private var primaryDisabled: Bool {
        switch state {
        case .listening: return false
        case .ended: return false
        default: return true
        }
    }

    @ViewBuilder
    private var primaryLabel: some View {
        if state == .ended {
            Label(VisaTranslations.uiString("Get Feedback"), systemImage: "chart.bar.doc.horizontal.fill")
        } else {
            Label(VisaTranslations.uiString("Done Answering"), systemImage: "checkmark.circle.fill")
        }
    }

    private var secondaryTitle: String {
        switch state {
        case .ended: return "Practice Again"
        default: return "End Interview"
        }
    }

    private var secondarySystemImage: String {
        switch state {
        case .ended: return "arrow.clockwise"
        default: return "phone.down.fill"
        }
    }

    private var secondaryForeground: Color {
        canEndInterview ? .red : .primary
    }

    private var secondaryBackground: Color {
        canEndInterview ? Color.red.opacity(0.12) : Color.cvSecondarySystemBackground
    }

    private func primaryAction() {
        playImpactHaptic(.medium)
        if state == .ended {
            onFeedback()
        } else {
            onDoneAnswering()
        }
    }

    private func secondaryAction() {
        playImpactHaptic(.medium)
        if state == .ended {
            onRetry()
        } else {
            onEndInterview()
        }
    }
}

private struct StepStatusRow: View {
    let title: String
    let subtitle: String
    let isDone: Bool

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: isDone ? "checkmark.circle.fill" : "circle")
                .font(.subheadline)
                .foregroundStyle(isDone ? Color.cvGreen : .secondary)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.primary)
                Text(subtitle)
                    .font(.system(size: 9))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer()
        }
        .padding(8)
        .frame(maxWidth: .infinity)
        .background(Color.cvSecondarySystemBackground.opacity(0.65))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

// MARK: - Practice Report Screen

private struct PracticeReportScreen: View {
    let config: InterviewLiveConfig
    let analysis: InterviewAnalysisResult?
    let elapsedSeconds: Int
    let onPracticeAgain: () -> Void
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text(VisaTranslations.uiString("Interview Completed"))
                    .font(.headline.weight(.black))
                Spacer()
                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.headline.weight(.bold))
                        .frame(width: 38, height: 38)
                        .background(Color.cvSecondarySystemBackground)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 12)
            
            Divider()

            if let analysis {
                let strengths = ReportInsightParser.items(from: analysis.strengths, kind: "strength")
                let weaknesses = ReportInsightParser.items(from: analysis.areasForImprovement, kind: "weakness")

                ScrollView {
                    VStack(spacing: 16) {
                        VStack(spacing: 14) {
                            Text(VisaTranslations.uiString("Consular Officer Feedback"))
                                .font(.headline.weight(.bold))
                            ScoreRing(score: analysis.overallScore, label: "score", size: 108)

                            HStack(spacing: 8) {
                                PracticeMetricPill(value: timeString(analysis.durationInSeconds ?? elapsedSeconds), label: VisaTranslations.uiString("Duration"))
                                PracticeMetricPill(value: config.job.title, label: VisaTranslations.uiString("Visa Type"))
                                PracticeMetricPill(value: config.language, label: VisaTranslations.uiString("Language"))
                            }
                        }
                        .cvCard(padding: 22, radius: 26, raised: true)

                        InterviewScoreBreakdown(analysis: analysis)

                        FeedbackInsightCard(
                            title: VisaTranslations.uiString("What went well"),
                            systemImage: "checkmark.seal.fill",
                            color: .green,
                            items: strengths
                        )

                        FeedbackInsightCard(
                            title: VisaTranslations.uiString("Areas for improvement"),
                            systemImage: "exclamationmark.triangle.fill",
                            color: .orange,
                            items: weaknesses
                        )
                        
                        // Show Transcript
                        if !analysis.transcript.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                Label(VisaTranslations.uiString("Interview Transcript"), systemImage: "doc.text.fill")
                                    .font(.headline.weight(.bold))
                                    .foregroundStyle(Color.cvBrand)
                                
                                ForEach(analysis.transcript.indices, id: \.self) { idx in
                                    let entry = analysis.transcript[idx]
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(entry.speaker == .user ? "\(VisaTranslations.uiString("You")):" : "\(VisaTranslations.uiString("Officer")):")
                                            .font(.caption.weight(.black))
                                            .foregroundStyle(entry.speaker == .user ? Color.cvBrand : .secondary)
                                        Text(entry.text)
                                            .font(.subheadline)
                                            .foregroundStyle(.primary)
                                    }
                                    .padding(8)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(entry.speaker == .user ? Color.cvBrandSoft.opacity(0.3) : Color.cvSecondarySystemBackground.opacity(0.5))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                }
                            }
                            .cvCard(padding: 18, radius: 24, raised: true)
                        }
                    }
                    .padding(20)
                    .padding(.bottom, CVLayout.floatingTabContentPadding + 72)
                }
                .safeAreaInset(edge: .bottom) {
                    VStack(spacing: 8) {
                        Button(action: onPracticeAgain) {
                            Label(VisaTranslations.uiString("Practice Again"), systemImage: "arrow.clockwise")
                                .font(.subheadline.weight(.bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
                        .cvPrimaryActionButton()
                    }
                    .padding(16)
                    .background(.ultraThinMaterial)
                }
            } else {
                PracticeErrorBanner(message: VisaTranslations.uiString("No interview report is available yet."))
                    .padding(20)
            }
        }
    }

    private func timeString(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainder = seconds % 60
        return String(format: "%d:%02d", minutes, remainder)
    }
}

private struct InterviewScoreBreakdown: View {
    let analysis: InterviewAnalysisResult

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(VisaTranslations.uiString("Metric breakdown"), systemImage: "chart.bar.fill")
                .font(.headline.weight(.bold))
                .foregroundStyle(Color.cvBrand)

            ScoreBar(title: VisaTranslations.uiString("Communication"), score: analysis.communicationScore)
            ScoreBar(title: VisaTranslations.uiString("Confidence"), score: analysis.confidenceScore)
            ScoreBar(title: VisaTranslations.uiString("Answer relevance"), score: analysis.relevanceScore)
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

private struct ScoreBar: View {
    let title: String
    let score: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                    .font(.caption.weight(.bold))
                Spacer()
                Text("\(score)%")
                    .font(.caption.weight(.black))
                    .foregroundStyle(Color.cvBrand)
            }
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.cvSystemFill)
                    Capsule()
                        .fill(Color.cvBrand)
                        .frame(width: proxy.size.width * min(CGFloat(score) / 100, 1))
                }
            }
            .frame(height: 7)
        }
    }
}

private struct FeedbackInsightCard: View {
    let title: String
    let systemImage: String
    let color: Color
    let items: [ReportInsightItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label(title, systemImage: systemImage)
                .font(.headline.weight(.bold))
                .foregroundStyle(color)
            VStack(alignment: .leading, spacing: 7) {
                ForEach(items) { item in
                    MarkdownText(item.markdown)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                }
            }
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

private struct MarkdownText: View {
    let markdown: String

    init(_ markdown: String) {
        self.markdown = markdown
    }

    var body: some View {
        Text(attributedMarkdown)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var attributedMarkdown: AttributedString {
        let sanitized = ReportInsightParser.normalizedMarkdown(markdown)
        if let attributed = try? AttributedString(markdown: sanitized) {
            return attributed
        }
        return AttributedString(ReportInsightParser.plainText(from: sanitized))
    }
}

private struct ReportInsightItem: Identifiable, Hashable {
    let id: String
    let title: String
    let body: String
    let markdown: String
}

private enum ReportInsightParser {
    static func items(from markdown: String, kind: String) -> [ReportInsightItem] {
        let lines = markdown
            .replacingOccurrences(of: "\r\n", with: "\n")
            .components(separatedBy: .newlines)
            .map(cleanLeadingBullet)
            .filter { !$0.isEmpty }

        let sourceLines = lines.isEmpty ? [markdown.trimmingCharacters(in: .whitespacesAndNewlines)] : lines
        return sourceLines.enumerated().compactMap { index, line in
            let clean = normalizedMarkdown(line)
            guard !clean.isEmpty else { return nil }
            let parts = splitTitleAndBody(clean)
            return ReportInsightItem(
                id: "\(kind)-\(index)-\(stableSlug(parts.title))",
                title: plainText(from: parts.title),
                body: plainText(from: parts.body),
                markdown: clean
            )
        }
    }

    static func normalizedMarkdown(_ value: String) -> String {
        cleanLeadingBullet(value)
            .replacingOccurrences(of: #"(?m)^\s*\d+\.\s*"#, with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func plainText(from markdown: String) -> String {
        markdown
            .replacingOccurrences(of: #"\*\*(.*?)\*\*"#, with: "$1", options: .regularExpression)
            .replacingOccurrences(of: #"`([^`]+)`"#, with: "$1", options: .regularExpression)
            .replacingOccurrences(of: #"[_*]{1,2}"#, with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func cleanLeadingBullet(_ line: String) -> String {
        line
            .replacingOccurrences(of: #"^\s*[-*•]\s*"#, with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func splitTitleAndBody(_ markdown: String) -> (title: String, body: String) {
        let clean = normalizedMarkdown(markdown)
        if clean.hasPrefix("**"),
           let close = clean.dropFirst(2).range(of: "**") {
            let titleStart = clean.index(clean.startIndex, offsetBy: 2)
            let rawTitle = String(clean[titleStart..<close.lowerBound])
            var remainder = String(clean[close.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
            if remainder.hasPrefix(":") {
                remainder.removeFirst()
                remainder = remainder.trimmingCharacters(in: .whitespacesAndNewlines)
            }
            return (
                rawTitle.trimmingCharacters(in: CharacterSet(charactersIn: ": ").union(.whitespacesAndNewlines)),
                remainder
            )
        }

        if let colon = clean.firstIndex(of: ":") {
            let title = String(clean[..<colon]).trimmingCharacters(in: .whitespacesAndNewlines)
            let body = String(clean[clean.index(after: colon)...]).trimmingCharacters(in: .whitespacesAndNewlines)
            if !title.isEmpty, !body.isEmpty, title.count <= 80 {
                return (title, body)
            }
        }

        return (firstWords(from: clean), clean)
    }

    private static func firstWords(from text: String) -> String {
        let words = plainText(from: text).split(separator: " ").prefix(7)
        return words.isEmpty ? VisaTranslations.uiString("Practice Focus") : words.joined(separator: " ")
    }

    private static func stableSlug(_ text: String) -> String {
        plainText(from: text)
            .lowercased()
            .replacingOccurrences(of: #"[^a-z0-9]+"#, with: "-", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
    }
}

private func playImpactHaptic(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
    #if os(iOS)
    let generator = UIImpactFeedbackGenerator(style: style)
    generator.prepare()
    generator.impactOccurred()
    #endif
}

private struct PracticeMetricPill: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.subheadline.weight(.black))
                .foregroundStyle(.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
            Text(label)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .frame(minWidth: 84)
        .padding(.vertical, 10)
        .padding(.horizontal, 14)
        .background(Color.cvSurface)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .shadow(color: .black.opacity(0.045), radius: 10, x: 0, y: 5)
    }
}

private struct PracticeErrorBanner: View {
    let message: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)
            Text(message)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
            Spacer()
        }
        .padding(12)
        .background(Color.orange.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}
