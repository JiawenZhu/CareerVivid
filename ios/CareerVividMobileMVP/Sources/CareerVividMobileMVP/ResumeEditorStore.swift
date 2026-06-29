import Combine
import Foundation

public enum ResumeStoreStatus: Equatable, Sendable {
    case idle
    case loading
    case saving
    case applyingAI
    case creatingFromCoach
    case deleting
    case failed(String)
}

@MainActor
public final class ResumeEditorStore: ObservableObject {
    @Published public private(set) var resumes: [EditableResume]
    @Published public private(set) var status: ResumeStoreStatus = .idle
    @Published public private(set) var lastAIResult: ResumeAIResult?

    private var service: ResumeSyncing
    private var didLoad = false

    public init(service: ResumeSyncing = MockCareerVividResumeService()) {
        self.service = service
        self.resumes = [SampleCareerVividData.editableResume]
    }

    public func loadIfNeeded() async {
        guard !didLoad else { return }
        didLoad = true

        // Upgrade from mock to real service via anonymous Firebase auth
        await upgradeToRealService()

        status = .loading
        do {
            let loaded = try await service.loadResumes()
            resumes = loaded.isEmpty ? [SampleCareerVividData.editableResume] : loaded
            status = .idle
        } catch {
            // Keep sample data visible even if load fails
            status = .idle
        }
    }

    // MARK: - Real service wiring

    /// Swaps the mock service for the REST service backed by anonymous Firebase auth.
    /// Silently keeps the mock if auth or network is unavailable.
    private func upgradeToRealService() async {
        guard service is MockCareerVividResumeService else { return }
        do {
            let (uid, idToken) = try await CVFirebaseAuth.shared.authToken()
            let config = CareerVividRESTConfig(uid: uid, idToken: idToken)
            service = CareerVividRESTResumeService(config: config)
        } catch {
            // No network or auth failure — keep mock for offline demo
        }
    }

    public func makeBlankDraft() -> EditableResume {
        EditableResume()
    }

    public func beginBlankDraft() -> EditableResume {
        let draft = makeBlankDraft()
        resumes.insert(draft, at: 0)
        return draft
    }

    public func save(_ resume: EditableResume) {
        Task {
            await saveAsync(resume)
        }
    }

    @discardableResult
    public func createResumeFromCoachTranscript(_ transcript: String, title: String = "Resume Coach Draft") async -> EditableResume? {
        status = .creatingFromCoach
        do {
            let created = try await service.createResumeFromCoachTranscript(transcript, title: title)
            upsert(created)
            status = .idle
            return created
        } catch {
            status = .failed(error.localizedDescription)
            return nil
        }
    }

    public func discardDraftIfEmpty(_ resume: EditableResume) {
        guard resume.remoteId == nil,
              resume.personalInfo.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              resume.experiences.isEmpty else {
            return
        }
        resumes.removeAll { $0.id == resume.id }
    }

    public func delete(_ resume: EditableResume) {
        Task {
            await deleteAsync(resume)
        }
    }

    public func applyAI(
        action: ResumeAIAction,
        to resume: EditableResume,
        jobDescription: String = "",
        instruction: String = ""
    ) {
        Task {
            await applyAIAsync(
                action: action,
                to: resume,
                jobDescription: jobDescription,
                instruction: instruction
            )
        }
    }

    private func saveAsync(_ resume: EditableResume) async {
        status = .saving
        do {
            let saved = resume.remoteId == nil
                ? try await service.createResume(resume)
                : try await service.saveResume(resume)
            upsert(saved)
            status = .idle
        } catch {
            status = .failed(error.localizedDescription)
        }
    }

    private func deleteAsync(_ resume: EditableResume) async {
        guard let index = resumes.firstIndex(where: { $0.id == resume.id }) else { return }
        let removed = resumes.remove(at: index)
        status = .deleting

        do {
            if removed.remoteId != nil {
                try await service.deleteResume(removed)
            }
            status = .idle
        } catch {
            let restoreIndex = min(index, resumes.count)
            resumes.insert(removed, at: restoreIndex)
            status = .failed(error.localizedDescription)
        }
    }

    private func applyAIAsync(
        action: ResumeAIAction,
        to resume: EditableResume,
        jobDescription: String,
        instruction: String
    ) async {
        status = .applyingAI
        do {
            let result = try await service.runAI(
                action: action,
                resume: resume,
                jobDescription: jobDescription,
                instruction: instruction
            )
            lastAIResult = result
            if let updated = result.resume {
                upsert(updated)
            }
            status = .idle
        } catch {
            status = .failed(error.localizedDescription)
        }
    }

    private func upsert(_ resume: EditableResume) {
        if let index = resumes.firstIndex(where: { $0.id == resume.id }) {
            resumes[index] = resume
        } else {
            resumes.insert(resume, at: 0)
        }
    }

}
