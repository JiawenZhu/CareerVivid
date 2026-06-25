import Foundation

@MainActor
final class AuthSessionStore: ObservableObject {
    enum AuthAction {
        case signIn
        case createAccount
    }

    @Published private(set) var session: CVFirebaseSession?
    @Published private(set) var isLoading = true
    @Published private(set) var isSubmitting = false
    @Published var errorMessage: String?

    private var acceptedGuestForLaunch = false

    var shouldShowAuthGate: Bool {
        if isLoading { return false }
        guard let session else { return true }
        return session.isAnonymous && !acceptedGuestForLaunch
    }

    var displayName: String {
        if let email = session?.email, !email.isEmpty {
            return email
        }
        return session?.isAnonymous == true ? "Guest session" : "CareerVivid"
    }

    func load() async {
        isLoading = true
        session = await CVFirebaseAuth.shared.currentSession()
        isLoading = false
    }

    func continueAsGuest() async {
        await submitSession(acceptGuest: true) {
            try await CVFirebaseAuth.shared.continueAnonymously()
        }
    }

    func signIn(email: String, password: String) async {
        await submitSession(acceptGuest: false) {
            try await CVFirebaseAuth.shared.signInWithEmail(email: email, password: password)
        }
    }

    func createAccount(email: String, password: String) async {
        await submitSession(acceptGuest: false) {
            try await CVFirebaseAuth.shared.createEmailAccount(email: email, password: password)
        }
    }

    func signInWithGoogle() async {
        await submitSession(acceptGuest: false) {
            let credential = try await GoogleSignInService.shared.signIn()
            return try await CVFirebaseAuth.shared.signInWithGoogle(
                idToken: credential.idToken,
                accessToken: credential.accessToken
            )
        }
    }

    func signOut() async {
        await CVFirebaseAuth.shared.signOut()
        acceptedGuestForLaunch = false
        session = nil
    }

    private func submitSession(
        acceptGuest: Bool,
        _ operation: @escaping () async throws -> CVFirebaseSession
    ) async {
        guard !isSubmitting else { return }
        isSubmitting = true
        errorMessage = nil
        do {
            let nextSession = try await operation()
            acceptedGuestForLaunch = acceptGuest
            session = nextSession
        } catch {
            errorMessage = error.localizedDescription
        }
        isSubmitting = false
    }
}
