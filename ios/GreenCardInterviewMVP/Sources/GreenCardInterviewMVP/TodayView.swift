import SwiftUI

// HomeView — dashboard-style main tab, inspired by fitness-app design reference
struct HomeView: View {
    let jobs: [JobLead]

    private var interviewJobs: [JobLead] { jobs.filter { $0.stage == .interview } }
    private var appliedCount:  Int       { jobs.filter { $0.stage != .saved }.count }
    private var weeklyGoal:    Int       { 10 }

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    DashboardGreeting()

                    CareerGaugeCard(
                        appliedCount: appliedCount,
                        weeklyGoal: weeklyGoal,
                        interviewCount: interviewJobs.count,
                        resumeScore: 75
                    )

                    HStack(spacing: 12) {
                        MetricTile(
                            icon: "paperplane.fill",
                            iconColor: Color.cvBrand,
                            title: "Applications",
                            value: "\(appliedCount)",
                            subtitle: "this week",
                            progress: Double(appliedCount) / Double(weeklyGoal)
                        )
                        MetricTile(
                            icon: "person.fill.checkmark",
                            iconColor: .blue,
                            title: "Interviews",
                            value: "\(interviewJobs.count)",
                            subtitle: "scheduled",
                            progress: Double(interviewJobs.count) / 5.0
                        )
                    }

                    TodayFocusCard(actions: SampleCareerVividData.actions)

                    if !jobs.isEmpty {
                        PipelinePreviewCard(jobs: jobs)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, CVLayout.floatingTabContentPadding)
            }
            .background(Color.cvSystemGroupedBackground.ignoresSafeArea())
            .navigationBarHidden(true)
        }
    }
}

// MARK: - Greeting header

private struct DashboardGreeting: View {
    private var greeting: String {
        let h = Calendar.current.component(.hour, from: Date())
        if h < 12 { return "Good Morning" }
        if h < 17 { return "Good Afternoon" }
        return "Good Evening"
    }

    var body: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 2) {
                Text(greeting)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text("Your Career")
                    .font(.largeTitle.weight(.black))
                    .foregroundStyle(.primary)
            }

            Spacer()

            HStack(spacing: 10) {
                // Notification bell
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "bell")
                        .font(.body.weight(.medium))
                        .foregroundStyle(Color.cvInk)
                        .frame(width: 50, height: 50)
                        .background(Color.cvSurface)
                        .clipShape(Circle())
                        .shadow(color: .black.opacity(0.10), radius: 20, x: 0, y: 10)

                    Circle()
                        .fill(Color.cvBrand)
                        .frame(width: 10, height: 10)
                        .offset(x: -2, y: 3)
                }

                // Avatar placeholder
                ZStack {
                    Circle()
                        .fill(LinearGradient.cvBrandGradient)
                    Text("E")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(.white)
                }
                .frame(width: 48, height: 48)
                .shadow(color: Color.cvBrand.opacity(0.32), radius: 16, x: 0, y: 8)
            }
        }
    }
}

// MARK: - Main gauge card (semicircle + macro stats)

private struct CareerGaugeCard: View {
    let appliedCount: Int
    let weeklyGoal: Int
    let interviewCount: Int
    let resumeScore: Int

    private var fraction: Double { min(1, Double(appliedCount) / Double(weeklyGoal)) }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Card header
            HStack {
                Text("Job Search Progress")
                    .font(.headline.weight(.bold))
                Spacer()
                Label("This Week", systemImage: "calendar")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }

            // Segmented semicircle gauge
            SegmentedGauge(
                progress: fraction,
                segmentCount: 24,
                apexIcon: "flame.fill"
            ) {
                VStack(spacing: 1) {
                    Text("\(appliedCount)/\(weeklyGoal)")
                        .font(.system(size: 30, weight: .black, design: .rounded))
                        .foregroundStyle(.primary)
                    Text("APPLICATIONS")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.secondary)
                        .tracking(0.8)
                }
            }
            .frame(height: 132)
            .frame(maxWidth: .infinity)
            .padding(.bottom, 2)

            Divider()

            // Macro stats row
            HStack(spacing: 0) {
                MacroStat(label: "Resume",     value: "\(resumeScore)", unit: "/100",  color: Color.cvBrand)
                Divider().frame(height: 36)
                MacroStat(label: "Interviews", value: "\(interviewCount)", unit: "pending", color: .orange)
                Divider().frame(height: 36)
                MacroStat(label: "Goal",       value: "\(weeklyGoal)", unit: "this wk", color: .blue)
            }
        }
        .cvCard(padding: 20, radius: 26, raised: true)
    }
}

// One macro stat column
private struct MacroStat: View {
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
                Text(unit)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            // Colored underline bar
            RoundedRectangle(cornerRadius: 2)
                .fill(color)
                .frame(width: 28, height: 3)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Metric tiles (two-column row below the gauge)

private struct MetricTile: View {
    let icon: String
    let iconColor: Color
    let title: String
    let value: String
    let subtitle: String
    let progress: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header row
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(iconColor)
                Text(title)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }

            // Value + ring
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(value)
                        .font(.title.weight(.black))
                        .foregroundStyle(.primary)
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                CircularMetric(
                    value: "\(Int(min(1, progress) * 100))%",
                    progress: progress,
                    color: iconColor,
                    size: 48
                )
            }
        }
        .cvCard(padding: 16, radius: 20)
    }
}

// MARK: - Today's focus card

private struct TodayFocusCard: View {
    let actions: [NextAction]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Today's Focus")
                    .font(.headline.weight(.bold))
                Spacer()
                Button("See All") {}
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.cvBrand)
            }

            ForEach(Array(actions.prefix(2).enumerated()), id: \.offset) { idx, action in
                HStack(spacing: 12) {
                    // Icon square (mimics food-photo thumbnail from reference)
                    Image(systemName: action.systemImage)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(idx == 0 ? Color.cvBrand : .secondary)
                        .frame(width: 46, height: 46)
                        .background(idx == 0 ? Color.cvBrandSoft : Color.cvSecondarySystemBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    VStack(alignment: .leading, spacing: 3) {
                        Text(action.title)
                            .font(.subheadline.weight(.bold))
                        Text(action.detail)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }

                    Spacer()

                    Text(action.dueLabel)
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(action.dueLabel == "Today" ? Color.cvBrand : .secondary)
                }
                .padding(10)
                .background(idx == 0 ? Color.cvBrandSoft.opacity(0.72) : Color.cvSurface)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

// MARK: - Pipeline preview

private struct PipelinePreviewCard: View {
    let jobs: [JobLead]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Pipeline")
                    .font(.headline.weight(.bold))
                Spacer()
                Text("See all →")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.cvBrand)
            }
            ForEach(jobs.prefix(3)) { job in
                JobRow(job: job)
            }
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

// Backward-compat alias
typealias TodayView = HomeView
