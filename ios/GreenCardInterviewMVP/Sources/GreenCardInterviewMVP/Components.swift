import SwiftUI

// MARK: - JobRow (used in Home pipeline preview)
struct JobRow: View {
    let job: JobLead

    private var stageColor: Color { job.stage.color }

    var body: some View {
        HStack(spacing: 12) {
            CompanyAvatar(company: job.company, tint: stageColor)

            VStack(alignment: .leading, spacing: 3) {
                Text(job.title)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.primary)
                Text(job.company)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 5) {
                PillLabel(text: job.stage.rawValue, color: stageColor)
                Text("\(job.matchScore)%")
                    .font(.caption.weight(.black))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(Color.cvTertiarySystemBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.cvHairline.opacity(0.65), lineWidth: 1)
        )
    }
}

// MARK: - Company avatar (first letter of company name)
struct CompanyAvatar: View {
    let company: String
    let tint: Color
    var size: CGFloat = 44

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.25, style: .continuous)
                .fill(tint.opacity(0.13))
                .frame(width: size, height: size)
            Text(String(company.prefix(1)).uppercased())
                .font(.system(size: size * 0.40, weight: .bold, design: .rounded))
                .foregroundStyle(tint)
        }
    }
}
