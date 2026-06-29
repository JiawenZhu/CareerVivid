import SwiftUI
#if os(iOS)
import PhotosUI
import UIKit
import Vision
import VisionKit
#endif

// DocumentChecklistView — required documents checklist filtered by visa type (Feature #3)
struct DocumentChecklistView: View {
    @AppStorage("selectedVisaType") private var selectedVisaTypeRaw: String = VisaType.b1b2.rawValue
    @AppStorage("checkedDocumentIds") private var checkedIdsRaw: String = ""
    @AppStorage("preferredLanguage") private var langRaw: String = AppLanguage.english.rawValue
    @State private var showDocumentScanner = false
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var analysisResult: DocumentAnalysisResult?
    @State private var analysisError: String?
    @State private var isAnalyzingDocument = false
    @State private var verificationRequest: DocumentVerificationRequest?
    @State private var activeVerificationItem: DocumentItem?
    @State private var replacementCandidate: DocumentItem?
    @State private var showReplacementConfirmation = false

    private var visaType: VisaType {
        VisaType(rawValue: selectedVisaTypeRaw) ?? .b1b2
    }

    private var language: AppLanguage {
        AppLanguage(rawValue: langRaw) ?? .english
    }

    private var checkedIds: Set<String> {
        Set(checkedIdsRaw.components(separatedBy: ",").filter { !$0.isEmpty })
    }

    private var allDocs: [DocumentItem] {
        VisaSampleData.documents.filter { $0.visaTypes.contains(visaType) }
    }

    private var grouped: [(group: String, items: [DocumentItem])] {
        // Preserve a logical group order
        let order = ["Identity & Application", "University Documents", "Program Documents",
                     "Petition Documents", "Financial Documents", "Academic Records",
                     "Employment Documents", "Ties to Home", "Travel Documents"]
        let dict = Dictionary(grouping: allDocs, by: \.localizedGroup)
        let localizedOrder = order.map { VisaTranslations.uiString($0) }
        let sorted = localizedOrder.compactMap { g in dict[g].map { (group: g, items: $0) } }
        // Append any groups not in order list
        let covered = Set(localizedOrder)
        let extra = dict.keys.filter { !covered.contains($0) }.sorted().compactMap { g in dict[g].map { (group: g, items: $0) } }
        return sorted + extra
    }

    private var checkedCount: Int { allDocs.filter { checkedIds.contains($0.id.uuidString) }.count }

