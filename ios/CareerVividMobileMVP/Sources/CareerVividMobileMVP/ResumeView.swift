import SwiftUI

// MARK: - Main Resume Tab

struct ResumeView: View {
    @StateObject private var store = ResumeEditorStore()
    @State private var editingResume: EditableResume? = nil
    @State private var coachErrorMessage: String? = nil
    @State private var showResumeCoach = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let message = statusMessage {
                        ResumeStatusBanner(message: message)
                    }

                    ForEach(store.resumes) { resume in
                        SwipeToDeleteResumeRow(
                            resume: resume,
                            onEdit: { editingResume = resume },
                            onDelete: { deleteResume(resume) }
                        )
                    }
                    ResumeCoachButton(
                        isProcessing: store.status == .creatingFromCoach,
                        action: openResumeCoach
                    )
                    AddResumeButton {
                        let blank = store.beginBlankDraft()
                        editingResume = blank
                    }
                }
                .padding(20)
                .padding(.bottom, CVLayout.floatingTabContentPadding)
            }
            .background(Color.cvSystemGroupedBackground.ignoresSafeArea())
            .navigationTitle("Resume")
        }
        .task {
            await store.loadIfNeeded()
        }
        .sheet(item: $editingResume) { editing in
            ResumeEditorView(resume: editing) { updated in
                store.save(updated)
                editingResume = nil
            } onCancel: {
                store.discardDraftIfEmpty(editing)
                editingResume = nil
            }
        }
        .resumeCoachPresentation(
            isPresented: $showResumeCoach,
            isGenerating: store.status == .creatingFromCoach,
            externalError: coachErrorMessage,
            onCancel: closeResumeCoach,
            onCreateResume: createResumeFromCoach
        )
    }

    private var statusMessage: String? {
        if let coachErrorMessage {
            return coachErrorMessage
        }
        if case .failed(let message) = store.status {
            return message
        }
        return nil
    }

    private func openResumeCoach() {
        coachErrorMessage = nil
        showResumeCoach = true
    }

    private func closeResumeCoach() {
        coachErrorMessage = nil
        showResumeCoach = false
    }

    private func createResumeFromCoach(_ transcript: String) {
        guard store.status != .creatingFromCoach else { return }
        Task {
            coachErrorMessage = nil
            if let created = await store.createResumeFromCoachTranscript(transcript) {
                showResumeCoach = false
                editingResume = created
            } else if case .failed(let message) = store.status {
                coachErrorMessage = message
            } else {
                coachErrorMessage = "Could not create a resume from this coaching session."
            }
        }
    }

    private func deleteResume(_ resume: EditableResume) {
        if editingResume?.id == resume.id {
            editingResume = nil
        }
        store.delete(resume)
    }
}

private extension View {
    @ViewBuilder
    func resumeCoachPresentation(
        isPresented: Binding<Bool>,
        isGenerating: Bool,
        externalError: String?,
        onCancel: @escaping () -> Void,
        onCreateResume: @escaping (String) -> Void
    ) -> some View {
        #if os(iOS)
        self.fullScreenCover(isPresented: isPresented) {
            ResumeCoachView(
                isGenerating: isGenerating,
                externalError: externalError,
                onCancel: onCancel,
                onCreateResume: onCreateResume
            )
        }
        #else
        self.sheet(isPresented: isPresented) {
            ResumeCoachView(
                isGenerating: isGenerating,
                externalError: externalError,
                onCancel: onCancel,
                onCreateResume: onCreateResume
            )
        }
        #endif
    }
}

// MARK: - Resume List Card

private struct SwipeToDeleteResumeRow: View {
    private let revealWidth: CGFloat = 92
    private let fullSwipeThreshold: CGFloat = 210

    let resume: EditableResume
    let onEdit: () -> Void
    let onDelete: () -> Void

    @State private var offset: CGFloat = 0
    @State private var isDeleting = false

