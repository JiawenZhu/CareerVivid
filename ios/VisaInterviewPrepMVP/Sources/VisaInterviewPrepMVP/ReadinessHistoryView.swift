import SwiftUI
import Charts

// ReadinessHistoryView — readiness score trend (Feature 7)
struct ReadinessHistoryView: View {
    @AppStorage("selectedVisaType") private var selectedVisaTypeRaw: String = VisaType.b1b2.rawValue
    @State private var entries: [ReadinessEntry] = []

    private var visaType: VisaType { VisaType(rawValue: selectedVisaTypeRaw) ?? .b1b2 }
    private var filtered: [ReadinessEntry] {
        entries.filter { $0.visaType == visaType.rawValue }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.cvAppBackground.ignoresSafeArea()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        if filtered.isEmpty {
                            HistoryEmptyState()
                        } else {
                            HistoryChartCard(entries: filtered)
                            HistoryStatsCard(entries: filtered)
                            HistoryListCard(entries: filtered)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Readiness History")
            .cvInlineNavigationTitle()
            .onAppear { entries = ReadinessHistory.load() }
        }
    }
}

// MARK: - Chart Card

private struct HistoryChartCard: View {
    let entries: [ReadinessEntry]

    private var maxScore: Double { entries.map(\.score).max() ?? 1.0 }
    private var avgScore: Double {
        guard !entries.isEmpty else { return 0 }
        return entries.map(\.score).reduce(0,+) / Double(entries.count)
    }
    private var trend: Double {
        guard entries.count >= 2 else { return 0 }
        return entries.last!.score - entries.first!.score
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Readiness Trend")
                        .font(.headline.weight(.bold))
                    Text("Last \(entries.count) session\(entries.count == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                TrendBadge(trend: trend)
            }

            Chart {
                ForEach(Array(entries.enumerated()), id: \.element.id) { i, entry in
                    AreaMark(
                        x: .value("Session", i),
                        yStart: .value("Base", 0),
                        yEnd: .value("Score", entry.score * 100)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color.cvBrand.opacity(0.25), Color.cvBrand.opacity(0.05)],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .interpolationMethod(.catmullRom)

                    LineMark(
                        x: .value("Session", i),
                        y: .value("Score", entry.score * 100)
                    )
                    .foregroundStyle(Color.cvBrand)
                    .lineStyle(StrokeStyle(lineWidth: 2.5, lineCap: .round))
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Session", i),
                        y: .value("Score", entry.score * 100)
                    )
                    .foregroundStyle(Color.cvBrand)
                    .symbolSize(30)
                }

                // Average rule
                RuleMark(y: .value("Avg", avgScore * 100))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                    .foregroundStyle(Color.cvInkTertiary)
                    .annotation(position: .top, alignment: .trailing) {
                        Text("avg \(Int(avgScore * 100))%")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(Color.cvInkTertiary)
                    }
            }
            .chartYScale(domain: 0...100)
            .chartYAxis {
                AxisMarks(values: [0, 25, 50, 75, 100]) { v in
                    AxisGridLine().foregroundStyle(Color.cvHairline.opacity(0.4))
                    AxisValueLabel {
                        if let val = v.as(Int.self) {
                            Text("\(val)%")
                                .font(.caption2)
                                .foregroundStyle(Color.cvInkTertiary)
                        }
                    }
                }
            }
            .chartXAxis(.hidden)
            .frame(height: 160)
        }
        .cvCard(padding: 18, radius: 24, raised: true)
    }
}

private struct TrendBadge: View {
    let trend: Double

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: trend >= 0 ? "arrow.up.right" : "arrow.down.right")
                .font(.caption2.weight(.bold))
            Text("\(trend >= 0 ? "+" : "")\(Int(trend * 100))%")
                .font(.caption.weight(.bold))
        }
        .foregroundStyle(trend >= 0 ? Color.cvGreen : .orange)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background((trend >= 0 ? Color.cvGreen : Color.orange).opacity(0.12))
        .clipShape(Capsule())
    }
}