    private func setReady(_ id: UUID) {
        var ids = checkedIds
        ids.insert(id.uuidString)
        checkedIdsRaw = ids.joined(separator: ",")
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.cvAppBackground.ignoresSafeArea()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        ChecklistProgressCard(
                            visaType: visaType,
                            checked: checkedCount,
                            total: allDocs.count,
                            language: language
                        )

                        DocumentCaptureCard(
                            isAnalyzing: isAnalyzingDocument,
                            result: analysisResult,
                            errorMessage: analysisError,
                            onScan: startDocumentScan,
                            onClear: clearAnalysis,
                            selectedPhotoItem: $selectedPhotoItem,
                            language: language
                        )

                        ForEach(grouped, id: \.group) { section in
                            ChecklistSection(
                                title: section.group,
                                items: section.items,
                                checkedIds: checkedIds,
                                onVerify: requestVerification
                            )
                        }

                        if checkedCount > 0 {
                            Button {
                                cvImpactHaptic(.medium)
                                withAnimation { checkedIdsRaw = "" }
                            } label: {
                                Label(VisaTranslations.uiString("Reset Checklist"), systemImage: "arrow.counterclockwise")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.top, 4)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    .padding(.bottom, CVLayout.floatingTabContentPadding)
                }
            }
            .navigationTitle(VisaTranslations.uiString("Document Checklist"))
            .cvInlineNavigationTitle()
            #if os(iOS)
            .sheet(isPresented: $showDocumentScanner) {
                DocumentCameraScannerView { images in
                    showDocumentScanner = false
                    analyzeImages(images)
                } onCancel: {
                    showDocumentScanner = false
                }
                .ignoresSafeArea()
            }
            .sheet(item: $verificationRequest) { request in
                DocumentVerificationSheet(
                    item: request.item,
                    isReplacing: request.isReplacing,
                    selectedPhotoItem: $selectedPhotoItem,
                    onUpload: {
                        activeVerificationItem = request.item
                    },
                    onScan: {
                        activeVerificationItem = request.item
                        verificationRequest = nil
                        startDocumentScan()
                    },
                    onCancel: {
                        verificationRequest = nil
                        activeVerificationItem = nil
                    },
                    language: language
                )
            }
            .confirmationDialog(
                VisaTranslations.uiString("Verified document already attached", language: language),
                isPresented: $showReplacementConfirmation,
                titleVisibility: .visible,
                presenting: replacementCandidate
            ) { item in
                Button(VisaTranslations.uiString("Replace verified document", language: language)) {
                    cvImpactHaptic(.medium)
                    verificationRequest = DocumentVerificationRequest(item: item, isReplacing: true)
                }
                Button(VisaTranslations.uiString("Keep current document", language: language), role: .cancel) {
                    replacementCandidate = nil
                    activeVerificationItem = nil
                }
            } message: { item in
                Text(String(
                    format: VisaTranslations.uiString("A verified document is already attached for %@. Would you like to upload a replacement for review?", language: language),
                    VisaTranslations.uiString(item.name, language: language)
                ))
            }
            .onChange(of: selectedPhotoItem) { _, newItem in
                guard let newItem else { return }
                loadPhotoItem(newItem)
            }
            #endif
        }
    }

    private func startDocumentScan() {
        cvImpactHaptic(.light)
        #if os(iOS)
        guard VNDocumentCameraViewController.isSupported else {
            analysisError = VisaTranslations.uiString("Document camera is not available on this device.", language: language)
            return
        }
        showDocumentScanner = true
        #else
        analysisError = VisaTranslations.uiString("Document camera is not available on this device.", language: language)
        #endif
    }

    private func requestVerification(for item: DocumentItem, isChecked: Bool) {
        cvImpactHaptic(.light)
        if isChecked {
            replacementCandidate = item
            showReplacementConfirmation = true
        } else {
            verificationRequest = DocumentVerificationRequest(item: item, isReplacing: false)
        }
    }

    private func clearAnalysis() {
        cvImpactHaptic(.light)
        withAnimation(.spring(response: 0.36, dampingFraction: 0.82)) {
            analysisResult = nil
            analysisError = nil
        }
    }

    #if os(iOS)
    private func loadPhotoItem(_ item: PhotosPickerItem) {
        isAnalyzingDocument = true
        analysisError = nil
        Task {
            do {
                guard let data = try await item.loadTransferable(type: Data.self),
                      let image = UIImage(data: data) else {
                    await MainActor.run {
                        isAnalyzingDocument = false
                        analysisError = VisaTranslations.uiString("We could not read that image. Try scanning the document instead.", language: language)
                    }
                    return
                }
                await analyzeImagesAsync([image])
                await MainActor.run {
                    selectedPhotoItem = nil
                    verificationRequest = nil
                }
            } catch {
                await MainActor.run {
                    isAnalyzingDocument = false
                    analysisError = error.localizedDescription
                    selectedPhotoItem = nil
                }
            }
        }
    }

    private func analyzeImages(_ images: [UIImage]) {
        isAnalyzingDocument = true
        analysisError = nil
        Task { await analyzeImagesAsync(images) }
    }

    private func analyzeImagesAsync(_ images: [UIImage]) async {
        do {
            let recognizedText = try await LocalDocumentOCR.recognizeText(in: images)
            let result = VisaDocumentAnalyzer.analyze(
                recognizedText: recognizedText,
                visaType: visaType,
                checklist: allDocs
            )
            await MainActor.run {
                withAnimation(.spring(response: 0.42, dampingFraction: 0.82)) {
                    analysisResult = result
                    isAnalyzingDocument = false
                    markMatchedItemsReady(result.matchedChecklistItems, target: activeVerificationItem ?? verificationRequest?.item)
                    activeVerificationItem = nil
                }
            }
        } catch {
            await MainActor.run {
                isAnalyzingDocument = false
                analysisError = error.localizedDescription
                activeVerificationItem = nil
            }
        }
    }
    #endif

    private func markMatchedItemsReady(_ names: [String], target: DocumentItem? = nil) {
        guard !names.isEmpty else { return }
        if let target {
            guard names.contains(target.name) else {
                analysisError = String(
                    format: VisaTranslations.uiString("The uploaded document does not match %@. Please upload the correct document for this checklist item.", language: language),
                    VisaTranslations.uiString(target.name, language: language)
                )
                return
            }
            setReady(target.id)
            return
        }
        var ids = checkedIds
        for item in allDocs where names.contains(item.name) {
            ids.insert(item.id.uuidString)
        }
        checkedIdsRaw = ids.joined(separator: ",")
    }
}

