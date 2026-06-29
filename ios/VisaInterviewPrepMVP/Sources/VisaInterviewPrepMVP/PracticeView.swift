import SwiftUI
#if os(iOS)
import UIKit
#endif

// VisaPracticeView — Static Q&A bank + Model Answer Library (Features 2 + 5)
struct VisaPracticeView: View {
    @AppStorage("selectedVisaType") private var selectedVisaTypeRaw: String = VisaType.b1b2.rawValue
    @AppStorage("preferredLanguage") private var langRaw: String = AppLanguage.english.rawValue
    @State private var selectedCategory: VisaQuestionCategory? = nil
    @State private var expandedId: UUID? = nil
    @State private var showLibrary: Bool = false

    private var visaType: VisaType {
        VisaType(rawValue: selectedVisaTypeRaw) ?? .b1b2
    }

    private var language: AppLanguage {
        AppLanguage(rawValue: langRaw) ?? .english
    }

    private var filtered: [VisaQuestion] {
        VisaSampleData.questions
            .filter { $0.visaTypes.contains(visaType) }
            .filter { selectedCategory == nil || $0.category == selectedCategory }
    }

    private var availableCategories: [VisaQuestionCategory] {
        let used = Set(VisaSampleData.questions.filter { $0.visaTypes.contains(visaType) }.map(\.category))
        return VisaQuestionCategory.allCases.filter { used.contains($0) }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.cvAppBackground.ignoresSafeArea()
                if showLibrary {
                    ModelAnswerLibraryView()
                } else {
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 16) {
                            PracticeStatsHeader(visaType: visaType, count: filtered.count,
                                                language: language, showLibrary: $showLibrary)
                            CategoryFilterRow(categories: availableCategories, language: language, selected: $selectedCategory)

                            if filtered.isEmpty {
                                EmptyQuestionsView(language: language)
                            } else {
                                ForEach(filtered) { q in
                                    QuestionCard(
                                        question: q,
                                        language: language,
                                        isExpanded: expandedId == q.id,
                                        onTap: {
                                            cvImpactHaptic(.light)
                                            withAnimation(.spring(response: 0.38, dampingFraction: 0.8)) {
                                                expandedId = expandedId == q.id ? nil : q.id
                                            }
                                        }
                                    )
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 16)
                        .padding(.bottom, CVLayout.floatingTabContentPadding)
                    }
                }
            }
            .navigationTitle(showLibrary ? VisaTranslations.uiString("Answer Library", language: language) : VisaTranslations.uiString("Practice Questions", language: language))
            .cvInlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        cvImpactHaptic(.light)
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            showLibrary.toggle()
                        }
                    } label: {
                        Label(showLibrary ? VisaTranslations.uiString("Practice", language: language) : VisaTranslations.uiString("Library", language: language),
                              systemImage: showLibrary ? "questionmark.circle.fill" : "books.vertical.fill")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(Color.cvBrand)
                    }
                }
            }
        }
    }
}

// MARK: - Stats Header

private struct PracticeStatsHeader: View {
    let visaType: VisaType
    let count: Int
    let language: AppLanguage
    @Binding var showLibrary: Bool

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: visaType.icon)
                .font(.title3.weight(.bold))
                .foregroundStyle(.white)
                .frame(width: 48, height: 48)
                .background(LinearGradient.cvBrandGradient)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .shadow(color: Color.cvBrand.opacity(0.28), radius: 12, x: 0, y: 6)

            VStack(alignment: .leading, spacing: 3) {
                Text("\(visaType.rawValue) \(VisaTranslations.uiString("Practice Questions", language: language))")
                    .font(.headline.weight(.black))
                Text("\(count) \(VisaTranslations.uiString(count == 1 ? "question" : "questions", language: language)) · \(VisaTranslations.uiString("tap to see tips & model answer", language: language))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .cvCard(padding: 16, radius: 20)
    }
}

// MARK: - Category Filter