    var body: some View {
        ZStack(alignment: .trailing) {
            deleteAction

            ResumeListCard(resume: resume, onEdit: handleEdit)
                .offset(x: offset)
                .gesture(swipeGesture)
                .animation(.spring(response: 0.28, dampingFraction: 0.82), value: offset)
                .allowsHitTesting(!isDeleting)
        }
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .accessibilityAction(named: "Delete") {
            deleteResume()
        }
    }

    private var deleteAction: some View {
        HStack {
            Spacer()
            Button(role: .destructive, action: deleteResume) {
                VStack(spacing: 4) {
                    Image(systemName: "trash.fill")
                        .font(.headline)
                    Text("Delete")
                        .font(.caption.weight(.bold))
                }
                .foregroundStyle(.white)
                .frame(width: revealWidth)
                .frame(maxHeight: .infinity)
                .background(Color.red)
            }
            .buttonStyle(.plain)
        }
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .opacity(offset < -1 ? 1 : 0)
    }

    private var swipeGesture: some Gesture {
        DragGesture(minimumDistance: 12, coordinateSpace: .local)
            .onChanged { value in
                guard abs(value.translation.width) > abs(value.translation.height) else { return }
                let baseOffset = offset == -revealWidth ? -revealWidth : 0
                let nextOffset = min(0, max(-UIScreen.main.bounds.width, baseOffset + value.translation.width))
                offset = nextOffset
            }
            .onEnded { value in
                guard abs(value.translation.width) > abs(value.translation.height) else { return }
                let projectedOffset = offset + value.predictedEndTranslation.width - value.translation.width
                if projectedOffset <= -fullSwipeThreshold || offset <= -fullSwipeThreshold {
                    deleteResume()
                } else if offset <= -(revealWidth * 0.45) {
                    offset = -revealWidth
                } else {
                    offset = 0
                }
            }
    }

    private func handleEdit() {
        guard offset == 0 else {
            offset = 0
            return
        }
        onEdit()
    }

    private func deleteResume() {
        guard !isDeleting else { return }
        isDeleting = true
        offset = -UIScreen.main.bounds.width
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.16) {
            onDelete()
        }
    }
}

private struct ResumeListCard: View {
    let resume: EditableResume
    let onEdit: () -> Void

    var body: some View {
        Button(action: onEdit) {
            HStack(spacing: 16) {
                TemplateThumb(templateID: resume.templateID, size: 54)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .stroke(Color.cvSeparator, lineWidth: 0.5)
                    )

                VStack(alignment: .leading, spacing: 4) {
                    Text(resume.personalInfo.name.isEmpty ? "Untitled Resume" : resume.personalInfo.name)
                        .font(.headline.weight(.bold))
                        .foregroundStyle(.primary)
                    Text(resume.personalInfo.title.isEmpty ? "No role set" : resume.personalInfo.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                    PillLabel(text: resume.templateID.rawValue, color: resume.templateID.accentColor)
                }

                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
            .frame(minHeight: 78)
            .cvCard(padding: 16, radius: 22)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Add Resume Button

private struct AddResumeButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: "plus")
                    .font(.headline.weight(.black))
                    .foregroundStyle(.white)
                    .frame(width: 30, height: 30)
                    .background(Color.cvBrand)
                    .clipShape(Circle())
                Text("Add new resume")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(Color.cvBrand)
                Spacer()
            }
            .padding(.horizontal, 18)
            .frame(height: 64)
        }
        .cvSecondaryActionButton()
    }
}

// MARK: - Resume Coach Button

private struct ResumeCoachButton: View {
    let isProcessing: Bool
    let action: () -> Void

    private var title: String {
        isProcessing ? "Creating resume..." : "Build with resume coach"
    }

