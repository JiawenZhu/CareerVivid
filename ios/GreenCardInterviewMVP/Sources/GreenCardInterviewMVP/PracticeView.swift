import SwiftUI
#if os(iOS)
import UIKit
#endif

private enum PracticeScreen {
    case setup
    case live
    case report
}

struct PracticeView: View {
    @StateObject private var liveSession = LiveInterviewSession()
    @State private var screen: PracticeScreen = .setup
    @State private var selectedJob: JobLead = SampleCareerVividData.jobs[0]
    @State private var selectedCategory: PracticeCategory = .behavioral
    @State private var activeConfig: InterviewLiveConfig?
    @State private var analysis: InterviewAnalysisResult?
    @State private var isAnalyzing = false
    @State private var errorMessage: String?
    @State private var activeWeaknessContextId: String?
    @State private var savedReports: [InterviewReportSnapshot] = []
    @State private var isLoadingReports = false
    @State private var reportHistoryError: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color.cvSystemGroupedBackground.ignoresSafeArea()

                switch screen {
                case .setup:
                    PracticeSetupScreen(
                        selectedJob: $selectedJob,
                        selectedCategory: $selectedCategory,
                        questions: questionsForSelection,
                        errorMessage: errorMessage,
                        savedReports: savedReports,
                        isLoadingReports: isLoadingReports,
                        reportHistoryError: reportHistoryError,
                        onRefreshReports: refreshReports,
                        onOpenReport: openSavedReport,
                        onStart: startInterview
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
                        onPracticeAgain: practiceAgainWithSameQuestion,
                        onRemediateWeakness: remediateWeakness,
                        onRemediateAll: remediateWeaknesses
                    )
                }
            }
            .navigationTitle("Practice")
            .task {
                await loadSavedReports()
            }
        }
    }

    private var currentConfig: InterviewLiveConfig {
        InterviewLiveConfig(
            job: selectedJob,
            category: selectedCategory,
            questions: questionsForSelection
        )
    }

    private var questionsForSelection: [String] {
        roleSpecificQuestions(job: selectedJob, category: selectedCategory)
    }
}

// MARK: - Actions

