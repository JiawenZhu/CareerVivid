import SwiftUI

struct ResumeCoachView: View {
    @StateObject private var session = ResumeCoachSession()
    @State private var didStart = false

    let isGenerating: Bool
    let externalError: String?
    let onCancel: () -> Void
    let onCreateResume: (String) -> Void

    var body: some View {
        ZStack {
            ResumeCoachGradient()

            VStack(spacing: 18) {
                ResumeCoachHeader(
                    statusText: statusText,
                    progressText: session.progressText,
                    onCancel: cancel
                )

                ResumeCoachTranscriptPanel(
                    messages: session.messages,
                    state: session.state
                )

                ResumeCoachStatusPanel(
                    state: session.state,
                    hasTranscript: session.canGenerate,
                    isGenerating: isGenerating,
                    externalError: externalError
                )

                ResumeCoachControls(
                    state: session.state,
                    canGenerate: session.canGenerate,
                    isGenerating: isGenerating,
                    onAnswer: session.startAnswering,
                    onFinishAnswer: session.finishAnswering,
                    onSkip: session.skipQuestion,
                    onCreateResume: createResume,
                    onCancel: cancel
                )
            }
            .padding(.horizontal, 22)
            .padding(.top, 18)
            .padding(.bottom, 26)
        }
        .onAppear(perform: startIfNeeded)
        .onDisappear {
            session.cancel()
        }
    }

    private var statusText: String {
        switch session.state {
        case .idle:
            return "Starting"
        case .connecting:
            return "Connecting"
        case .speaking:
            return "Coach asking"
        case .waitingForAnswer:
            return "Ready"
        case .listening:
            return "Listening"
        case .readyToGenerate:
            return "Ready to create"
        case .failed:
            return "Needs retry"
        }
    }

    private func startIfNeeded() {
        guard !didStart else { return }
        didStart = true
        session.start()
    }

    private func createResume() {
        let transcript = session.transcriptForGeneration()
        guard !transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        onCreateResume(transcript)
    }

    private func cancel() {
        session.cancel()
        onCancel()
    }
}

// MARK: - Background

private struct ResumeCoachGradient: View {
    var body: some View {
        LinearGradient(
            colors: [
                Color(red: 0.95, green: 0.35, blue: 0.31),
                Color(red: 0.58, green: 0.40, blue: 0.76),
                Color(red: 0.78, green: 0.22, blue: 0.26)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
        .overlay(
            RadialGradient(
                colors: [Color.white.opacity(0.20), .clear],
                center: .topTrailing,
                startRadius: 20,
                endRadius: 360
            )
            .ignoresSafeArea()
        )
    }
}

// MARK: - Header

private struct ResumeCoachHeader: View {
    let statusText: String
    let progressText: String
    let onCancel: () -> Void

    var body: some View {
        HStack {
            ResumeCoachPill(icon: "sparkles", text: statusText)
            Spacer()
            Text(progressText)
                .font(.footnote.weight(.bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.black.opacity(0.18))
                .clipShape(Capsule())
            Button(action: onCancel) {
                Image(systemName: "xmark")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(Color.white.opacity(0.16))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Close resume coach")
        }
    }
}

private struct ResumeCoachPill: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
            Text(text)
        }
        .font(.footnote.weight(.bold))
        .foregroundStyle(.white)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.18))
        .clipShape(Capsule())
    }
}

// MARK: - Transcript

private struct ResumeCoachTranscriptPanel: View {
    let messages: [ResumeCoachMessage]
    let state: ResumeCoachSessionState

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    ForEach(messages) { message in
                        ResumeCoachMessageBubble(message: message)
                            .id(message.id)
                    }
                    if messages.isEmpty {
                        ResumeCoachEmptyTranscript()
                    }
                }
                .padding(14)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.white.opacity(0.16))
            .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(Color.white.opacity(0.14), lineWidth: 1)
            )
            .onChange(of: messages.map(\.id)) { _, ids in
                guard let last = ids.last else { return }
                withAnimation(.easeOut(duration: 0.2)) {
                    proxy.scrollTo(last, anchor: .bottom)
                }
            }
        }
    }
}

private struct ResumeCoachMessageBubble: View {
    let message: ResumeCoachMessage

    private var isUser: Bool {
        message.speaker == .user
    }

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 34) }

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: isUser ? "person.fill" : "wand.and.stars")
                    Text(message.speaker.rawValue)
                    if message.isLive {
                        Text("Live")
                            .font(.caption2.weight(.bold))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.white.opacity(0.22))
                            .clipShape(Capsule())
                    }
                }
                .font(.caption.weight(.bold))
                .foregroundStyle(.white.opacity(0.72))

                Text(message.text)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(14)
            .background(isUser ? Color.cvBrand.opacity(0.78) : Color.black.opacity(0.22))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))

            if !isUser { Spacer(minLength: 34) }
        }
    }
}