    private var subtitle: String {
        "Answer a few live questions, then CareerVivid turns the transcript into an editable resume."
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(Color.cvBrandSoft)
                    Image(systemName: "sparkles")
                        .font(.headline.weight(.black))
                        .foregroundStyle(Color.cvBrand)
                }
                .frame(width: 48, height: 48)

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.headline.weight(.bold))
                        .foregroundStyle(.primary)
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                Spacer()

                if isProcessing {
                    ProgressView()
                } else {
                    Image(systemName: "mic.badge.plus")
                        .font(.headline)
                        .foregroundStyle(Color.cvBrand)
                }
            }
            .frame(minHeight: 72)
            .cvCard(padding: 16, radius: 22)
        }
        .buttonStyle(.plain)
        .disabled(isProcessing)
    }
}

// MARK: - Status Banner

private struct ResumeStatusBanner: View {
    let message: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)
            Text(message)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(3)
            Spacer()
        }
        .padding(14)
        .background(Color.orange.opacity(0.10))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

// MARK: - Template Thumbnail

struct TemplateThumb: View {
    let templateID: ResumeTemplateID
    var size: CGFloat = 72

    var body: some View {
        ZStack {
            Color.cvSystemBackground
            switch templateID {
            case .modern:
                VStack(spacing: 0) {
                    templateID.accentColor.frame(height: size * 0.32)
                    lineStack(size: size).padding(.top, size * 0.08)
                    Spacer(minLength: 0)
                }
            case .classic:
                HStack(spacing: 0) {
                    templateID.accentColor.frame(width: size * 0.16)
                    lineStack(size: size)
                        .padding(.leading, size * 0.1)
                        .padding(.top, size * 0.1)
                    Spacer(minLength: 0)
                }
            case .minimal:
                VStack(spacing: 0) {
                    templateID.accentColor.frame(height: size * 0.05)
                    lineStack(size: size).padding(.top, size * 0.12)
                    Spacer(minLength: 0)
                }
            }
        }
        .frame(width: size, height: size * 1.3)
        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }

    @ViewBuilder
    private func lineStack(size: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: size * 0.09) {
            ForEach(0..<4, id: \.self) { i in
                RoundedRectangle(cornerRadius: 1)
                    .fill(Color.cvSystemGray4)
                    .frame(width: size * (i == 0 ? 0.65 : 0.50), height: size * 0.06)
            }
        }
        .padding(.horizontal, size * 0.1)
    }
}

// MARK: - Resume Editor

struct ResumeEditorView: View {
    @State var resume: EditableResume
    let onSave: (EditableResume) -> Void
    let onCancel: () -> Void

    @State private var editingExp: WorkExperience? = nil
    @State private var editingEdu: EducationEntry? = nil
    @State private var newSkill = ""

    // Export (iOS only — UIActivityViewController is not available on macOS)
    #if os(iOS)
    @State private var isExporting  = false
    @State private var exportURL:  URL? = nil
    @State private var showShare   = false
    @State private var exportError: String? = nil
    #endif

    var body: some View {
        NavigationStack {
            Form {

                // Template picker
                Section("Template") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 14) {
                            ForEach(ResumeTemplateID.allCases) { tmpl in
                                TemplateOption(
                                    templateID: tmpl,
                                    isSelected: resume.templateID == tmpl
                                ) { resume.templateID = tmpl }
                            }
                        }
                        .padding(.vertical, 10)
                    }
                    .listRowInsets(EdgeInsets(top: 0, leading: 16, bottom: 0, trailing: 16))
                }

                // Personal Info
                Section("Personal Info") {
                    LabeledField("Name",     text: $resume.personalInfo.name)
                    LabeledField("Role",     text: $resume.personalInfo.title)
                    LabeledField("Email",    text: $resume.personalInfo.email)
                    LabeledField("Phone",    text: $resume.personalInfo.phone)
                    LabeledField("Location", text: $resume.personalInfo.location)
                    LabeledField("LinkedIn", text: $resume.personalInfo.linkedin)
                }

                // Summary
                Section("Summary") {
                    TextEditor(text: $resume.summary)
                        .font(.subheadline)
                        .frame(minHeight: 80)
                }