private struct DocumentVerificationRequest: Identifiable {
    let id = UUID()
    let item: DocumentItem
    let isReplacing: Bool
}

// MARK: - Progress Card

private struct ChecklistProgressCard: View {
    let visaType: VisaType
    let checked: Int
    let total: Int
    let language: AppLanguage

    private var fraction: Double { total > 0 ? Double(checked) / Double(total) : 0 }
    private var isComplete: Bool { checked == total && total > 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(VisaTranslations.uiString("Documents for", language: language)) \(visaType.rawValue)")
                        .font(.headline.weight(.bold))
                    Text(isComplete
                         ? VisaTranslations.uiString("All documents gathered — you're ready!", language: language)
                         : "\(total - checked) \(VisaTranslations.uiString("remaining to collect", language: language))")
                        .font(.caption)
                        .foregroundStyle(isComplete ? Color.cvGreen : .secondary)
                }
                Spacer()
                ScoreRing(score: Int(fraction * 100), label: "done", size: 64)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.cvSystemFill).frame(height: 8)
                    Capsule()
                        .fill(isComplete
                              ? AnyShapeStyle(Color.cvGreen)
                              : AnyShapeStyle(LinearGradient.cvBrandGradient))
                        .frame(width: max(0, geo.size.width * fraction), height: 8)
                        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: fraction)
                }
            }
            .frame(height: 8)

            Text(String(format: VisaTranslations.uiString("%d of %d documents ready", language: language), checked, total))
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .cvCard(padding: 18, radius: 22, raised: true)
    }
}

// MARK: - Document Capture

private struct DocumentCaptureCard: View {
    let isAnalyzing: Bool
    let result: DocumentAnalysisResult?
    let errorMessage: String?
    let onScan: () -> Void
    let onClear: () -> Void
    @Binding var selectedPhotoItem: PhotosPickerItem?
    let language: AppLanguage

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "doc.viewfinder.fill")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(Color.cvBrand)
                    .frame(width: 42, height: 42)
                    .background(Color.cvBrandSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                VStack(alignment: .leading, spacing: 4) {
                    Text(VisaTranslations.uiString("Scan a visa document", language: language))
                        .font(.headline.weight(.black))
                    Text(VisaTranslations.uiString("Use on-device OCR to classify files, extract fields, and update your checklist.", language: language))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer()
            }

            HStack(spacing: 10) {
                Button(action: onScan) {
                    Label(VisaTranslations.uiString("Scan", language: language), systemImage: "camera.viewfinder")
                        .font(.subheadline.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .cvPrimaryActionButton()
                .disabled(isAnalyzing)

                #if os(iOS)
                PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                    Label(VisaTranslations.uiString("Upload", language: language), systemImage: "photo.on.rectangle.angled")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Color.cvBrand)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.cvBrandSoft)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .disabled(isAnalyzing)
                #endif
            }

            if isAnalyzing {
                DocumentAnalysisLoadingRow(language: language)
            }

            if let errorMessage {
                DocumentAnalysisWarningRow(message: errorMessage, color: .cvBrand)
            }

            if let result {
                DocumentAnalysisResultView(result: result, onClear: onClear, language: language)
            }
        }
        .cvCard(padding: 18, radius: 22, raised: true)
    }
}