private extension PracticeView {
    func startInterview() {
        let config = currentConfig
        activeConfig = config
        activeWeaknessContextId = nil
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

    func resetToSetup() {
        liveSession.cancel(resetToIdle: true)
        analysis = nil
        errorMessage = nil
        isAnalyzing = false
        activeWeaknessContextId = nil
        screen = .setup
    }

    func practiceAgainWithSameQuestion() {
        let config = activeConfig ?? currentConfig
        activeConfig = config
        activeWeaknessContextId = nil
        analysis = nil
        errorMessage = nil
        isAnalyzing = false
        screen = .live
        liveSession.start(config: config)
    }

    func remediateWeakness(_ weakness: ReportInsightItem) {
        startRemediationInterview(with: [weakness], contextId: weakness.id)
    }

    func remediateWeaknesses(_ weaknesses: [ReportInsightItem]) {
        let selectedWeaknesses = weaknesses.isEmpty
            ? ReportInsightParser.items(from: analysis?.areasForImprovement ?? "", kind: "weakness")
            : weaknesses
        startRemediationInterview(with: selectedWeaknesses, contextId: "weakness-booster-\(Date().timeIntervalSince1970)")
    }

    func startRemediationInterview(with weaknesses: [ReportInsightItem], contextId: String) {
        let baseConfig = activeConfig ?? currentConfig
        let focusItems = weaknesses.isEmpty
            ? [ReportInsightItem(id: "weakness-general", title: "Improve interview structure", body: "Practice clearer STAR answers, stronger examples, and tighter role relevance.", markdown: "Practice clearer STAR answers, stronger examples, and tighter role relevance.")]
            : weaknesses
        let focus = focusItems.map { "\($0.title): \($0.body)" }
        let config = InterviewLiveConfig(
            job: baseConfig.job,
            category: baseConfig.category,
            questions: remediationQuestions(for: focusItems, baseConfig: baseConfig),
            remediationContextId: contextId,
            remediationFocus: focus
        )
        activeConfig = config
        activeWeaknessContextId = contextId
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
            errorMessage = "Answer at least one question before generating feedback."
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
                LocalInterviewReportCache.save(result: result, config: config)
                rememberReport(.current(result: result, config: config))
                analysis = result
                screen = .report
            } catch {
                errorMessage = error.localizedDescription
            }
            isAnalyzing = false
        }
    }

    func openSavedReport(_ report: InterviewReportSnapshot) {
        playImpactHaptic(.light)
        let config = report.config
        selectedJob = config.job
        selectedCategory = config.category
        activeConfig = config
        activeWeaknessContextId = nil
        analysis = report.analysis
        errorMessage = nil
        isAnalyzing = false
        screen = .report
    }

    func refreshReports() {
        Task {
            await loadSavedReports(forceRemote: true)
        }
    }

    @MainActor
    func loadSavedReports(forceRemote: Bool = false) async {
        guard !isLoadingReports else { return }
        isLoadingReports = true
        reportHistoryError = nil

        let localReports = LocalInterviewReportCache.load().map(InterviewReportSnapshot.local)
        if !forceRemote, !localReports.isEmpty {
            savedReports = localReports
        }

        do {
            let remoteReports = try await RemoteInterviewReportStore().loadReports()
            let combined = mergeReports(primary: remoteReports, fallback: localReports)
            savedReports = combined
            reportHistoryError = nil
        } catch {
            if savedReports.isEmpty {
                savedReports = localReports
            }
            if savedReports.isEmpty {
                reportHistoryError = error.localizedDescription
            } else {
                reportHistoryError = "Showing local reports. Sign in or refresh to sync older CareerVivid reports."
            }
        }

        isLoadingReports = false
    }

    func rememberReport(_ report: InterviewReportSnapshot) {
        savedReports.removeAll { $0.analysis.id == report.analysis.id || $0.id == report.id }
        savedReports.insert(report, at: 0)
        savedReports = Array(savedReports.prefix(12))
    }

    func mergeReports(primary: [InterviewReportSnapshot], fallback: [InterviewReportSnapshot]) -> [InterviewReportSnapshot] {
        var seen = Set<String>()
        var merged: [InterviewReportSnapshot] = []

        for report in (primary + fallback).sorted(by: { $0.savedAt > $1.savedAt }) {
            let key = report.analysis.id
            guard !seen.contains(key) else { continue }
            seen.insert(key)
            merged.append(report)
        }

        return Array(merged.prefix(12))
    }
}

// MARK: - Setup Screen

private struct PracticeSetupScreen: View {
    @Binding var selectedJob: JobLead
    @Binding var selectedCategory: PracticeCategory
    let questions: [String]
    let errorMessage: String?
    let savedReports: [InterviewReportSnapshot]
    let isLoadingReports: Bool
    let reportHistoryError: String?
    let onRefreshReports: () -> Void
    let onOpenReport: (InterviewReportSnapshot) -> Void
    let onStart: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if let errorMessage {
                    PracticeErrorBanner(message: errorMessage)
                }

                InterviewSetupIntro()

                RecentInterviewReportsSection(
                    reports: savedReports,
                    isLoading: isLoadingReports,
                    errorMessage: reportHistoryError,
                    onRefresh: onRefreshReports,
                    onOpenReport: onOpenReport
                )

                InterviewJobPicker(selectedJob: $selectedJob)

                InterviewCategoryPicker(selectedCategory: $selectedCategory)

                InterviewQuestionPreview(
                    role: selectedJob.title,
                    company: selectedJob.company,
                    category: selectedCategory,
                    questions: questions
                )

