import SwiftUI

// VisaHomeView — main dashboard for Visa Interview Prep app (Features 7 + 8 integrated)
struct VisaHomeView: View {
    @AppStorage("selectedVisaType")   private var selectedVisaTypeRaw: String = VisaType.b1b2.rawValue
    @AppStorage("checkedDocumentIds") private var checkedIdsRaw: String = ""
    @AppStorage("preferredLanguage")  private var langRaw: String = AppLanguage.english.rawValue

    @State private var showHistory: Bool = false
    @State private var historyEntries: [ReadinessEntry] = []

    private var selectedVisaType: VisaType { VisaType(rawValue: selectedVisaTypeRaw) ?? .b1b2 }
    private var language: AppLanguage { AppLanguage(rawValue: langRaw) ?? .english }

    private var filteredDocs: [DocumentItem] {
        VisaSampleData.documents.filter { $0.visaTypes.contains(selectedVisaType) }
    }
    private var checkedIds: Set<String> {
        Set(checkedIdsRaw.components(separatedBy: ",").filter { !$0.isEmpty })
    }
    private var checkedCount: Int { filteredDocs.filter { checkedIds.contains($0.id.uuidString) }.count }
    private var totalDocs: Int { filteredDocs.count }
    private var totalQuestions: Int { VisaSampleData.questions.filter { $0.visaTypes.contains(selectedVisaType) }.count }

    private var readinessScore: Double {
        let docScore = totalDocs > 0 ? Double(checkedCount) / Double(totalDocs) : 0
        let qScore   = Double(min(totalQuestions, 10)) / Double(max(totalQuestions, 1))
        return min(1.0, docScore * 0.7 + qScore * 0.3)
    }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    VisaDashboardGreeting(visaType: selectedVisaType, language: language)
                    LanguageSelectorCard(selectedLangRaw: $langRaw)
                    VisaTypeSelectorCard(selectedVisaTypeRaw: $selectedVisaTypeRaw, language: language)
                    VisaReadinessCard(
                        language: language,
                        visaType: selectedVisaType,
                        docsChecked: checkedCount,
                        totalDocs: totalDocs,
                        totalQuestions: totalQuestions,
                        recentEntries: Array(historyEntries.suffix(7)),
                        onShowHistory: { showHistory = true }
                    )
                    VisaQuickStatsRow(language: language, docsChecked: checkedCount, totalDocs: totalDocs, totalQuestions: totalQuestions)
                    VisaTodayFocusCard(language: language, visaType: selectedVisaType, docsChecked: checkedCount, totalDocs: totalDocs)
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, CVLayout.floatingTabContentPadding)
            }
            .background(Color.cvSystemGroupedBackground.ignoresSafeArea())
            .navigationBarHidden(true)
            .onAppear(perform: recordAndLoadHistory)
            .sheet(isPresented: $showHistory) {
                ReadinessHistoryView()
                    .presentationDetents([.large])
            }
        }
    }

    private func recordAndLoadHistory() {
        let entry = ReadinessEntry(
            score: readinessScore,
            visaType: selectedVisaType.rawValue,
            docsChecked: checkedCount,
            totalDocs: totalDocs,
            questionsReviewed: totalQuestions
        )
        ReadinessHistory.record(entry)
        historyEntries = ReadinessHistory.recent(count: 14)
            .filter { $0.visaType == selectedVisaType.rawValue }
    }
}

// MARK: - Language Selector Card (Feature 8)

private struct LanguageSelectorCard: View {
    @Binding var selectedLangRaw: String

    private var selected: AppLanguage { AppLanguage(rawValue: selectedLangRaw) ?? .english }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(VisaTranslations.uiString("Interview Language", language: selected))
                    .font(.headline.weight(.bold))
                Spacer()
                Text(VisaTranslations.uiString("Affects questions & answers", language: selected))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(AppLanguage.allCases) { lang in
                        LanguagePill(lang: lang, isSelected: selected == lang) {
                            cvImpactHaptic(.light)
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.78)) {
                                selectedLangRaw = lang.rawValue
                            }
                        }
                    }
                }
                .padding(.horizontal, 2)
            }
        }
        .cvCard(padding: 16, radius: 20, raised: true)
    }
}