                // Experience
                Section {
                    ForEach(resume.experiences.indices, id: \.self) { idx in
                        Button { editingExp = resume.experiences[idx] } label: {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(resume.experiences[idx].role.isEmpty
                                     ? "Untitled role"
                                     : resume.experiences[idx].role)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.primary)
                                Text(resume.experiences[idx].company.isEmpty
                                     ? "Company"
                                     : resume.experiences[idx].company)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete { resume.experiences.remove(atOffsets: $0) }

                    Button {
                        editingExp = WorkExperience()
                    } label: {
                        Label("Add Experience", systemImage: "plus.circle")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.cvBrand)
                    }
                } header: { Text("Experience") }

                // Education
                Section {
                    ForEach(resume.education.indices, id: \.self) { idx in
                        Button { editingEdu = resume.education[idx] } label: {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(resume.education[idx].school.isEmpty
                                     ? "School"
                                     : resume.education[idx].school)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.primary)
                                Text(resume.education[idx].degree.isEmpty
                                     ? "Degree"
                                     : resume.education[idx].degree)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                    .onDelete { resume.education.remove(atOffsets: $0) }

                    Button {
                        editingEdu = EducationEntry()
                    } label: {
                        Label("Add Education", systemImage: "plus.circle")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.cvBrand)
                    }
                } header: { Text("Education") }

                // Skills
                Section("Skills") {
                    if !resume.skills.isEmpty {
                        LazyVGrid(
                            columns: [GridItem(.adaptive(minimum: 80))],
                            spacing: 6
                        ) {
                            ForEach(resume.skills.indices, id: \.self) { idx in
                                SkillChip(text: resume.skills[idx]) {
                                    resume.skills.remove(at: idx)
                                }
                            }
                        }
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    }
                    HStack {
                        TextField("Add a skill…", text: $newSkill)
                            .font(.subheadline)
                        Button("Add") {
                            let s = newSkill.trimmingCharacters(in: .whitespaces)
                            if !s.isEmpty { resume.skills.append(s); newSkill = "" }
                        }
                        .disabled(newSkill.trimmingCharacters(in: .whitespaces).isEmpty)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.cvBrand)
                    }
                }
            }
            .navigationTitle("Edit Resume")
            .cvInlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .cvTopBarLeading) {
                    Button("Cancel", action: onCancel).foregroundStyle(.secondary)
                }
                ToolbarItem(placement: .cvTopBarTrailing) {
                    HStack(spacing: 14) {
                        #if os(iOS)
                        // Export / share button
                        if isExporting {
                            ProgressView().scaleEffect(0.85)
                        } else {
                            Button {
                                exportPDF()
                            } label: {
                                Image(systemName: "square.and.arrow.up")
                                    .foregroundStyle(Color.cvBrand)
                            }
                        }
                        #endif
                        Button("Save") { onSave(resume) }
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(Color.cvBrand)
                    }
                }
            }
            #if os(iOS)
            // Export error banner
            .alert("Export failed", isPresented: Binding(
                get: { exportError != nil },
                set: { if !$0 { exportError = nil } }
            )) {
                Button("OK", role: .cancel) { exportError = nil }
            } message: {
                Text(exportError ?? "")
            }
            // iOS share sheet
            .sheet(isPresented: $showShare, onDismiss: {
                // Clean up temp file after share sheet is dismissed
                if let url = exportURL {
                    try? FileManager.default.removeItem(at: url)
                    exportURL = nil
                }
            }) {
                if let url = exportURL {
                    ResumeShareSheet(items: [url])
                }
            }
            #endif
            .sheet(item: $editingExp) { exp in
                ExperienceEditorSheet(experience: exp) { updated in
                    if let idx = resume.experiences.firstIndex(where: { $0.id == updated.id }) {
                        resume.experiences[idx] = updated
                    } else {
                        resume.experiences.append(updated)
                    }
                    editingExp = nil
                } onCancel: { editingExp = nil }
            }
            .sheet(item: $editingEdu) { edu in
                EducationEditorSheet(entry: edu) { updated in
                    if let idx = resume.education.firstIndex(where: { $0.id == updated.id }) {
                        resume.education[idx] = updated
                    } else {
                        resume.education.append(updated)
                    }
                    editingEdu = nil
                } onCancel: { editingEdu = nil }
            }
        }
    }

    // MARK: - Export

    #if os(iOS)
    private func exportPDF() {
        isExporting = true
        Task {
            do {
                let url = try await ResumePDFExport.exportURL(for: resume)
                exportURL  = url
                showShare  = true
            } catch {
                exportError = error.localizedDescription
            }
            isExporting = false
        }
    }
    #endif
}