private struct DocumentVerificationSheet: View {
    let item: DocumentItem
    let isReplacing: Bool
    @Binding var selectedPhotoItem: PhotosPickerItem?
    let onUpload: () -> Void
    let onScan: () -> Void
    let onCancel: () -> Void
    let language: AppLanguage

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 8) {
                    Image(systemName: isReplacing ? "arrow.triangle.2.circlepath.camera" : "doc.viewfinder.fill")
                        .font(.title2.weight(.black))
                        .foregroundStyle(Color.cvBrand)
                        .frame(width: 52, height: 52)
                        .background(Color.cvBrandSoft)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))

                    Text(VisaTranslations.uiString(isReplacing ? "Replace verified document" : "Verify checklist document", language: language))
                        .font(.title3.weight(.black))
                        .foregroundStyle(Color.cvInk)

                    Text(String(
                        format: VisaTranslations.uiString("Upload or scan %@. CareerVivid will read the document on device and check it off only after it matches this checklist item.", language: language),
                        VisaTranslations.uiString(item.name, language: language)
                    ))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                }

                VStack(spacing: 12) {
                    Button(action: onScan) {
                        Label(VisaTranslations.uiString("Scan with camera", language: language), systemImage: "camera.viewfinder")
                            .font(.headline.weight(.bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .cvPrimaryActionButton()

                    PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                        Label(VisaTranslations.uiString("Upload from Photos", language: language), systemImage: "photo.on.rectangle.angled")
                            .font(.headline.weight(.bold))
                            .foregroundStyle(Color.cvBrand)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.cvBrandSoft)
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                    .simultaneousGesture(TapGesture().onEnded { _ in onUpload() })
                }

                Text(VisaTranslations.uiString("Your previous verified status will remain unless the replacement is successfully verified.", language: language))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.cvSecondarySystemBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                Spacer(minLength: 0)
            }
            .padding(22)
            .background(Color.cvAppBackground.ignoresSafeArea())
            .navigationTitle(VisaTranslations.uiString(item.name, language: language))
            .cvInlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(VisaTranslations.uiString("Cancel", language: language), action: onCancel)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

private struct DocumentAnalysisLoadingRow: View {
    let language: AppLanguage

    var body: some View {
        HStack(spacing: 12) {
            ProgressView()
                .tint(Color.cvBrand)
            VStack(alignment: .leading, spacing: 2) {
                Text(VisaTranslations.uiString("Reading document locally", language: language))
                    .font(.subheadline.weight(.bold))
                Text(VisaTranslations.uiString("Apple Vision is extracting text on this device.", language: language))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(12)
        .background(Color.cvBrandSofter)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct DocumentAnalysisResultView: View {
    let result: DocumentAnalysisResult
    let onClear: () -> Void
    let language: AppLanguage

    private var percent: Int {
        Int((result.confidence * 100).rounded())
    }

    private var matchedCurrentChecklist: Bool {
        !result.matchedChecklistItems.isEmpty
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .center, spacing: 12) {
                ScoreRing(score: percent, label: VisaTranslations.uiString("confidence", language: language), size: 58)
                VStack(alignment: .leading, spacing: 3) {
                    Text(VisaTranslations.uiString(result.documentType, language: language))
                        .font(.headline.weight(.black))
                    Text(VisaTranslations.uiString(
                        matchedCurrentChecklist ? "Document type detected" : "Not in current checklist",
                        language: language
                    ))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(matchedCurrentChecklist ? Color.cvGreen : Color.cvBrand)
                }
                Spacer()
                Button(action: onClear) {
                    Image(systemName: "xmark")
                        .font(.caption.weight(.black))
                        .foregroundStyle(Color.cvInkTertiary)
                        .frame(width: 30, height: 30)
                        .background(Color.cvSecondarySystemBackground)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }

            if !result.matchedChecklistItems.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text(VisaTranslations.uiString("Checklist updated", language: language))
                        .font(.caption.weight(.black))
                        .foregroundStyle(Color.cvGreen)
                    ForEach(result.matchedChecklistItems, id: \.self) { item in
                        Label(VisaTranslations.uiString(item, language: language), systemImage: "checkmark.circle.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Color.cvGreen)
                    }
                }
            }

            if !result.extractedFields.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text(VisaTranslations.uiString("Extracted fields", language: language))
                        .font(.caption.weight(.black))
                        .foregroundStyle(Color.cvInkSecondary)
                    ForEach(result.extractedFields.sorted(by: { $0.key < $1.key }), id: \.key) { key, value in
                        HStack(alignment: .firstTextBaseline) {
                            Text(VisaTranslations.uiString(key, language: language))
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                            Spacer(minLength: 12)
                            Text(value)
                                .font(.caption.weight(.bold))
                                .foregroundStyle(Color.cvInk)
                                .multilineTextAlignment(.trailing)
                        }
                    }
                }
            }

            ForEach(result.missingFields, id: \.self) { field in
                DocumentAnalysisWarningRow(
                    message: String(format: VisaTranslations.uiString("Missing field: %@", language: language), VisaTranslations.uiString(field, language: language)),
                    color: .cvYellow
                )
            }

            ForEach(result.warnings, id: \.self) { warning in
                DocumentAnalysisWarningRow(message: VisaTranslations.uiString(warning, language: language), color: .cvBrand)
            }

            DisclosureGroup {
                Text(result.recognizedText.isEmpty ? VisaTranslations.uiString("No recognized text.", language: language) : result.recognizedText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 8)
            } label: {
                Text(VisaTranslations.uiString("Recognized text", language: language))
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Color.cvBrand)
            }
        }
        .padding(14)
        .background(Color.cvTertiarySystemBackground)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct DocumentAnalysisWarningRow: View {
    let message: String
    let color: Color

    var body: some View {
        Label(message, systemImage: "exclamationmark.triangle.fill")
            .font(.caption.weight(.semibold))
            .foregroundStyle(color)
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(color.opacity(0.10))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

// MARK: - Section

private struct ChecklistSection: View {
    let title: String
    let items: [DocumentItem]
    let checkedIds: Set<String>
    let onVerify: (DocumentItem, Bool) -> Void

    private var sectionChecked: Int { items.filter { checkedIds.contains($0.id.uuidString) }.count }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(title)
                    .font(.caption.weight(.black))
                    .foregroundStyle(Color.cvInkSecondary)
                    .textCase(.uppercase)
                    .tracking(0.5)
                Spacer()
                Text("\(sectionChecked)/\(items.count)")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(sectionChecked == items.count ? Color.cvGreen : Color.cvInkTertiary)
            }
            .padding(.horizontal, 4)

            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.element.id) { idx, item in
                    ChecklistRow(
                        item: item,
                        isChecked: checkedIds.contains(item.id.uuidString),
                        onVerify: { onVerify(item, checkedIds.contains(item.id.uuidString)) }
                    )
                    if idx < items.count - 1 {
                        Divider().padding(.leading, 56)
                    }
                }
            }
            .background(Color.cvSurface)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Color.cvHairline.opacity(0.6), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.04), radius: 12, x: 0, y: 4)
        }
    }
}

