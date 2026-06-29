import SwiftUI

public struct VisaInterviewPrepMVPView: View {
    @StateObject private var authStore = AuthSessionStore()
    @State private var selectedTab: VisaTab = .home

    public init() {}

    public var body: some View {
        Group {
            if authStore.isLoading {
                VisaSplashView()
            } else if authStore.shouldShowAuthGate {
                AuthView(store: authStore)
            } else {
                appTabs
            }
        }
        .task { await authStore.load() }
    }

    private var appTabs: some View {
        ZStack {
            selectedTabView
        }
        .background(Color.cvAppBackground.ignoresSafeArea())
        .safeAreaInset(edge: .bottom) {
            VisaFloatingTabBar(selectedTab: $selectedTab)
                .padding(.horizontal, 22)
                .padding(.bottom, 8)
        }
    }

    @ViewBuilder
    private var selectedTabView: some View {
        switch selectedTab {
        case .home:      VisaHomeView()
        case .practice:  VisaPracticeView()
        case .checklist: DocumentChecklistView()
        case .mock:      MockInterviewView()
        }
    }
}

// MARK: - Tab Definition

enum VisaTab: String, CaseIterable, Hashable {
    case home, practice, checklist, mock

    var title: String {
        title(language: VisaTranslations.currentLanguage())
    }

    func title(language: AppLanguage) -> String {
        switch self {
        case .home:      return VisaTranslations.uiString("Home", language: language)
        case .practice:  return VisaTranslations.uiString("Practice", language: language)
        case .checklist: return VisaTranslations.uiString("Checklist", language: language)
        case .mock:      return VisaTranslations.uiString("Mock", language: language)
        }
    }

    var systemImage: String {
        switch self {
        case .home:      return "house.fill"
        case .practice:  return "questionmark.circle.fill"
        case .checklist: return "checklist"
        case .mock:      return "mic.fill"
        }
    }
}

// MARK: - Floating Tab Bar

private struct VisaFloatingTabBar: View {
    @Binding var selectedTab: VisaTab
    @AppStorage("preferredLanguage") private var langRaw: String = AppLanguage.english.rawValue
    @Namespace private var pill

    private var language: AppLanguage {
        AppLanguage(rawValue: langRaw) ?? .english
    }

    var body: some View {
        HStack(spacing: 4) {
            ForEach(VisaTab.allCases, id: \.self) { tab in
                let isSelected = selectedTab == tab
                Button {
                    cvImpactHaptic(.light)
                    withAnimation(.spring(response: 0.42, dampingFraction: 0.82)) {
                        selectedTab = tab
                    }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: tab.systemImage)
                            .font(.system(size: 19, weight: .bold))
                        if isSelected {
                            Text(tab.title(language: language))
                                .font(.subheadline.weight(.bold))
                                .fixedSize()
                                .transition(.move(edge: .trailing).combined(with: .opacity))
                        }
                    }
                    .foregroundStyle(isSelected ? Color.white : Color.cvInkTertiary)
                    .frame(maxWidth: isSelected ? .infinity : nil)
                    .frame(height: 54)
                    .padding(.horizontal, isSelected ? 18 : 14)
                    .background {
                        if isSelected {
                            Capsule(style: .continuous)
                                .fill(LinearGradient.cvBrandGradient)
                                .matchedGeometryEffect(id: "visaPill", in: pill)
                                .shadow(color: Color.cvBrand.opacity(0.34), radius: 14, x: 0, y: 6)
                        }
                    }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(tab.title(language: language))
                .accessibilityAddTraits(isSelected ? .isSelected : [])
            }
        }
        .padding(7)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 34, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 34, style: .continuous)
                .stroke(.white.opacity(0.9), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.12), radius: 28, x: 0, y: 10)
    }
}

// MARK: - Splash

private struct VisaSplashView: View {
    var body: some View {
        ZStack {
            Color.cvAppBackground.ignoresSafeArea()
            VStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(LinearGradient.cvBrandGradient)
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(.white)
                }
                .frame(width: 54, height: 54)
                .shadow(color: Color.cvBrand.opacity(0.24), radius: 16, x: 0, y: 8)
                ProgressView().tint(Color.cvBrand)
            }
        }
    }
}

// MARK: - Mock Interview Placeholder

struct MockInterviewPlaceholderView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                Color.cvAppBackground.ignoresSafeArea()
                VStack(spacing: 24) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .fill(LinearGradient.cvBrandGradient)
                        Image(systemName: "mic.fill")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundStyle(.white)
                    }
                    .frame(width: 80, height: 80)
                    .shadow(color: Color.cvBrand.opacity(0.3), radius: 20, x: 0, y: 10)

                    VStack(spacing: 8) {
                        Text("AI Mock Interview")
                            .font(.title2.weight(.black))
                        Text("Practice with a real-time AI consular officer.\nComing soon.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }

                    PillLabel(text: "Coming Soon", color: .cvBrand)
                }
                .padding(40)
            }
            .navigationTitle("Mock Interview")
            .cvInlineNavigationTitle()
        }
    }
}

struct VisaInterviewPrepMVPView_Previews: PreviewProvider {
    static var previews: some View {
        VisaInterviewPrepMVPView()
            .previewDisplayName("Visa Interview Prep")
    }
}