                Button(action: onStart) {
                    Label("Start live mock interview", systemImage: "mic.fill")
                        .font(.headline.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                }
                .cvPrimaryActionButton()
            }
            .padding(20)
            .padding(.bottom, CVLayout.floatingTabContentPadding)
        }
    }
}

private struct InterviewSetupIntro: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Live interview coach", systemImage: "sparkles")
                .font(.caption.weight(.bold))
                .foregroundStyle(Color.cvBrand)
            Text("Practice with Vivid")
                .font(.title2.weight(.black))
            Text("A short, natural conversation tailored to the role. Vivid asks one question at a time, captures your answers, then creates a feedback report.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .cvCard(padding: 20, radius: 24, raised: true)
    }
}

private struct RecentInterviewReportsSection: View {
    let reports: [InterviewReportSnapshot]
    let isLoading: Bool
    let errorMessage: String?
    let onRefresh: () -> Void
    let onOpenReport: (InterviewReportSnapshot) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Previous reports")
                        .font(.headline.weight(.bold))
                    Text("Review saved interview feedback without starting over.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button(action: onRefresh) {
                    Image(systemName: "arrow.clockwise")
                        .font(.caption.weight(.black))
                        .frame(width: 30, height: 30)
                        .background(Color.cvBrandSoft)
                        .foregroundStyle(Color.cvBrand)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .disabled(isLoading)
                .accessibilityLabel("Refresh interview reports")
            }