// MARK: - Row

private struct ChecklistRow: View {
    let item: DocumentItem
    let isChecked: Bool
    let onVerify: () -> Void

    var body: some View {
        Button {
            cvImpactHaptic(.light)
            onVerify()
        } label: {
            HStack(spacing: 14) {
                // Checkbox circle
                ZStack {
                    if isChecked {
                        Circle().fill(Color.cvGreen)
                        Image(systemName: "checkmark")
                            .font(.caption2.weight(.black))
                            .foregroundStyle(.white)
                    } else {
                        Circle().stroke(Color.cvHairline, lineWidth: 1.5)
                    }
                }
                .frame(width: 26, height: 26)

                VStack(alignment: .leading, spacing: 2) {
                    Text(item.localizedName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(isChecked ? Color.cvInkTertiary : .primary)
                        .strikethrough(isChecked, color: Color.cvInkTertiary)
                    Text(item.localizedDetail)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 13)
            .background(isChecked ? Color.cvGreenSoft.opacity(0.5) : Color.cvSurface)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

#if os(iOS)
// MARK: - Native Document Camera

private struct DocumentCameraScannerView: UIViewControllerRepresentable {
    let onScan: ([UIImage]) -> Void
    let onCancel: () -> Void

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let controller = VNDocumentCameraViewController()
        controller.delegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onScan: onScan, onCancel: onCancel)
    }

    final class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let onScan: ([UIImage]) -> Void
        let onCancel: () -> Void

        init(onScan: @escaping ([UIImage]) -> Void, onCancel: @escaping () -> Void) {
            self.onScan = onScan
            self.onCancel = onCancel
        }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFinishWith scan: VNDocumentCameraScan) {
            var images: [UIImage] = []
            for page in 0..<scan.pageCount {
                images.append(scan.imageOfPage(at: page))
            }
            onScan(images)
        }

        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
            onCancel()
        }

        func documentCameraViewController(_ controller: VNDocumentCameraViewController, didFailWithError error: Error) {
            onCancel()
        }
    }
}

