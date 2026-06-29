# CareerVivid Mobile MVP

SwiftUI prototype for a lightweight B2C iOS companion app. It is designed as a fast validation build before committing to a full Firebase-backed iOS product.

## MVP Scope

- Today: next actions, saved roles, match overview.
- Capture: paste or share a job URL and save it to the mobile pipeline.
- Practice: mobile-first mock interview entry point.
- Resume: mobile resume list and editor using the same data shape as the CareerVivid web app.

The default build still uses local sample data so the MVP can run without sign-in. The resume layer now includes the Web-compatible schema, Firestore REST sync interface, and `tailorResume` callable function interface for AI actions.

## Resume Sync Contract

The mobile resume editor maps to the existing web database shape:

```text
users/{uid}/resumes/{resumeId}
```

Supported service actions:

- Load resumes from CareerVivid Firestore.
- Create or update a resume using the same top-level fields as the web `ResumeData`.
- Preserve the remote Firestore document id on the mobile model.
- Call `tailorResume` with existing web actions: `analyze`, `tailor`, `refine`, `condense`, and `ats_inject`.

To use the live service, initialize `CareerVividRESTResumeService` with:

```swift
let service = CareerVividRESTResumeService(
    config: CareerVividRESTConfig(
        uid: "<firebase-user-id>",
        idToken: "<firebase-id-token>"
    )
)
```

Then inject it into `ResumeEditorStore(service:)`.

## Open The MVP

```bash
cd /Users/jiawenzhu/Developer/careervivid-release/ios/CareerVividMobileMVP
xcodegen generate
open CareerVividMobileMVP.xcodeproj
```

In Xcode, select the `CareerVividMobileMVP` scheme and run it on an iPhone simulator.

## Validation

```bash
cd /Users/jiawenzhu/Developer/careervivid-release/ios/CareerVividMobileMVP
swiftc -parse-as-library -typecheck App/CareerVividMobileMVPApp.swift Sources/CareerVividMobileMVP/*.swift
```

With full Xcode installed and selected, run:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -project CareerVividMobileMVP.xcodeproj -scheme CareerVividMobileMVP -destination 'platform=iOS Simulator,name=iPhone 16' build
swift test
```

Current local limitation: this machine is selected to `/Library/Developer/CommandLineTools`, so `xcodebuild`, XCTest, and iOS Simulator are unavailable until full Xcode is installed and selected.