            if isLoading, reports.isEmpty {
                RecentReportLoadingRow()
            } else if reports.isEmpty {
                RecentReportEmptyRow(errorMessage: errorMessage)
            } else {
                VStack(spacing: 8) {
                    ForEach(reports.prefix(4)) { report in
                        Button {
                            onOpenReport(report)
                        } label: {
                            RecentInterviewReportRow(report: report)
                        }
                        .buttonStyle(RecentReportButtonStyle())
                    }
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

private struct RecentReportLoadingRow: View {
    var body: some View {
        HStack(spacing: 12) {
            ProgressView()
                .tint(Color.cvBrand)
            VStack(alignment: .leading, spacing: 3) {
                Text("Syncing reports")
                    .font(.subheadline.weight(.bold))
                Text("Loading your CareerVivid practice history.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(12)
        .background(Color.cvBrandSofter)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.cvSelectedBorder.opacity(0.35), lineWidth: 1)
        )
    }
}

private struct RecentReportEmptyRow: View {
    let errorMessage: String?

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "chart.bar.doc.horizontal")
                .font(.headline.weight(.bold))
                .foregroundStyle(Color.cvBrand)
                .frame(width: 38, height: 38)
                .background(Color.cvBrandSoft)
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 3) {
                Text(errorMessage == nil ? "No saved reports yet" : "Reports unavailable")
                    .font(.subheadline.weight(.bold))
                Text(errorMessage ?? "Complete one interview, or sign in with the same account you use on the website.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer()
        }
        .padding(12)
        .background(Color.cvTertiarySystemBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct RecentInterviewReportRow: View {
    let report: InterviewReportSnapshot

    var body: some View {
        HStack(spacing: 12) {
            ScoreBadge(score: report.analysis.overallScore)

            VStack(alignment: .leading, spacing: 4) {
                Text(report.jobTitle)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Text("\(report.company) - \(report.category.rawValue)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Text(report.displayDate)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }

            Spacer(minLength: 8)

            Image(systemName: "chevron.right")
                .font(.caption.weight(.bold))
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .background(Color.cvTertiarySystemBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct ScoreBadge: View {
    let score: Int

    var body: some View {
        VStack(spacing: 0) {
            Text("\(score)")
                .font(.subheadline.weight(.black))
                .foregroundStyle(scoreColor)
            Text("score")
                .font(.caption2.weight(.bold))
                .foregroundStyle(.secondary)
        }
        .frame(width: 52, height: 52)
        .background(scoreColor.opacity(0.10))
        .clipShape(Circle())
        .overlay(
            Circle()
                .stroke(scoreColor.opacity(0.28), lineWidth: 1)
        )
    }

    private var scoreColor: Color {
        score >= 80 ? .green : score >= 60 ? Color.cvBrand : .orange
    }
}

private struct RecentReportButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .opacity(configuration.isPressed ? 0.86 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

private struct InterviewJobPicker: View {
    @Binding var selectedJob: JobLead

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Target role")
                .font(.headline.weight(.bold))

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(SampleCareerVividData.jobs) { job in
                        Button {
                            selectedJob = job
                        } label: {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("\(job.matchScore)%")
                                        .font(.caption2.weight(.black))
                                        .foregroundStyle(Color.cvBrand)
                                    Spacer()
                                    if selectedJob.id == job.id {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(Color.cvBrand)
                                    }
                                }
                                Text(job.title)
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(.primary)
                                    .lineLimit(2)
                                    .multilineTextAlignment(.leading)
                                Text(job.company)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .frame(width: 170, alignment: .leading)
                            .padding(14)
                            .background(selectedJob.id == job.id ? Color.cvBrandSoft : Color.cvTertiarySystemBackground)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .stroke(selectedJob.id == job.id ? Color.cvBrand.opacity(0.45) : Color.cvSeparator, lineWidth: 1)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

private struct InterviewCategoryPicker: View {
    @Binding var selectedCategory: PracticeCategory

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Interview type")
                .font(.headline.weight(.bold))
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(PracticeCategory.allCases) { category in
                        PracticeCategoryChip(
                            category: category,
                            isSelected: selectedCategory == category
                        ) {
                            selectedCategory = category
                        }
                    }
                }
            }
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

private struct InterviewQuestionPreview: View {
    let role: String
    let company: String
    let category: PracticeCategory
    let questions: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: category.icon)
                    .foregroundStyle(Color.cvBrand)
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(category.rawValue) focus")
                        .font(.subheadline.weight(.bold))
                    Text("\(role) at \(company)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                PillLabel(text: "\(questions.count) prompts", color: Color.cvBrand)
            }

            VStack(alignment: .leading, spacing: 10) {
                ForEach(Array(questions.prefix(3).enumerated()), id: \.offset) { index, question in
                    HStack(alignment: .top, spacing: 10) {
                        Text("\(index + 1)")
                            .font(.caption2.weight(.black))
                            .foregroundStyle(Color.cvBrand)
                            .frame(width: 22, height: 22)
                            .background(Color.cvBrandSoft)
                            .clipShape(Circle())
                        Text(question)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.primary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if index < min(questions.count, 3) - 1 {
                        Divider()
                    }
                }
            }
        }
        .cvCard(padding: 18, radius: 24, raised: true)
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
        case .idle: return "Ready"
        case .connecting: return "Connecting"
        case .interviewerSpeaking: return "Vivid speaking"
        case .listening: return "Listening"
        case .ended: return "Ready for report"
        case .failed: return "Needs retry"
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
            Image(systemName: config.category.icon)
                .foregroundStyle(Color.cvBrand)
                .frame(width: 36, height: 36)
                .background(Color.cvBrandSoft)
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(config.job.title)
                    .font(.subheadline.weight(.bold))
                Text("\(config.job.company) - \(config.category.rawValue)")
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
        isFailed ? "The live interview could not start." : "Vivid is preparing your interview."
    }

    private var subtitle: String {
        isFailed ? "Check the message below, then retry after the service is available." : "Building role context and opening the mic after Vivid speaks."
    }
}

private struct InterviewPreparationSteps: View {
    private let steps = [
        PreparationStep(title: "Role context", systemImage: "checkmark.circle.fill"),
        PreparationStep(title: "Live voice", systemImage: "waveform"),
        PreparationStep(title: "Transcript", systemImage: "text.bubble.fill")
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
                    Text("Building your feedback report")
                        .font(.headline.weight(.black))
                    Text("CareerVivid is reviewing the transcript, scoring your answers, and saving the practice history.")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }

                HStack(spacing: 10) {
                    ProcessingStepPill(title: "Transcript", systemImage: "text.bubble.fill")
                    ProcessingStepPill(title: "Scoring", systemImage: "speedometer")
                    ProcessingStepPill(title: "Report", systemImage: "doc.text.fill")
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
                Label(message.speaker.displayName, systemImage: message.speaker == .user ? "person.fill" : "wand.and.stars")
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
                    title: "Live transcript",
                    subtitle: "Your answers appear as text",
                    isDone: hasTranscriptStarted
                )
                StepStatusRow(
                    title: canRequestFeedback ? "Create report" : "Feedback report",
                    subtitle: canRequestFeedback ? "Tap Get feedback to save this attempt" : "Saved after analysis",
                    isDone: false
                )
            }

            HStack(spacing: 12) {
                Button(role: canEndInterview ? .destructive : nil, action: secondaryAction) {
                    Label(secondaryTitle, systemImage: secondarySystemImage)
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
        switch state {
        case .connecting, .interviewerSpeaking, .listening:
            return !isAnalyzing
        case .idle, .ended, .failed:
            return false
        }
    }

    private var secondaryTitle: String {
        canEndInterview ? "End" : "Close"
    }

    private var secondarySystemImage: String {
        canEndInterview ? "stop.circle.fill" : "xmark.circle.fill"
    }

    private var secondaryForeground: Color {
        canEndInterview ? .red : .secondary
    }

    private var secondaryBackground: Color {
        canEndInterview ? Color.red.opacity(0.12) : Color.cvSecondarySystemBackground
    }

    private var primaryLabel: some View {
        Group {
            if isAnalyzing {
                Label("Analyzing", systemImage: "sparkles")
            } else if isFailed {
                Label("Retry", systemImage: "arrow.clockwise")
            } else if canRequestFeedback {
                Label("Get feedback", systemImage: "chart.bar.fill")
            } else if canFinishAnswer {
                Label("Done answering", systemImage: "checkmark")
            } else {
                Label(holdingText, systemImage: "mic.fill")
            }
        }
    }

    private var holdingText: String {
        switch state {
        case .connecting: return "Connecting"
        case .interviewerSpeaking: return "Vivid speaking"
        default: return "Listening soon"
        }
    }

    private var primaryDisabled: Bool {
        isAnalyzing || (!isFailed && !canFinishAnswer && !canRequestFeedback)
    }

    private func primaryAction() {
        if isFailed {
            onRetry()
        } else if canRequestFeedback {
            onFeedback()
        } else if canFinishAnswer {
            onDoneAnswering()
        }
    }

    private func secondaryAction() {
        if canEndInterview {
            onEndInterview()
        } else {
            onClose()
        }
    }

    private var isFailed: Bool {
        if case .failed = state { return true }
        return false
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
                .foregroundStyle(isDone ? .green : .secondary)
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.caption.weight(.bold))
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            Spacer(minLength: 0)
        }
        .padding(10)
        .background(Color.cvSecondarySystemBackground.opacity(0.75))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - Report Screen

private struct PracticeReportScreen: View {
    let config: InterviewLiveConfig
    let analysis: InterviewAnalysisResult?
    let elapsedSeconds: Int
    let onPracticeAgain: () -> Void
    let onRemediateWeakness: (ReportInsightItem) -> Void
    let onRemediateAll: ([ReportInsightItem]) -> Void

    var body: some View {
        Group {
            if let analysis {
                let strengths = ReportInsightParser.items(from: analysis.strengths, kind: "strength")
                let weaknesses = ReportInsightParser.items(from: analysis.areasForImprovement, kind: "weakness")

                ScrollView {
                    VStack(spacing: 16) {
                        VStack(spacing: 14) {
                            Text("Interview report")
                                .font(.headline.weight(.bold))
                            ScoreRing(score: analysis.overallScore, label: "score", size: 108)

                            HStack(spacing: 12) {
                                PracticeMetricPill(value: timeString(analysis.durationInSeconds ?? elapsedSeconds), label: "Time")
                                PracticeMetricPill(value: config.category.rawValue, label: "Type")
                            }
                        }
                        .cvCard(padding: 22, radius: 26, raised: true)

                        InterviewScoreBreakdown(analysis: analysis)

                        FeedbackInsightCard(
                            title: "What went well",
                            systemImage: "checkmark.seal.fill",
                            color: .green,
                            items: strengths
                        )

                        WeaknessRemediationCard(
                            weaknesses: weaknesses,
                            onSelect: onRemediateWeakness
                        )
                    }
                    .padding(20)
                    .padding(.bottom, CVLayout.floatingTabContentPadding + 72)
                }
                .safeAreaInset(edge: .bottom) {
                    ReportActionMatrix(
                        weaknesses: weaknesses,
                        onPracticeAgain: onPracticeAgain,
                        onRemediateAll: onRemediateAll
                    )
                }
            } else {
                PracticeErrorBanner(message: "No interview report is available yet.")
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
            Label("Metric breakdown", systemImage: "chart.bar.fill")
                .font(.headline.weight(.bold))
                .foregroundStyle(Color.cvBrand)

            ScoreBar(title: "Communication", score: analysis.communicationScore)
            ScoreBar(title: "Confidence", score: analysis.confidenceScore)
            ScoreBar(title: "Answer relevance", score: analysis.relevanceScore)
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

private struct WeaknessRemediationCard: View {
    let weaknesses: [ReportInsightItem]
    let onSelect: (ReportInsightItem) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Practice next", systemImage: "target")
                .font(.headline.weight(.bold))
                .foregroundStyle(.orange)

            ForEach(weaknesses) { weakness in
                Button {
                    playImpactHaptic(.light)
                    onSelect(weakness)
                } label: {
                    WeaknessRow(weakness: weakness)
                }
                .buttonStyle(WeaknessRowButtonStyle())
                .accessibilityLabel("Practice weakness: \(weakness.title)")
            }
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

private struct WeaknessRow: View {
    let weakness: ReportInsightItem

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "scope")
                .font(.subheadline.weight(.black))
                .foregroundStyle(.orange)
                .frame(width: 30, height: 30)
                .background(Color.orange.opacity(0.12))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 5) {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(weakness.title)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 4)
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.secondary)
                }
                if !weakness.body.isEmpty {
                    MarkdownText(weakness.body)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                Text("Start targeted drill")
                    .font(.caption2.weight(.black))
                    .foregroundStyle(Color.cvBrand)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.cvBrandSoft)
                    .clipShape(Capsule())
            }
        }
        .padding(12)
        .background(Color.cvTertiarySystemBackground)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct WeaknessRowButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .opacity(configuration.isPressed ? 0.82 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

private struct ReportActionMatrix: View {
    let weaknesses: [ReportInsightItem]
    let onPracticeAgain: () -> Void
    let onRemediateAll: ([ReportInsightItem]) -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button {
                playImpactHaptic(.medium)
                onPracticeAgain()
            } label: {
                ReportActionButtonLabel(
                    title: "Practice Again",
                    subtitle: "Same question",
                    systemImage: "arrow.clockwise",
                    isPrimary: false
                )
            }
            .buttonStyle(.plain)

            Button {
                playImpactHaptic(.medium)
                onRemediateAll(weaknesses)
            } label: {
                ReportActionButtonLabel(
                    title: "Skill Booster",
                    subtitle: "Fix weak spots",
                    systemImage: "bolt.fill",
                    isPrimary: true
                )
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 12)
        .background(.ultraThinMaterial)
    }
}

private struct ReportActionButtonLabel: View {
    let title: String
    let subtitle: String
    let systemImage: String
    let isPrimary: Bool

    var body: some View {
        HStack(spacing: 9) {
            Image(systemName: systemImage)
                .font(.subheadline.weight(.black))
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.caption.weight(.black))
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
                Text(subtitle)
                    .font(.caption2.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
                    .opacity(0.78)
            }
            Spacer(minLength: 0)
        }
        .foregroundStyle(isPrimary ? .white : Color.cvBrand)
        .padding(.horizontal, 13)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, minHeight: 58)
        .background(isPrimary ? AnyShapeStyle(LinearGradient.cvBrandGradient) : AnyShapeStyle(Color.cvBrandSoft))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .shadow(color: isPrimary ? Color.cvBrand.opacity(0.18) : .clear, radius: 14, x: 0, y: 7)
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
        return words.isEmpty ? "Practice focus" : words.joined(separator: " ")
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

private func remediationQuestions(for weaknesses: [ReportInsightItem], baseConfig: InterviewLiveConfig) -> [String] {
    let focusItems = weaknesses.isEmpty
        ? [ReportInsightItem(id: "weakness-general", title: "Improve answer structure", body: "Use clearer examples, sharper STAR structure, and role-specific evidence.", markdown: "Use clearer examples, sharper STAR structure, and role-specific evidence.")]
        : Array(weaknesses.prefix(5))

    var questions = focusItems.map { weakness in
        "Let's work on \(weakness.title.lowercased()). For a \(baseConfig.job.title) interview at \(baseConfig.job.company), answer with a specific example that directly improves this weakness."
    }
    questions.append("Now combine the improvements into one concise, role-specific answer that uses clear structure, concrete impact, and confident delivery.")
    return questions
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

// MARK: - Shared UI

private struct PracticeCategoryChip: View {
    let category: PracticeCategory
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 6) {
                Image(systemName: category.icon)
                    .font(.caption.weight(.semibold))
                Text(category.rawValue)
                    .font(.caption.weight(.semibold))
            }
            .foregroundStyle(isSelected ? .white : .primary)
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .background(isSelected ? Color.cvBrand : Color.cvSecondarySystemBackground)
            .clipShape(Capsule())
            .shadow(color: isSelected ? Color.cvBrand.opacity(0.16) : .clear, radius: 10, x: 0, y: 5)
        }
        .buttonStyle(.plain)
        .animation(.easeInOut(duration: 0.15), value: isSelected)
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

// MARK: - Question Generation

func roleSpecificQuestions(job: JobLead, category: PracticeCategory) -> [String] {
    switch category {
    case .behavioral:
        return [
            "Tell me about a recent project that shows why you are a strong fit for \(job.title).",
            "Describe a time you had to make progress with unclear requirements or shifting priorities.",
            "What is one project outcome you are proud of, and what was your personal contribution?",
            "Tell me about feedback you received and how it changed the way you work.",
            "How do you communicate trade-offs to non-technical stakeholders?",
        ]
    case .systemDesign:
        return [
            "Let's design a core system a \(job.title) at \(job.company) might own. What requirements would you clarify first?",
            "How would you break that system into services, data stores, and async workflows?",
            "What are the main scaling risks, and how would you measure them?",
            "Where would you use caching, queues, or background jobs, and why?",
            "How would you monitor reliability and debug production incidents?",
        ]
    case .technical:
        return [
            "Walk me through a technical project that best proves you can do \(job.title) work.",
            "What was the hardest engineering decision in that project?",
            "How did you test or validate the solution before shipping?",
            "Tell me about a performance, reliability, or data problem you solved.",
            "What would you improve if you had another week on that project?",
        ]
    case .leadership:
        return [
            "Tell me about a time you influenced a technical decision without formal authority.",
            "How do you keep teammates aligned when priorities conflict?",
            "Describe a project where you raised the quality bar for the team.",
            "How do you coach or unblock other engineers while still delivering your own work?",
            "Tell me about a mistake or incident and how you helped the team learn from it.",
        ]
    }
}
