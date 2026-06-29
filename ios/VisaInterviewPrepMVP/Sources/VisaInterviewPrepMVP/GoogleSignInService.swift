import AuthenticationServices
import CryptoKit
import Foundation
import Security
#if os(iOS)
import UIKit
#else
import AppKit
#endif

struct GoogleOAuthCredential: Sendable {
    var idToken: String
    var accessToken: String?
}

@MainActor
final class GoogleSignInService: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = GoogleSignInService()

    private let clientID = "371634100960-057fom53d3c7rpd0ebql7mifqluhkppg.apps.googleusercontent.com"
    private let callbackScheme = "com.googleusercontent.apps.371634100960-057fom53d3c7rpd0ebql7mifqluhkppg"
    private var activeSession: ASWebAuthenticationSession?

    private override init() {
        super.init()
    }

    func signIn() async throws -> GoogleOAuthCredential {
        let state = UUID().uuidString
        let verifier = try Self.randomCodeVerifier()
        let challenge = Self.codeChallenge(for: verifier)
        let redirectURI = "\(callbackScheme):/oauth2redirect/google"

        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientID),
            URLQueryItem(name: "redirect_uri", value: redirectURI),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: "openid email profile"),
            URLQueryItem(name: "code_challenge", value: challenge),
            URLQueryItem(name: "code_challenge_method", value: "S256"),
            URLQueryItem(name: "state", value: state),
            URLQueryItem(name: "prompt", value: "select_account")
        ]
        guard let authURL = components.url else { throw GoogleSignInError.invalidOAuthURL }

        let callbackURL = try await authenticate(with: authURL)
        let callback = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)
        guard callback?.queryItems?.first(where: { $0.name == "state" })?.value == state else {
            throw GoogleSignInError.invalidOAuthState
        }
        if let error = callback?.queryItems?.first(where: { $0.name == "error" })?.value {
            throw GoogleSignInError.oauth(error)
        }
        guard let code = callback?.queryItems?.first(where: { $0.name == "code" })?.value else {
            throw GoogleSignInError.missingAuthorizationCode
        }

        return try await exchangeCode(code, verifier: verifier, redirectURI: redirectURI)
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        #if os(iOS)
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
        #else
        NSApplication.shared.mainWindow ?? NSWindow()
        #endif
    }

    private func authenticate(with url: URL) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            var didResume = false
            func resume(_ result: Result<URL, Error>) {
                guard !didResume else { return }
                didResume = true
                switch result {
                case .success(let url):
                    continuation.resume(returning: url)
                case .failure(let error):
                    continuation.resume(throwing: error)
                }
            }

            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: callbackScheme) { callbackURL, error in
                Task { @MainActor in
                    self.activeSession = nil
                    if let callbackURL {
                        resume(.success(callbackURL))
                    } else if let error {
                        resume(.failure(error))
                    } else {
                        resume(.failure(GoogleSignInError.cancelled))
                    }
                }
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            activeSession = session

            if !session.start() {
                activeSession = nil
                resume(.failure(GoogleSignInError.couldNotStart))
            }
        }
    }

    private func exchangeCode(
        _ code: String,
        verifier: String,
        redirectURI: String
    ) async throws -> GoogleOAuthCredential {
        let url = URL(string: "https://oauth2.googleapis.com/token")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpBody = formEncoded([
            "code": code,
            "client_id": clientID,
            "redirect_uri": redirectURI,
            "grant_type": "authorization_code",
            "code_verifier": verifier
        ])

        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 200
        guard (200..<300).contains(status) else {
            throw GoogleSignInError.tokenExchangeFailed
        }

        let token = try JSONDecoder().decode(GoogleTokenResponse.self, from: data)
        guard let idToken = token.idToken else { throw GoogleSignInError.missingIDToken }
        return GoogleOAuthCredential(idToken: idToken, accessToken: token.accessToken)
    }

    private static func randomCodeVerifier() throws -> String {
        var bytes = [UInt8](repeating: 0, count: 64)
        let result = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        guard result == errSecSuccess else { throw GoogleSignInError.randomGenerationFailed }
        return base64URL(Data(bytes)).prefix(86).description
    }

    private static func codeChallenge(for verifier: String) -> String {
        let digest = SHA256.hash(data: Data(verifier.utf8))
        return base64URL(Data(digest))
    }

    private static func base64URL(_ data: Data) -> String {
        data.base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    private func formEncoded(_ values: [String: String]) -> Data {
        var components = URLComponents()
        components.queryItems = values.map { URLQueryItem(name: $0.key, value: $0.value) }
        return Data((components.percentEncodedQuery ?? "").utf8)
    }
}

private struct GoogleTokenResponse: Decodable {
    var accessToken: String?
    var idToken: String?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case idToken = "id_token"
    }
}

enum GoogleSignInError: Error, LocalizedError {
    case invalidOAuthURL
    case invalidOAuthState
    case missingAuthorizationCode
    case tokenExchangeFailed
    case missingIDToken
    case randomGenerationFailed
    case couldNotStart
    case cancelled
    case oauth(String)

    var errorDescription: String? {
        switch self {
        case .invalidOAuthURL, .couldNotStart:
            return "Could not start Google sign-in."
        case .invalidOAuthState:
            return "Google sign-in could not be verified. Please try again."
        case .missingAuthorizationCode, .tokenExchangeFailed, .missingIDToken:
            return "Google sign-in did not finish. Please try again."
        case .randomGenerationFailed:
            return "Could not prepare a secure Google sign-in request."
        case .cancelled:
            return "Google sign-in was cancelled."
        case .oauth(let message):
            return "Google sign-in failed: \(message)"
        }
    }
}