private struct LanguagePill: View {
    let lang: AppLanguage
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 6) {
                Text(lang.flag).font(.subheadline)
                Text(lang.rawValue)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(isSelected ? .white : .primary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? AnyShapeStyle(LinearGradient.cvBrandGradient) : AnyShapeStyle(Color.cvTertiarySystemBackground))
            .clipShape(Capsule())
            .overlay(
                Capsule().stroke(isSelected ? Color.clear : Color.cvHairline.opacity(0.6), lineWidth: 1)
            )
            .shadow(color: isSelected ? Color.cvBrand.opacity(0.25) : .clear, radius: 8, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Greeting Header

private struct VisaDashboardGreeting: View {
    let visaType: VisaType
    let language: AppLanguage

    private var greeting: String {
        let h = Calendar.current.component(.hour, from: Date())
        if h < 12 { return VisaTranslations.uiString("Good Morning", language: language) }
        if h < 17 { return VisaTranslations.uiString("Good Afternoon", language: language) }
        return VisaTranslations.uiString("Good Evening", language: language)
    }

    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text(greeting)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(VisaTranslations.uiString("Interview Prep", language: language))
                    .font(.largeTitle.weight(.black))
                    .foregroundStyle(.primary)
            }
            Spacer()
            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(LinearGradient.cvBrandGradient)
                Image(systemName: visaType.icon)
                    .font(.title3.weight(.bold))
                    .foregroundStyle(.white)
            }
            .frame(width: 52, height: 52)
            .shadow(color: Color.cvBrand.opacity(0.3), radius: 16, x: 0, y: 8)
        }
    }
}

// MARK: - Visa Type Selector Card (Feature #1)

private struct VisaTypeSelectorCard: View {
    @Binding var selectedVisaTypeRaw: String
    let language: AppLanguage

    private var selectedType: VisaType {
        VisaType(rawValue: selectedVisaTypeRaw) ?? .b1b2
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(VisaTranslations.uiString("Your Visa Type", language: language))
                    .font(.headline.weight(.bold))
                Spacer()
                Text(VisaTranslations.uiString("Changes all content", language: language))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(VisaType.allCases) { type in
                    VisaTypeOption(
                        type: type,
                        language: language,
                        isSelected: selectedType == type
                    ) {
                        cvImpactHaptic(.light)
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.78)) {
                            selectedVisaTypeRaw = type.rawValue
                        }
                    }
                }
            }
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

private struct VisaTypeOption: View {
    let type: VisaType
    let language: AppLanguage
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 10) {
                Image(systemName: type.icon)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(isSelected ? .white : Color.cvBrand)
                    .frame(width: 34, height: 34)
                    .background(isSelected ? Color.cvBrand : Color.cvBrandSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 1) {
                    Text(type.rawValue)
                        .font(.caption.weight(.black))
                        .foregroundStyle(isSelected ? Color.cvBrand : .primary)
                    Text(type.fullTitle(language: language))
                        .font(.system(size: 9.5, weight: .semibold))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(10)
            .background(isSelected ? Color.cvBrandSoft : Color.cvTertiarySystemBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(
                        isSelected ? Color.cvSelectedBorder : Color.cvHairline.opacity(0.6),
                        lineWidth: isSelected ? 1.5 : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Readiness Gauge Card

private struct VisaReadinessCard: View {
    let language: AppLanguage
    let visaType: VisaType
    let docsChecked: Int
    let totalDocs: Int
    let totalQuestions: Int
    let recentEntries: [ReadinessEntry]
    let onShowHistory: () -> Void

    private var fraction: Double {
        guard totalDocs > 0 else { return 0 }
        return Double(docsChecked) / Double(totalDocs)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(VisaTranslations.uiString("Readiness", language: language))
                    .font(.headline.weight(.bold))
                Spacer()
                Button(action: onShowHistory) {
                    HStack(spacing: 4) {
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.caption2.weight(.semibold))
                        Text(VisaTranslations.uiString("History", language: language))
                            .font(.caption.weight(.semibold))
                    }
                    .foregroundStyle(Color.cvBrand)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.cvBrandSoft)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }

            SegmentedGauge(progress: fraction, segmentCount: 24, apexIcon: "checkmark.seal.fill") {
                VStack(spacing: 1) {
                    Text("\(Int(fraction * 100))%")
                        .font(.system(size: 30, weight: .black, design: .rounded))
                        .foregroundStyle(.primary)
                    Text(VisaTranslations.uiString("PREPARED", language: language))
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.secondary)
                        .tracking(0.8)
                }
            }
            .frame(height: 132)
            .frame(maxWidth: .infinity)
            .padding(.bottom, 2)

            // Sparkline (shown when history exists)
            if recentEntries.count >= 2 {
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(VisaTranslations.uiString("7-Day Trend", language: language))
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(.secondary)
                        Spacer()
                        let delta = (recentEntries.last?.score ?? 0) - (recentEntries.first?.score ?? 0)
                        HStack(spacing: 3) {
                            Image(systemName: delta >= 0 ? "arrow.up.right" : "arrow.down.right")
                                .font(.system(size: 9, weight: .bold))
                            Text("\(delta >= 0 ? "+" : "")\(Int(delta * 100))%")
                                .font(.caption2.weight(.bold))
                        }
                        .foregroundStyle(delta >= 0 ? Color.cvGreen : .orange)
                    }
                    ReadinessSparkline(entries: recentEntries)
                        .frame(height: 40)
                }
                .padding(10)
                .background(Color.cvBrandSoft.opacity(0.6))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }

            Divider()

            HStack(spacing: 0) {
                ReadinessMacro(label: VisaTranslations.uiString("Docs", language: language), value: "\(docsChecked)", unit: "/\(totalDocs)", color: .cvGreen)
                Divider().frame(height: 36)
                ReadinessMacro(label: VisaTranslations.uiString("Questions", language: language), value: "\(totalQuestions)", unit: VisaTranslations.uiString("available", language: language), color: Color.cvBrand)
                Divider().frame(height: 36)
                ReadinessMacro(
                    label: VisaTranslations.uiString("Status", language: language),
                    value: fraction >= 1.0 ? VisaTranslations.uiString("Ready", language: language) : VisaTranslations.uiString("In Prog.", language: language),
                    unit: "",
                    color: fraction >= 1.0 ? .cvGreen : .orange
                )
            }
        }
        .cvCard(padding: 20, radius: 26, raised: true)
    }
}

