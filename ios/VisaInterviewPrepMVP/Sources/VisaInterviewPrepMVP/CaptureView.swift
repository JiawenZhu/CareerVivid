import SwiftUI

// JobsView replaces the old CaptureView — full pipeline + add job
struct JobsView: View {
    @Binding var jobs: [JobLead]
    @State private var stageFilter: JobStage? = nil
    @State private var showAddSheet = false

    private var filtered: [JobLead] {
        guard let f = stageFilter else { return jobs }
        return jobs.filter { $0.stage == f }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                StageFilterBar(selected: $stageFilter)
                    .padding(.horizontal, 20)
                    .padding(.top, 10)
                    .padding(.bottom, 8)
                    .background(Color.cvAppBackground)

                if filtered.isEmpty {
                    EmptyJobsState(onAdd: { showAddSheet = true })
                } else {
                    ScrollView {
                        LazyVStack(spacing: 14) {
                            ForEach(filtered) { job in
                                JobCard(job: job)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 12)
                        .padding(.bottom, CVLayout.floatingTabContentPadding)
                    }
                }
            }
            .background(Color.cvSystemGroupedBackground.ignoresSafeArea())
            .navigationTitle("Jobs")
            .toolbar {
                ToolbarItem(placement: .cvTopBarTrailing) {
                    Button { showAddSheet = true } label: {
                        Image(systemName: "plus")
                            .font(.headline.weight(.black))
                            .foregroundStyle(.white)
                            .frame(width: 42, height: 42)
                            .background(LinearGradient.cvBrandGradient)
                            .clipShape(Circle())
                            .shadow(color: Color.cvBrand.opacity(0.24), radius: 14, x: 0, y: 7)
                    }
                    .buttonStyle(.plain)
                }
            }
            .sheet(isPresented: $showAddSheet) {
                AddJobSheet(jobs: $jobs, isPresented: $showAddSheet)
            }
        }
    }
}

// MARK: - Stage filter chips
private struct StageFilterBar: View {
    @Binding var selected: JobStage?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(label: "All", isSelected: selected == nil) { selected = nil }
                ForEach(JobStage.allCases) { stage in
                    FilterChip(label: stage.rawValue, isSelected: selected == stage) {
                        selected = selected == stage ? nil : stage
                    }
                }
            }
        }
    }
}

private struct FilterChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(isSelected ? Color.cvBrand : Color.cvSecondarySystemBackground)
                .clipShape(Capsule())
                .shadow(color: isSelected ? Color.cvBrand.opacity(0.18) : .clear, radius: 12, x: 0, y: 6)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Job card (full version for Jobs tab)
private struct JobCard: View {
    let job: JobLead

    private var stageColor: Color { job.stage.color }

    var body: some View {
        HStack(spacing: 16) {
            CompanyAvatar(company: job.company, tint: stageColor, size: 52)

            VStack(alignment: .leading, spacing: 4) {
                Text(job.title)
                    .font(.headline.weight(.bold))
                    .lineLimit(1)
                Text(job.company)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(job.nextStep)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(stageColor)
                    .lineLimit(1)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 6) {
                PillLabel(text: job.stage.rawValue, color: stageColor)
                Text("\(job.matchScore)%")
                    .font(.title3.weight(.black))
                    .foregroundStyle(Color.cvInk)
            }
        }
        .frame(minHeight: 78)
        .cvCard(padding: 16, radius: 22)
    }
}

// MARK: - Empty state
private struct EmptyJobsState: View {
    let onAdd: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "briefcase")
                .font(.system(size: 48))
                .foregroundStyle(Color.cvBrand.opacity(0.4))
            Text("No jobs here yet")
                .font(.headline.weight(.bold))
            Text("Tap + to save a role from a job listing URL.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Add a job", action: onAdd)
                .font(.subheadline.weight(.bold))
                .padding(.horizontal, 22)
                .padding(.vertical, 13)
                .cvPrimaryActionButton()
            Spacer()
        }
        .padding(40)
    }
}

// MARK: - Add job sheet
struct AddJobSheet: View {
    @Binding var jobs: [JobLead]
    @Binding var isPresented: Bool
    @State private var url = ""

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Job listing URL", systemImage: "link")
                        .font(.headline.weight(.bold))
                    TextField("Paste URL from LinkedIn, Greenhouse…", text: $url)
                        .cvURLTextField()
                        .padding(14)
                        .background(Color.cvSecondarySystemBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }

                Button {
                    let job = makeCapturedJob(from: url, existingCount: jobs.count)
                    jobs.insert(job, at: 0)
                    isPresented = false
                } label: {
                    Label("Save to tracker", systemImage: "tray.and.arrow.down.fill")
                        .font(.subheadline.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .cvPrimaryActionButton()
                .disabled(url.trimmingCharacters(in: .whitespaces).isEmpty)

                Spacer()
            }
            .padding(20)
            .background(Color.cvSystemGroupedBackground.ignoresSafeArea())
            .navigationTitle("Add Job")
            .cvInlineNavigationTitle()
            .toolbar {
                ToolbarItem(placement: .cvTopBarLeading) {
                    Button("Cancel") { isPresented = false }
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
}

// MARK: - Color helper on JobStage
extension JobStage {
    var color: Color {
        switch self {
        case .saved:     return .secondary
        case .applied:   return .cvBrand
        case .interview: return .cvBrand
        case .offer:     return .cvGreen
        }
    }
}

// Legacy alias
typealias CaptureView = JobsView
