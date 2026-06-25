import SwiftUI
#if os(iOS)
import UIKit
#endif

#if os(iOS)
func cvImpactHaptic(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
    UIImpactFeedbackGenerator(style: style).impactOccurred()
}
#else
func cvImpactHaptic(_ style: Any) {}
#endif

// MARK: - Brand Colors
extension Color {
    // Dimensional orange palette from Design/careervivid-mobile-reference-design.json.
    static let cvBrand      = Color(red: 1.000, green: 0.420, blue: 0.086)  // #FF6B16
    static let cvBrandSoft  = Color(red: 1.000, green: 0.941, blue: 0.898)  // #FFF0E5
    static let cvBrandSofter = Color(red: 1.000, green: 0.969, blue: 0.941) // #FFF7F0
    static let cvBrandWarm  = Color(red: 1.000, green: 0.608, blue: 0.239)  // #FF9B3D
    static let cvBrandDeep  = Color(red: 0.918, green: 0.325, blue: 0.000)  // #EA5300
    static let cvSelectedBorder = Color(red: 1.000, green: 0.718, blue: 0.529)

    static let cvAppBackground = Color(red: 0.965, green: 0.965, blue: 0.973) // #F6F6F8
    static let cvSurface = Color.white
    static let cvSurfaceWarm = Color(red: 1.000, green: 0.973, blue: 0.953)
    static let cvSurfaceCool = Color(red: 0.953, green: 0.965, blue: 1.000)
    static let cvPressedSurface = Color(red: 0.945, green: 0.945, blue: 0.957)
    static let cvHairline = Color(red: 0.906, green: 0.906, blue: 0.922)

    static let cvInk = Color(red: 0.067, green: 0.067, blue: 0.078)
    static let cvInkSecondary = Color(red: 0.443, green: 0.443, blue: 0.478)
    static let cvInkTertiary = Color(red: 0.608, green: 0.608, blue: 0.639)

    static let cvBlue = Color(red: 0.176, green: 0.612, blue: 1.000)
    static let cvBlueSoft = Color(red: 0.918, green: 0.961, blue: 1.000)
    static let cvGreen = Color(red: 0.208, green: 0.788, blue: 0.435)
    static let cvGreenSoft = Color(red: 0.918, green: 0.984, blue: 0.945)
    static let cvPurple = Color(red: 0.451, green: 0.341, blue: 1.000)
    static let cvPurpleSoft = Color(red: 0.941, green: 0.929, blue: 1.000)
    static let cvPink = Color(red: 1.000, green: 0.431, blue: 0.659)
    static let cvPinkSoft = Color(red: 1.000, green: 0.918, blue: 0.953)
    static let cvYellow = Color(red: 1.000, green: 0.702, blue: 0.220)
    static let cvYellowSoft = Color(red: 1.000, green: 0.965, blue: 0.871)

    static var cvSystemBackground: Color {
        Color.cvSurface
    }

    static var cvSecondarySystemBackground: Color {
        Color(red: 0.949, green: 0.949, blue: 0.961)
    }

    static var cvTertiarySystemBackground: Color {
        Color(red: 0.976, green: 0.976, blue: 0.984)
    }

    static var cvSystemGroupedBackground: Color {
        Color.cvAppBackground
    }

    static var cvSecondarySystemGroupedBackground: Color {
        Color.cvSurface
    }

    static var cvSeparator: Color {
        Color.cvHairline
    }

    static var cvSystemFill: Color {
        Color(red: 0.910, green: 0.910, blue: 0.925)
    }

    static var cvSystemGray4: Color {
        #if os(iOS)
        Color(UIColor.systemGray4)
        #else
        Color(nsColor: .tertiaryLabelColor)
        #endif
    }

    static var cvLabel: Color {
        #if os(iOS)
        Color(UIColor.label)
        #else
        Color.primary
        #endif
    }

    static var cvSystemTeal: Color {
        #if os(iOS)
        Color(UIColor.systemTeal)
        #else
        Color.teal
        #endif
    }
}