private struct ReadinessMacro: View {
    let label: String
    let value: String
    let unit: String
    let color: Color

    var body: some View {
        VStack(spacing: 5) {
            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text(value)
                    .font(.title3.weight(.black))
                    .foregroundStyle(.primary)
                if !unit.isEmpty {
                    Text(unit)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            RoundedRectangle(cornerRadius: 2)
                .fill(color)
                .frame(width: 28, height: 3)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Quick Stats Row

private struct VisaQuickStatsRow: View {
    let language: AppLanguage
    let docsChecked: Int
    let totalDocs: Int
    let totalQuestions: Int

    var body: some View {
        HStack(spacing: 12) {
            StatTile(
                value: "\(docsChecked)/\(totalDocs)",
                label: VisaTranslations.uiString("Docs Ready", language: language),
                icon: "checkmark.circle.fill",
                tint: .cvGreen
            )
            StatTile(
                value: "\(totalQuestions)",
                label: VisaTranslations.uiString("Q&A Available", language: language),
                icon: "questionmark.circle.fill",
                tint: Color.cvBrand
            )
        }
    }
}

// MARK: - Today's Focus Card

private struct VisaTodayFocusCard: View {
    let language: AppLanguage
    let visaType: VisaType
    let docsChecked: Int
    let totalDocs: Int

    private struct FocusItem {
        let icon: String
        let title: String
        let detail: String
        let urgent: Bool
    }

    private var items: [FocusItem] {
        var result: [FocusItem] = []
        if docsChecked < totalDocs {
            let remaining = totalDocs - docsChecked
            let detailStr = remaining == 1
                ? VisaTranslations.uiString("You're missing 1 document — check them off as you gather each one.", language: language)
                : String(format: VisaTranslations.uiString("You're missing %d documents — check them off as you gather each one.", language: language), remaining)
            result.append(FocusItem(
                icon: "checklist",
                title: VisaTranslations.uiString("Complete your document checklist", language: language),
                detail: detailStr,
                urgent: true
            ))
        }
        let qTitle = String(format: VisaTranslations.uiString("Practice questions (%@)", language: language), visaType.rawValue)
        result.append(FocusItem(
            icon: "questionmark.circle.fill",
            title: qTitle,
            detail: VisaTranslations.uiString("Start with 'Purpose of Visit' — consular officers almost always ask this first.", language: language),
            urgent: docsChecked >= totalDocs
        ))
        return Array(result.prefix(2))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(VisaTranslations.uiString("Today's Focus", language: language))
                .font(.headline.weight(.bold))

            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                HStack(spacing: 12) {
                    Image(systemName: item.icon)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(item.urgent ? Color.cvBrand : .secondary)
                        .frame(width: 46, height: 46)
                        .background(item.urgent ? Color.cvBrandSoft : Color.cvSecondarySystemBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    VStack(alignment: .leading, spacing: 3) {
                        Text(item.title)
                            .font(.subheadline.weight(.bold))
                        Text(item.detail)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                    Spacer()
                }
                .padding(10)
                .background(item.urgent ? Color.cvBrandSoft.opacity(0.72) : Color.cvSurface)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

// Backward-compat alias kept so existing code referencing HomeView still compiles
typealias HomeView = VisaHomeView
typealias TodayView = VisaHomeView