private struct CategoryFilterRow: View {
    let categories: [VisaQuestionCategory]
    let language: AppLanguage
    @Binding var selected: VisaQuestionCategory?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                CategoryPill(label: VisaTranslations.uiString("All", language: language), icon: "square.grid.2x2.fill", isSelected: selected == nil) {
                    cvImpactHaptic(.light)
                    withAnimation { selected = nil }
                }
                ForEach(categories) { cat in
                    CategoryPill(label: cat.title(language: language), icon: cat.icon, isSelected: selected == cat) {
                        cvImpactHaptic(.light)
                        withAnimation { selected = cat }
                    }
                }
            }
            .padding(.horizontal, 2)
            .padding(.vertical, 2)
        }
    }
}

private struct CategoryPill: View {
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
            .background(
                isSelected
                    ? AnyShapeStyle(LinearGradient.cvBrandGradient)
                    : AnyShapeStyle(Color.cvSurface)
            )
            .clipShape(Capsule())
            .shadow(
                color: isSelected ? Color.cvBrand.opacity(0.25) : .black.opacity(0.05),
                radius: 8, x: 0, y: 3
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Question Card

private struct QuestionCard: View {
    let question: VisaQuestion
    let language: AppLanguage
    let isExpanded: Bool
    let onTap: () -> Void

    private var localizedQuestion: String {
        question.localizedText(language: language)
    }

    private var shouldShowEnglish: Bool {
        language != .english && localizedQuestion != question.text
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header — always visible
            Button(action: onTap) {
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: question.category.icon)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.cvBrand)
                        .frame(width: 36, height: 36)
                        .background(Color.cvBrandSoft)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                    VStack(alignment: .leading, spacing: 5) {
                        Text(localizedQuestion)
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(.primary)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                        if shouldShowEnglish {
                            Text(question.text)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(Color.cvInkSecondary)
                                .multilineTextAlignment(.leading)
                                .fixedSize(horizontal: false, vertical: true)
                                .accessibilityLabel("\(VisaTranslations.uiString("English", language: language)): \(question.text)")
                        }
                        PillLabel(text: question.category.title(language: language), color: .cvBrand)
                    }

                    Spacer(minLength: 4)

                    Image(systemName: isExpanded ? "chevron.up.circle.fill" : "chevron.down.circle")
                        .font(.title3)
                        .foregroundStyle(isExpanded ? Color.cvBrand : Color.cvInkTertiary)
                        .padding(.top, 2)
                }
                .padding(16)
            }
            .buttonStyle(.plain)

            // Expanded detail
            if isExpanded {
                Divider().padding(.horizontal, 16)

                VStack(alignment: .leading, spacing: 14) {
                    // Tips block
                    VStack(alignment: .leading, spacing: 8) {
                        Label(VisaTranslations.uiString("Tips", language: language), systemImage: "lightbulb.fill")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(Color.cvYellow)

                        ForEach(question.localizedTips(language: language), id: \.self) { tip in
                            HStack(alignment: .top, spacing: 8) {
                                Circle()
                                    .fill(Color.cvBrand)
                                    .frame(width: 5, height: 5)
                                    .padding(.top, 5)
                                Text(tip)
                                    .font(.caption)
                                    .foregroundStyle(Color.cvInkSecondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.cvYellowSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    // Model answer block
                    VStack(alignment: .leading, spacing: 8) {
                        Label(VisaTranslations.uiString("Model Answer", language: language), systemImage: "checkmark.seal.fill")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(Color.cvGreen)

                        Text(question.localizedModelAnswer(language: language))
                            .font(.caption)
                            .foregroundStyle(Color.cvInkSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.cvGreenSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .padding(16)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .background(Color.cvSurface)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(
                    isExpanded ? Color.cvBrand.opacity(0.3) : Color.cvHairline.opacity(0.6),
                    lineWidth: isExpanded ? 1.5 : 1
                )
        )
        .shadow(
            color: .black.opacity(isExpanded ? 0.08 : 0.04),
            radius: isExpanded ? 20 : 12,
            x: 0, y: isExpanded ? 8 : 4
        )
    }
}

// MARK: - Empty State

private struct EmptyQuestionsView: View {
    let language: AppLanguage

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "questionmark.circle")
                .font(.system(size: 44))
                .foregroundStyle(Color.cvInkTertiary)
            Text(VisaTranslations.uiString("No questions in this category", language: language))
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}
