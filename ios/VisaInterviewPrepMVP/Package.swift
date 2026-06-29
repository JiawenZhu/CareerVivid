// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "VisaInterviewPrepMVP",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "VisaInterviewPrepMVP",
            targets: ["VisaInterviewPrepMVP"]
        )
    ],
    targets: [
        .target(name: "VisaInterviewPrepMVP"),
        .testTarget(
            name: "VisaInterviewPrepMVPTests",
            dependencies: ["VisaInterviewPrepMVP"]
        )
    ]
)