// MARK: - Template Option (picker chip)

private struct TemplateOption: View {
    let templateID: ResumeTemplateID
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 6) {
                TemplateThumb(templateID: templateID, size: 60)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(
                                isSelected ? templateID.accentColor : Color.cvSeparator,
                                lineWidth: isSelected ? 2.5 : 0.5
                            )
                    )
                Text(templateID.rawValue)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(isSelected ? templateID.accentColor : .secondary)
            }
        }
        .buttonStyle(.plain)
        .animation(.easeInOut(duration: 0.15), value: isSelected)
    }
}

// MARK: - Labeled Text Field

private struct LabeledField: View {
    let label: String
    @Binding var text: String

    init(_ label: String, text: Binding<String>) {
        self.label = label
        self._text = text
    }

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(width: 72, alignment: .leading)
            TextField(label, text: $text)
                .font(.subheadline)
        }
    }
}

// MARK: - Skill Chip

private struct SkillChip: View {
    let text: String
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 4) {
            Text(text).font(.caption.weight(.semibold))
            Button(action: onDelete) {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Color.cvBrandSoft)
        .foregroundStyle(Color.cvBrand)
        .clipShape(Capsule())
    }
}

// MARK: - Experience Editor Sheet

private struct ExperienceEditorSheet: View {
    @State var experience: WorkExperience
    let onSave: (WorkExperience) -> Void
    let onCancel: () -> Void
    @State private var bulletsText = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Role") {
                    TextField("Company name", text: $experience.company)
                    TextField("Your title / role", text: $experience.role)
                    TextField("Period  e.g. 2022 – 2024", text: $experience.period)
                }
                Section("Bullet points — one per line") {
                    TextEditor(text: $bulletsText)
                        .font(.subheadline)
                        .frame(minHeight: 120)
                }
            }
            .onAppear { bulletsText = experience.bullets.joined(separator: "\n") }
            .navigationTitle("Experience")
            .cvInlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .cvTopBarLeading) {
                    Button("Cancel", action: onCancel).foregroundStyle(.secondary)
                }
                ToolbarItem(placement: .cvTopBarTrailing) {
                    Button("Save") {
                        experience.bullets = bulletsText
                            .components(separatedBy: "\n")
                            .map { $0.trimmingCharacters(in: .whitespaces) }
                            .filter { !$0.isEmpty }
                        onSave(experience)
                    }
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Color.cvBrand)
                }
            }
        }
    }
}

// MARK: - Education Editor Sheet

private struct EducationEditorSheet: View {
    @State var entry: EducationEntry
    let onSave: (EducationEntry) -> Void
    let onCancel: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Education") {
                    TextField("School / University", text: $entry.school)
                    TextField("Degree", text: $entry.degree)
                    TextField("Year  e.g. 2020", text: $entry.year)
                }
            }
            .navigationTitle("Education")
            .cvInlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .cvTopBarLeading) {
                    Button("Cancel", action: onCancel).foregroundStyle(.secondary)
                }
                ToolbarItem(placement: .cvTopBarTrailing) {
                    Button("Save") { onSave(entry) }
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Color.cvBrand)
                }
            }
        }
    }
}

// MARK: - Share Sheet (wraps UIActivityViewController)

#if os(iOS)
private struct ResumeShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}
#endif
