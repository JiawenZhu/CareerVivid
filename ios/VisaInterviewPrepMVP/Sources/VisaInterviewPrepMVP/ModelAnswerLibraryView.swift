import SwiftUI

// ModelAnswerLibraryView — searchable reference library of all model answers (Feature 5)
struct ModelAnswerLibraryView: View {
    @AppStorage("selectedVisaType")  private var selectedVisaTypeRaw: String = VisaType.b1b2.rawValue
    @AppStorage("preferredLanguage") private var langRaw: String = AppLanguage.english.rawValue
    @State private var searchText: String = ""
    @State private var selectedCategory: VisaQuestionCategory? = nil

    private var visaType: VisaType { VisaType(rawValue: selectedVisaTypeRaw) ?? .b1b2 }
    private var language: AppLanguage { AppLanguage(rawValue: langRaw) ?? .english }

    private var allQuestions: [VisaQuestion] {
        VisaSampleData.questions.filter { $0.visaTypes.contains(visaType) }
    }
    private var filtered: [VisaQuestion] {
        allQuestions.filter { q in
            let text = localizedText(for: q)
            let matchesSearch = searchText.isEmpty || text.localizedCaseInsensitiveContains(searchText)
                || q.modelAnswer.localizedCaseInsensitiveContains(searchText)
            let matchesCategory = selectedCategory == nil || q.category == selectedCategory
            return matchesSearch && matchesCategory
        }
    }
    private var availableCategories: [VisaQuestionCategory] {
        let used = Set(allQuestions.map(\.category))
        return VisaQuestionCategory.allCases.filter { used.contains($0) }
    }

    private func localizedText(for q: VisaQuestion) -> String {
        q.localizedText(language: language)
    }
    private func localizedAnswer(for q: VisaQuestion) -> String {
        q.localizedModelAnswer(language: language)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.cvAppBackground.ignoresSafeArea()
                VStack(spacing: 0) {
                    // Search bar
                    HStack(spacing: 10) {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(.secondary)
                        TextField(VisaTranslations.uiString("Search answers…", language: language), text: $searchText)
                            .font(.subheadline)
                    }
                    .padding(12)
                    .background(Color.cvSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color.cvHairline.opacity(0.6), lineWidth: 1))
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, 8)

                    // Category filter
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            LibraryFilterPill(label: VisaTranslations.uiString("All", language: language), icon: "books.vertical.fill",
                                             isSelected: selectedCategory == nil) {
                                cvImpactHaptic(.light)
                                withAnimation { selectedCategory = nil }
                            }
                            ForEach(availableCategories) { cat in
                                LibraryFilterPill(label: cat.title(language: language), icon: cat.icon,
                                                  isSelected: selectedCategory == cat) {
                                    cvImpactHaptic(.light)
                                    withAnimation { selectedCategory = cat }
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 4)
                    }

                    Divider().padding(.top, 4)

                    // Results
                    if filtered.isEmpty {
                        LibraryEmptyState(searchText: searchText)
                    } else {
                        ScrollView(showsIndicators: false) {
                            LazyVStack(spacing: 14) {
                                // Stats header
                                HStack {
                                    Text("\(filtered.count) \(VisaTranslations.uiString(filtered.count == 1 ? "answer" : "answers", language: language))")
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(.secondary)
                                    Spacer()
                                    if language != .english {
                                        HStack(spacing: 4) {
                                            Text(language.flag)
                                                .font(.caption)
                                            Text(language.rawValue)
                                                .font(.caption.weight(.semibold))
                                                .foregroundStyle(Color.cvBrand)
                                        }
                                    }
                                }
                                .padding(.horizontal, 20)
                                .padding(.top, 12)

                                ForEach(filtered) { q in
                                    AnswerCard(
                                        question: q,
                                        language: language,
                                        localizedText: localizedText(for: q),
                                        localizedAnswer: localizedAnswer(for: q)
                                    )
                                    .padding(.horizontal, 20)
                                }

                                Spacer().frame(height: CVLayout.floatingTabContentPadding)
                            }
                        }
                    }
                }
            }
            .navigationTitle(VisaTranslations.uiString("Answer Library", language: language))
            .cvInlineNavigationTitle()
        }
    }
}

// MARK: - Filter Pill

private struct LibraryFilterPill: View {
    let label: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon).font(.caption2.weight(.semibold))
                Text(label).font(.caption.weight(.bold)).lineLimit(1)
            }
            .foregroundStyle(isSelected ? .white : Color.cvInk)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(isSelected ? AnyShapeStyle(LinearGradient.cvBrandGradient) : AnyShapeStyle(Color.cvSurface))
            .clipShape(Capsule())
            .shadow(color: isSelected ? Color.cvBrand.opacity(0.25) : .black.opacity(0.04), radius: 6, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Answer Card

private struct AnswerCard: View {
    let question: VisaQuestion
    let language: AppLanguage
    let localizedText: String
    let localizedAnswer: String

    private var shouldShowEnglish: Bool {
        language != .english && localizedText != question.text
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Question
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: question.category.icon)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.cvBrand)
                    .frame(width: 30, height: 30)
                    .background(Color.cvBrandSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))

                VStack(alignment: .leading, spacing: 4) {
                    PillLabel(text: question.category.title(language: language), color: .cvBrand)
                    Text(localizedText)
                        .font(.subheadline.weight(.bold))
                        .fixedSize(horizontal: false, vertical: true)
                    if shouldShowEnglish {
                        Text(question.text)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Color.cvInkSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }

            Divider()

            // Model answer
            VStack(alignment: .leading, spacing: 6) {
                Label(VisaTranslations.uiString("Model Answer", language: language), systemImage: "checkmark.seal.fill")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(Color.cvGreen)
                Text(localizedAnswer)
                    .font(.caption)
                    .foregroundStyle(Color.cvInkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.cvGreenSoft)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .cvCard(padding: 16, radius: 20, raised: false)
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(Color.cvHairline.opacity(0.6), lineWidth: 1)
        )
    }
}

// MARK: - Empty State

private struct LibraryEmptyState: View {
    let searchText: String
    @AppStorage("preferredLanguage") private var langRaw: String = AppLanguage.english.rawValue

    private var language: AppLanguage {
        AppLanguage(rawValue: langRaw) ?? .english
    }

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 44))
                .foregroundStyle(Color.cvInkTertiary)
            Text(searchText.isEmpty ? VisaTranslations.uiString("No answers in this category", language: language) : String(format: VisaTranslations.uiString("No results for \"%@\"", language: language), searchText))
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            Spacer()
        }
    }
}