// MARK: - Brand gradient (use as ShapeStyle)
extension LinearGradient {
    static var cvBrandGradient: LinearGradient {
        LinearGradient(
            colors: [Color.cvBrandWarm, Color.cvBrand],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // Indigo → magenta → orange premium banner gradient (reference: Upgrade to Premium card).
    static var cvPremiumGradient: LinearGradient {
        LinearGradient(
            colors: [
                Color(red: 0.357, green: 0.310, blue: 0.878),  // #5B4FE0
                Color(red: 0.608, green: 0.341, blue: 0.722),  // #9B57B8
                Color(red: 1.000, green: 0.529, blue: 0.263)   // #FF8743
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // Career-readiness scale: blue → green → yellow → orange (reference: weight scale bar).
    static var cvReadinessScale: LinearGradient {
        LinearGradient(
            colors: [Color.cvBlue, Color.cvGreen, Color.cvYellow, Color.cvBrand],
            startPoint: .leading,
            endPoint: .trailing
        )
    }
}

// MARK: - Segmented semicircle gauge (reference: calorie/goal gauge)
/// A 180° gauge made of discrete radial segments. Filled segments use the brand
/// gradient; the rest use a soft track. A circular icon chip sits at the apex and
/// the metric stack is centered below the arc.
struct SegmentedGauge<Center: View>: View {
    var progress: Double                 // 0...1
    var segmentCount: Int = 24
    var lineWidth: CGFloat = 13
    var apexIcon: String? = nil
    var apexIconColor: Color = .cvBrand
    @ViewBuilder var center: () -> Center

    private var filled: Int { max(0, min(segmentCount, Int((progress * Double(segmentCount)).rounded()))) }

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let radius = w / 2 - lineWidth / 2
            let cx = w / 2
            let cy = geo.size.height            // center sits at the bottom edge
            ZStack {
                ForEach(0..<segmentCount, id: \.self) { i in
                    let t = Double(i) / Double(segmentCount - 1)
                    let rotation = -90.0 + t * 180.0      // sweep left → top → right
                    let isOn = i < filled
                    Capsule()
                        .fill(isOn
                              ? AnyShapeStyle(LinearGradient.cvBrandGradient)
                              : AnyShapeStyle(Color.cvSystemFill))
                        .frame(width: lineWidth, height: lineWidth * (isOn ? 1.9 : 1.55))
                        .offset(y: -radius)
                        .rotationEffect(.degrees(rotation))
                        .position(x: cx, y: cy)
                        .animation(.spring(response: 0.6, dampingFraction: 0.72)
                            .delay(Double(i) * 0.012), value: filled)
                }

                VStack(spacing: 2) {
                    if let apexIcon {
                        Image(systemName: apexIcon)
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(apexIconColor)
                            .frame(width: 38, height: 38)
                            .background(Color.cvSurface)
                            .clipShape(Circle())
                            .shadow(color: .black.opacity(0.08), radius: 8, x: 0, y: 4)
                            .padding(.bottom, 2)
                    }
                    center()
                }
                .position(x: cx, y: cy - radius * 0.34)
            }
        }
        .aspectRatio(2.0, contentMode: .fit)
    }
}

// MARK: - Legacy alias (keeps existing call sites compiling)
enum CVColor {
    static let paper      = Color.cvAppBackground
    static let panel      = Color.cvSurface
    static let ink        = Color.cvInk
    static let muted      = Color.cvInkSecondary
    static let border     = Color.cvSeparator
    static let purple     = Color.cvBrand    // renamed but kept for compat
    static let purpleSoft = Color.cvBrandSoft
    static let amberSoft  = Color.orange.opacity(0.12)
    static let greenSoft  = Color.green.opacity(0.12)
}

enum CVLayout {
    static let floatingTabContentPadding: CGFloat = 112
}

// MARK: - Card modifier
struct CVCardModifier: ViewModifier {
    var padding: CGFloat = 18
    var radius: CGFloat = 22
    var isRaised: Bool = false

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Color.cvSurface)
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(.white.opacity(0.85), lineWidth: 1)
            )
            .shadow(
                color: .black.opacity(isRaised ? 0.09 : 0.055),
                radius: isRaised ? 28 : 18,
                x: 0,
                y: isRaised ? 14 : 8
            )
    }
}

