// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "CareerVividMobileMVP",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "CareerVividMobileMVP",
            targets: ["CareerVividMobileMVP"]
        )
    ],
    targets: [
        .target(name: "CareerVividMobileMVP"),
        .testTarget(
            name: "CareerVividMobileMVPTests",
            dependencies: ["CareerVividMobileMVP"]
        )
    ]
)