// MARK: - Local OCR

private enum LocalDocumentOCRError: LocalizedError {
    case noImageData
    case noTextDetected

    var errorDescription: String? {
        switch self {
        case .noImageData:
            return "The selected image could not be prepared for text recognition."
        case .noTextDetected:
            return "No readable text was detected. Try a sharper image with the full page visible."
        }
    }
}

private enum LocalDocumentOCR {
    static func recognizeText(in images: [UIImage]) async throws -> String {
        var pageTexts: [String] = []

        for image in images {
            guard let cgImage = image.ocrPreparedCGImage else {
                throw LocalDocumentOCRError.noImageData
            }
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            // Visa documents are usually issued in English. Keeping OCR language
            // hints narrow makes Vision more reliable on simulator and older OSes.
            request.recognitionLanguages = ["en-US"]

            let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up)
            try handler.perform([request])

            let lines = (request.results ?? [])
                .compactMap { observation in
                    observation.topCandidates(1).first?.string
                }
                .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

            if !lines.isEmpty {
                pageTexts.append(lines.joined(separator: "\n"))
            }
        }

        let text = pageTexts.joined(separator: "\n\n")
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw LocalDocumentOCRError.noTextDetected
        }
        return text
    }
}

private extension UIImage {
    var ocrPreparedCGImage: CGImage? {
        let maxSide: CGFloat = 2200
        let scaleFactor = min(1, maxSide / max(size.width, size.height))
        let targetSize = CGSize(width: size.width * scaleFactor, height: size.height * scaleFactor)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = true
        let renderer = UIGraphicsImageRenderer(size: targetSize, format: format)
        return renderer.image { context in
            UIColor.white.setFill()
            context.fill(CGRect(origin: .zero, size: targetSize))
            draw(in: CGRect(origin: .zero, size: targetSize))
        }.cgImage
    }
}
#endif
