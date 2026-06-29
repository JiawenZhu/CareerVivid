// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "GreenCardInterviewMVP",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "GreenCardInterviewMVP",
            targets: ["GreenCardInterviewMVP"]
        )
    ],
    targets: [
        .target(name: "GreenCardInterviewMVP"),
        .testTarget(
            name: "GreenCardInterviewMVPTests",
            dependencies: ["GreenCardInterviewMVP"]
        )
    ]
)