extension View {
    func cvCard(padding: CGFloat = 18, radius: CGFloat = 22, raised: Bool = false) -> some View {
        modifier(CVCardModifier(padding: padding, radius: radius, isRaised: raised))
    }

    func cvPrimaryActionButton() -> some View {
        buttonStyle(CVPrimaryActionButtonStyle())
    }

    func cvSecondaryActionButton() -> some View {
        buttonStyle(CVSecondaryActionButtonStyle())
    }

    @ViewBuilder
    func cvURLTextField() -> some View {
#if os(iOS)
        self.textInputAutocapitalization(.never).keyboardType(.URL)
#else
        self
#endif
    }

    @ViewBuilder
    func cvInlineNavigationTitle() -> some View {
#if os(iOS)
        self.navigationBarTitleDisplayMode(.inline)
#else
        self
#endif
    }
}

struct CVPrimaryActionButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(.white)
            .background(LinearGradient.cvBrandGradient)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: Color.cvBrand.opacity(configuration.isPressed ? 0.10 : 0.22), radius: 16, x: 0, y: 8)
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

struct CVSecondaryActionButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(Color.cvBrand)
            .background(Color.cvBrandSoft)
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

extension ToolbarItemPlacement {
    static var cvTopBarLeading: ToolbarItemPlacement {
        #if os(iOS)
        .topBarLeading
        #else
        .cancellationAction
        #endif
    }

    static var cvTopBarTrailing: ToolbarItemPlacement {
        #if os(iOS)
        .topBarTrailing
        #else
        .confirmationAction
        #endif
    }
}

// MARK: - Reusable UI atoms

struct PillLabel: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption2.weight(.bold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(color.opacity(0.11))
            .clipShape(Capsule())
    }
}

struct ScoreRing: View {
    let score: Int
    let label: String
    var size: CGFloat = 72

    private var ringColor: Color {
        score >= 80 ? .green : score >= 60 ? .cvBrand : .orange
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.cvSystemFill, lineWidth: 8)
            Circle()
                .trim(from: 0, to: CGFloat(score) / 100)
                .stroke(ringColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 1) {
                Text("\(score)")
                    .font(.system(size: size * 0.27, weight: .black, design: .rounded))
                    .foregroundStyle(.primary)
                Text(label)
                    .font(.system(size: size * 0.15, weight: .bold))
                    .foregroundStyle(.secondary)
            }
        }
        .frame(width: size, height: size)
        .animation(.spring(response: 0.6, dampingFraction: 0.78), value: score)
    }
}

// MARK: - ResumeTemplate colors
extension ResumeTemplateID {
    var accentColor: Color {
        switch self {
        case .modern:  return Color.cvBrand
        case .classic: return Color.cvLabel
        case .minimal: return Color.cvSystemTeal
        }
    }
}

struct StatTile: View {
    let value: String
    let label: String
    let icon: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: icon)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(tint)
                .frame(width: 38, height: 38)
                .background(tint.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            Spacer(minLength: 2)
            Text(value)
                .font(.title2.weight(.black))
                .foregroundStyle(.primary)
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color.cvSurface)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(.white.opacity(0.85), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.055), radius: 18, x: 0, y: 8)
    }
}

// MARK: - Circular metric ring (reusable in dashboard)
struct CircularMetric: View {
    let value: String
    let progress: Double   // 0...1
    let color: Color
    var size: CGFloat = 52

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.15), lineWidth: 5)
            Circle()
                .trim(from: 0, to: min(1, progress))
                .stroke(color, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text(value)
                .font(.system(size: size * 0.22, weight: .black, design: .rounded))
                .foregroundStyle(color)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
        }
        .frame(width: size, height: size)
    }
}