// MARK: - Stats Card

private struct HistoryStatsCard: View {
    let entries: [ReadinessEntry]

    private var best: Double   { entries.map(\.score).max() ?? 0 }
    private var avg: Double    { entries.map(\.score).reduce(0,+) / Double(max(1, entries.count)) }
    private var latest: Double { entries.last?.score ?? 0 }

    var body: some View {
        HStack(spacing: 0) {
            HistoryStatCell(label: "Latest", value: "\(Int(latest * 100))%", color: Color.cvBrand)
            Divider().frame(height: 44)
            HistoryStatCell(label: "Average", value: "\(Int(avg * 100))%", color: Color.cvInkSecondary)
            Divider().frame(height: 44)
            HistoryStatCell(label: "Best", value: "\(Int(best * 100))%", color: Color.cvGreen)
        }
        .cvCard(padding: 18, radius: 22, raised: true)
    }
}

private struct HistoryStatCell: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.weight(.black))
                .foregroundStyle(color)
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - History List

private struct HistoryListCard: View {
    let entries: [ReadinessEntry]

    private let formatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Session Log")
                .font(.headline.weight(.bold))

            ForEach(entries.reversed()) { entry in
                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(scoreColor(entry.score).opacity(0.15))
                        Text("\(Int(entry.score * 100))%")
                            .font(.caption2.weight(.black))
                            .foregroundStyle(scoreColor(entry.score))
                    }
                    .frame(width: 42, height: 42)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(formatter.string(from: entry.date))
                            .font(.caption.weight(.semibold))
                        Text("\(entry.docsChecked)/\(entry.totalDocs) docs · \(entry.questionsReviewed) questions")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundStyle(scoreColor(entry.score))
                }
                .padding(.vertical, 4)
                if entry.id != entries.reversed().last?.id { Divider() }
            }
        }
        .cvCard(padding: 18, radius: 22, raised: true)
    }

    private func scoreColor(_ score: Double) -> Color {
        if score >= 0.8 { return .cvGreen }
        if score >= 0.5 { return Color.cvBrand }
        return .orange
    }
}

// MARK: - Empty State

private struct HistoryEmptyState: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 48))
                .foregroundStyle(Color.cvInkTertiary)
                .padding(.top, 60)
            Text("No history yet")
                .font(.title3.weight(.bold))
            Text("Your readiness score is automatically saved each time you open the app. Come back tomorrow to see your trend!")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
        }
    }
}

// MARK: - Sparkline (embedded in Home)

struct ReadinessSparkline: View {
    let entries: [ReadinessEntry]

    var body: some View {
        if entries.count >= 2 {
            Chart {
                ForEach(Array(entries.enumerated()), id: \.element.id) { i, e in
                    LineMark(
                        x: .value("i", i),
                        y: .value("score", e.score * 100)
                    )
                    .foregroundStyle(Color.cvBrand)
                    .lineStyle(StrokeStyle(lineWidth: 2, lineCap: .round))
                    .interpolationMethod(.catmullRom)

                    AreaMark(
                        x: .value("i", i),
                        yStart: .value("base", 0),
                        yEnd: .value("score", e.score * 100)
                    )
                    .foregroundStyle(LinearGradient(
                        colors: [Color.cvBrand.opacity(0.2), .clear],
                        startPoint: .top, endPoint: .bottom
                    ))
                    .interpolationMethod(.catmullRom)
                }
            }
            .chartYScale(domain: 0...100)
            .chartXAxis(.hidden)
            .chartYAxis(.hidden)
        } else {
            Rectangle()
                .fill(Color.cvBrandSoft)
                .clipShape(RoundedRectangle(cornerRadius: 6))
                .overlay(
                    Text("Not enough data yet")
                        .font(.caption2)
                        .foregroundStyle(Color.cvInkTertiary)
                )
        }
    }
}
