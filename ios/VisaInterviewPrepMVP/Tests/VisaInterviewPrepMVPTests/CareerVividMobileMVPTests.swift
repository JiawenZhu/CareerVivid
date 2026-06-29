import XCTest
@testable import CareerVividMobileMVP

final class CareerVividMobileMVPTests: XCTestCase {
    func testCapturedLinkedInJobUsesImportCompany() {
        let job = makeCapturedJob(
            from: "https://www.linkedin.com/jobs/view/123",
            existingCount: 3
        )

        XCTAssertEqual(job.title, "Mobile captured role 4")
        XCTAssertEqual(job.company, "LinkedIn Import")
        XCTAssertEqual(job.stage, .saved)
    }

    func testSampleDataHasMVPContent() {
        XCTAssertGreaterThanOrEqual(SampleCareerVividData.jobs.count, 3)
        XCTAssertGreaterThanOrEqual(SampleCareerVividData.interviews.count, 2)
        XCTAssertEqual(SampleCareerVividData.resume.matchScore, 95)
        XCTAssertFalse(SampleCareerVividData.actions.isEmpty)
    }
}