private struct ResumeCoachEmptyTranscript: View {
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "mic.and.signal.meter.fill")
                .font(.largeTitle)
                .foregroundStyle(.white.opacity(0.78))
            Text("Your coach conversation will appear here.")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white.opacity(0.78))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, minHeight: 220)
    }
}

// MARK: - Status

private struct ResumeCoachStatusPanel: View {
    let state: ResumeCoachSessionState
    let hasTranscript: Bool
    let isGenerating: Bool
    let externalError: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let errorText {
                ResumeCoachErrorRow(message: errorText)
            }

            ResumeCoachStepRow(
                isComplete: hasTranscript,
                title: "Live transcript",
                subtitle: "Your answers are captured as text"
            )
            ResumeCoachStepRow(
                isComplete: isDraftReady,
                title: draftTitle,
                subtitle: draftSubtitle
            )
        }
        .padding(18)
        .background(Color.black.opacity(0.18))
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    private var errorText: String? {
        if let externalError, !externalError.isEmpty {
            return externalError
        }
        if case .failed(let message) = state {
            return message
        }
        return nil
    }

    private var isDraftReady: Bool {
        externalError == nil && (isGenerating || state == .readyToGenerate)
    }

    private var draftTitle: String {
        isGenerating ? "Creating resume" : "Resume draft"
    }

    private var draftSubtitle: String {
        switch (isGenerating, state) {
        case (true, _):
            return "CareerVivid is building an editable draft"
        case (_, .readyToGenerate):
            return "Ready to turn the conversation into a resume"
        default:
            return "CareerVivid turns the conversation into an editable resume"
        }
    }
}

private struct ResumeCoachStepRow: View {
    let isComplete: Bool
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: isComplete ? "checkmark.circle.fill" : "circle")
                .font(.title3.weight(.semibold))
                .foregroundStyle(isComplete ? .green : .white.opacity(0.62))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.white)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.68))
            }
            Spacer()
        }
    }
}

private struct ResumeCoachErrorRow: View {
    let message: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.yellow)
            Text(message)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white)
                .lineLimit(4)
            Spacer()
        }
        .padding(12)
        .background(Color.white.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - Controls

private struct ResumeCoachControls: View {
    let state: ResumeCoachSessionState
    let canGenerate: Bool
    let isGenerating: Bool
    let onAnswer: () -> Void
    let onFinishAnswer: () -> Void
    let onSkip: () -> Void
    let onCreateResume: () -> Void
    let onCancel: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                CircleButton(
                    systemImage: "xmark",
                    background: Color.white.opacity(0.18),
                    foreground: .white,
                    action: onCancel
                )

                Spacer()

                if showsSkip {
                    SecondaryCoachButton(title: "Skip", systemImage: "forward.fill", action: onSkip)
                }

                PrimaryCoachButton(
                    title: primaryTitle,
                    systemImage: primaryIcon,
                    isLoading: isGenerating,
                    isDisabled: primaryDisabled,
                    action: primaryAction
                )
            }

            if canGenerate && !isGenerating && state != .readyToGenerate {
                Button(action: onCreateResume) {
                    Label("Create resume now", systemImage: "doc.text.fill")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(Color.black.opacity(0.16))
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var showsSkip: Bool {
        state == .waitingForAnswer || state == .idle
    }

    private var primaryTitle: String {
        if isGenerating { return "Creating" }
        switch state {
        case .connecting:
            return "Connecting"
        case .speaking:
            return "Coach speaking"
        case .listening:
            return "Done answering"
        case .readyToGenerate:
            return "Create resume"
        case .failed:
            return "Try again"
        default:
            return "Answer"
        }
    }

    private var primaryIcon: String {
        if isGenerating { return "sparkles" }
        switch state {
        case .connecting:
            return "waveform"
        case .listening:
            return "checkmark"
        case .readyToGenerate:
            return "doc.text.fill"
        case .failed:
            return "arrow.clockwise"
        default:
            return "mic.fill"
        }
    }

    private var primaryDisabled: Bool {
        isGenerating || state == .connecting || state == .speaking || (state == .readyToGenerate && !canGenerate)
    }

    private func primaryAction() {
        switch state {
        case .listening:
            onFinishAnswer()
        case .readyToGenerate:
            onCreateResume()
        case .failed:
            onAnswer()
        default:
            onAnswer()
        }
    }
}

private struct PrimaryCoachButton: View {
    let title: String
    let systemImage: String
    let isLoading: Bool
    let isDisabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: systemImage)
                }
                Text(title)
            }
            .font(.headline.weight(.bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 22)
            .frame(height: 64)
            .background(isDisabled ? Color.white.opacity(0.18) : Color.cvBrand)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
    }
}

private struct SecondaryCoachButton: View {
    let title: String
    let systemImage: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: systemImage)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .frame(height: 48)
                .background(Color.white.opacity(0.16))
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct CircleButton: View {
    let systemImage: String
    let background: Color
    let foreground: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.title3.weight(.bold))
                .foregroundStyle(foreground)
                .frame(width: 64, height: 64)
                .background(background)
                .clipShape(Circle())
        }
        .buttonStyle(.plain)
    }
}
