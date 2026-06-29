import SwiftUI

public struct GreenCardInterviewMVPView: View {
    @StateObject private var authStore = AuthSessionStore()
    @State private var selectedTab: MobileTab = .home
    @State private var jobs = SampleCareerVividData.jobs

    public init() {}

    public var body: some View {
        Group {
            if authStore.isLoading {
                SplashLoadingView()
            } else if authStore.shouldShowAuthGate {
                AuthView(store: authStore)
            } else {
                appTabs
            }
        }
        .task {
            await authStore.load()
        }
    }

    private var appTabs: some View {
        ZStack {
            selectedTabView
        }
        .background(Color.cvAppBackground.ignoresSafeArea())
        .safeAreaInset(edge: .bottom) {
            FloatingMobileTabBar(selectedTab: $selectedTab)
                .padding(.horizontal, 22)
                .padding(.bottom, 8)
        }
    }

    @ViewBuilder
    private var selectedTabView: some View {
        switch selectedTab {
        case .home:
            HomeView(jobs: jobs)
        case .jobs:
            JobsView(jobs: $jobs)
        case .practice:
            PracticeView()
        case .resume:
            ResumeView()
        }
    }
}

private enum MobileTab: String, CaseIterable, Hashable {
    case home, jobs, practice, resume

    var title: String {
        switch self {
        case .home: return "Home"
        case .jobs: return "Jobs"
        case .practice: return "Practice"
        case .resume: return "Resume"
        }
    }

    var systemImage: String {
        switch self {
        case .home: return "house.fill"
        case .jobs: return "briefcase.fill"
        case .practice: return "mic.fill"
        case .resume: return "doc.text.fill"
        }
    }
}

private struct FloatingMobileTabBar: View {
    @Binding var selectedTab: MobileTab
    @Namespace private var pill

    var body: some View {
        HStack(spacing: 4) {
            ForEach(MobileTab.allCases, id: \.self) { tab in
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
                            Text(tab.title)
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
                                .matchedGeometryEffect(id: "selectedPill", in: pill)
                                .shadow(color: Color.cvBrand.opacity(0.34), radius: 14, x: 0, y: 6)
                        }
                    }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(tab.title)
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

private struct SplashLoadingView: View {
    var body: some View {
        ZStack {
            Color.cvAppBackground.ignoresSafeArea()
            VStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(LinearGradient.cvBrandGradient)
                    Image(systemName: "sparkles")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(.white)
                }
                .frame(width: 54, height: 54)
                .shadow(color: Color.cvBrand.opacity(0.24), radius: 16, x: 0, y: 8)

                ProgressView()
                    .tint(Color.cvBrand)
            }
        }
    }
}

struct GreenCardInterviewMVPView_Previews: PreviewProvider {
    static var previews: some View {
        GreenCardInterviewMVPView()
            .previewDisplayName("CareerVivid Mobile")
    }
}
