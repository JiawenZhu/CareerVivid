import Foundation
import Security

enum CVFirebaseAuthProvider: String, Sendable {
    case anonymous
    case email
    case google
}

struct CVFirebaseSession: Equatable, Sendable {
    var uid: String
    var email: String?
    var provider: CVFirebaseAuthProvider

    var isAnonymous: Bool { provider == .anonymous }
}

// MARK: - Firebase Auth REST client

/// Signs into CareerVivid's Firebase project using the Identity Toolkit REST API.
/// Email/password auth uses the same Firebase users as the web app; anonymous
/// auth remains available as a fallback for quick simulator testing.
actor CVFirebaseAuth {

    // MARK: Shared singleton
    static let shared = CVFirebaseAuth()

    // MARK: Project constants (mirrors VITE_FIREBASE_* in .env)
    nonisolated let projectId = "jastalk-firebase"
    nonisolated let region    = "us-west1"
    private  let apiKey       = "AIzaSyDoFoPoaPMi6HkqsA1vn6oDPokG9btVJ3g"

    // MARK: Persistence keys
    private let keychainRefreshAccount = "cv_fb_refresh_token"
    private let udUIDKey     = "cv_fb_uid"
    private let udEmailKey   = "cv_fb_email"
    private let udProviderKey = "cv_fb_provider"
    private let legacyUDRefreshKey = "cv_fb_refresh_token"

    // MARK: In-memory cache
    private var cachedUID:   String?
    private var cachedToken: String?
    private var cachedEmail: String?
    private var cachedProvider: CVFirebaseAuthProvider?
    private var tokenExp:    Date?

    private init() {}

    // MARK: - Public API

    /// Returns a valid `(uid, idToken)`.
    /// Transparently signs in anonymously on the first call, or refreshes a stale token.
    func authToken() async throws -> (uid: String, idToken: String) {
        if let uid   = cachedUID,
           let token = cachedToken,
           let exp   = tokenExp,
           exp > Date().addingTimeInterval(120) {       // 2-min buffer
            return (uid, token)
        }
        if let refresh = storedRefreshToken() {
            return try await refreshIdToken(refresh)
        }
        return try await signInAnonymously()
    }

    func currentSession() async -> CVFirebaseSession? {
        guard storedRefreshToken() != nil else { return nil }
        let uid = cachedUID ?? UserDefaults.standard.string(forKey: udUIDKey)
        guard let uid, !uid.isEmpty else { return nil }
        let provider = cachedProvider ?? storedProvider()
        let email = cachedEmail ?? UserDefaults.standard.string(forKey: udEmailKey)
        return CVFirebaseSession(uid: uid, email: email, provider: provider)
    }

    @discardableResult
    func continueAnonymously() async throws -> CVFirebaseSession {
        let token = try await authToken()
        return CVFirebaseSession(uid: token.uid, email: nil, provider: .anonymous)
    }

    @discardableResult
    func signInWithEmail(email rawEmail: String, password: String) async throws -> CVFirebaseSession {
        try validate(email: rawEmail, password: password)
        let payload: [String: Any] = [
            "email": rawEmail.trimmingCharacters(in: .whitespacesAndNewlines),
            "password": password,
            "returnSecureToken": true
        ]
        return try await emailAuth(endpoint: "accounts:signInWithPassword", payload: payload)
    }

    @discardableResult
    func createEmailAccount(email rawEmail: String, password: String) async throws -> CVFirebaseSession {
        try validate(email: rawEmail, password: password)
        let payload: [String: Any] = [
            "email": rawEmail.trimmingCharacters(in: .whitespacesAndNewlines),
            "password": password,
            "returnSecureToken": true
        ]
        return try await emailAuth(endpoint: "accounts:signUp", payload: payload)
    }

    @discardableResult
    func signInWithGoogle(idToken: String, accessToken: String?) async throws -> CVFirebaseSession {
        var idpValues = [
            "id_token": idToken,
            "providerId": "google.com"
        ]
        if let accessToken, !accessToken.isEmpty {
            idpValues["access_token"] = accessToken
        }

        let payload: [String: Any] = [
            "postBody": formEncodedQuery(idpValues),
            "requestUri": "https://careervivid.app",
            "returnIdpCredential": true,
            "returnSecureToken": true
        ]
        return try await emailAuth(endpoint: "accounts:signInWithIdp", payload: payload, provider: .google)
    }

    func signOut() {
        clearCache()
    }

    // MARK: - Private REST calls

    private func signInAnonymously() async throws -> (uid: String, idToken: String) {
        let url = URL(string:
            "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=\(apiKey)")!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: ["returnSecureToken": true])

        let data = try await performJSON(req)
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]

        guard
            let token   = json["idToken"]       as? String,
            let uid     = json["localId"]        as? String,
            let refresh = json["refreshToken"]   as? String,
            let expStr  = json["expiresIn"]      as? String,
            let exp     = Double(expStr)
        else { throw CVFirebaseAuthError.signInFailed }

        persist(uid: uid, token: token, refresh: refresh, expiresIn: exp, provider: .anonymous, email: nil)
        return (uid, token)
    }

    private func emailAuth(
        endpoint: String,
        payload: [String: Any],
        provider: CVFirebaseAuthProvider = .email
    ) async throws -> CVFirebaseSession {
        let url = URL(string: "https://identitytoolkit.googleapis.com/v1/\(endpoint)?key=\(apiKey)")!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let data = try await performJSON(req)
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]

        guard
            let token = json["idToken"] as? String,
            let uid = json["localId"] as? String,
            let refresh = json["refreshToken"] as? String,
            let expStr = json["expiresIn"] as? String,
            let exp = Double(expStr)
        else { throw CVFirebaseAuthError.signInFailed }

        let email = json["email"] as? String
        persist(uid: uid, token: token, refresh: refresh, expiresIn: exp, provider: provider, email: email)
        return CVFirebaseSession(uid: uid, email: email, provider: provider)
    }

    private func refreshIdToken(_ refreshToken: String) async throws -> (uid: String, idToken: String) {
        let url = URL(string:
            "https://securetoken.googleapis.com/v1/token?key=\(apiKey)")!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        req.httpBody = formEncoded([
            "grant_type": "refresh_token",
            "refresh_token": refreshToken
        ])

        let storedProvider = storedProvider()
        let data: Data
        do {
            data = try await performJSON(req)
        } catch {
            clearCache()
            if storedProvider == .anonymous {
                return try await signInAnonymously()
            }
            throw CVFirebaseAuthError.sessionExpired
        }
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]

        guard
            let token  = json["id_token"]   as? String,
            let expStr = json["expires_in"]  as? String,
            let exp    = Double(expStr)
        else {
            clearCache()
            if storedProvider == .anonymous {
                return try await signInAnonymously()
            }
            throw CVFirebaseAuthError.sessionExpired
        }

        let uid = (json["user_id"]  as? String)
               ?? cachedUID
               ?? UserDefaults.standard.string(forKey: udUIDKey)
               ?? ""
        let newRefresh = (json["refresh_token"] as? String) ?? refreshToken
        persist(
            uid: uid,
            token: token,
            refresh: newRefresh,
            expiresIn: exp,
            provider: storedProvider,
            email: UserDefaults.standard.string(forKey: udEmailKey)
        )
        return (uid, token)
    }

    // MARK: - Cache helpers

    private func persist(
        uid: String,
        token: String,
        refresh: String,
        expiresIn: Double,
        provider: CVFirebaseAuthProvider,
        email: String?
    ) {
        cachedUID   = uid
        cachedToken = token
        cachedEmail = email
        cachedProvider = provider
        tokenExp    = Date().addingTimeInterval(expiresIn)
        UserDefaults.standard.set(uid,     forKey: udUIDKey)
        storeRefreshToken(refresh)
        UserDefaults.standard.set(provider.rawValue, forKey: udProviderKey)
        if let email {
            UserDefaults.standard.set(email, forKey: udEmailKey)
        } else {
            UserDefaults.standard.removeObject(forKey: udEmailKey)
        }
    }

    private func clearCache() {
        cachedUID = nil; cachedToken = nil; cachedEmail = nil; cachedProvider = nil; tokenExp = nil
        deleteRefreshToken()
        UserDefaults.standard.removeObject(forKey: legacyUDRefreshKey)
        UserDefaults.standard.removeObject(forKey: udUIDKey)
        UserDefaults.standard.removeObject(forKey: udEmailKey)
        UserDefaults.standard.removeObject(forKey: udProviderKey)
    }

    private func storedProvider() -> CVFirebaseAuthProvider {
        let value = UserDefaults.standard.string(forKey: udProviderKey)
        return CVFirebaseAuthProvider(rawValue: value ?? "") ?? .anonymous
    }

    private func storedRefreshToken() -> String? {
        if let token = keychainRefreshToken() {
            return token
        }
        guard let legacyToken = UserDefaults.standard.string(forKey: legacyUDRefreshKey) else {
            return nil
        }
        storeRefreshToken(legacyToken)
        UserDefaults.standard.removeObject(forKey: legacyUDRefreshKey)
        return legacyToken
    }

    private func storeRefreshToken(_ token: String) {
        guard let data = token.data(using: .utf8) else { return }
        let query = refreshTokenKeychainQuery()
        SecItemDelete(query as CFDictionary)

        var attributes = query
        attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(attributes as CFDictionary, nil)
    }

    private func keychainRefreshToken() -> String? {
        var query = refreshTokenKeychainQuery()
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess,
              let data = item as? Data,
              let token = String(data: data, encoding: .utf8),
              !token.isEmpty
        else { return nil }
        return token
    }

    private func deleteRefreshToken() {
        SecItemDelete(refreshTokenKeychainQuery() as CFDictionary)
    }

    private func refreshTokenKeychainQuery() -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Bundle.main.bundleIdentifier ?? "app.careervivid.mobilemvp",
            kSecAttrAccount as String: keychainRefreshAccount
        ]
    }

    private func validate(email: String, password: String) throws {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmedEmail.contains("@"), trimmedEmail.contains(".") else {
            throw CVFirebaseAuthError.invalidEmail
        }
        guard password.count >= 6 else {
            throw CVFirebaseAuthError.weakPassword
        }
    }

    private func performJSON(_ request: URLRequest) async throws -> Data {
        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 200
        guard (200..<300).contains(status) else {
            throw parseFirebaseError(data: data) ?? CVFirebaseAuthError.signInFailed
        }
        return data
    }

    private func parseFirebaseError(data: Data) -> CVFirebaseAuthError? {
        guard
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let error = json["error"] as? [String: Any],
            let message = error["message"] as? String
        else { return nil }
        return .firebase(message)
    }

    private func formEncoded(_ values: [String: String]) -> Data {
        Data(formEncodedQuery(values).utf8)
    }

    private func formEncodedQuery(_ values: [String: String]) -> String {
        var components = URLComponents()
        components.queryItems = values.map { URLQueryItem(name: $0.key, value: $0.value) }
        return components.percentEncodedQuery ?? ""
    }
}

// MARK: - Errors

enum CVFirebaseAuthError: Error, LocalizedError {
    case signInFailed
    case invalidEmail
    case weakPassword
    case sessionExpired
    case firebase(String)

    public var errorDescription: String? {
        switch self {
        case .signInFailed:
            return "Could not connect to CareerVivid. Please check your internet connection."
        case .invalidEmail:
            return "Enter a valid email address."
        case .weakPassword:
            return "Password must be at least 6 characters."
        case .sessionExpired:
            return "Your session expired. Please sign in again."
        case .firebase(let message):
            return Self.readableFirebaseMessage(message)
        }
    }

    private static func readableFirebaseMessage(_ message: String) -> String {
        switch message {
        case "EMAIL_NOT_FOUND", "INVALID_PASSWORD", "INVALID_LOGIN_CREDENTIALS":
            return "The email or password is incorrect."
        case "EMAIL_EXISTS":
            return "An account already exists for this email."
        case "USER_DISABLED":
            return "This account has been disabled."
        case "TOO_MANY_ATTEMPTS_TRY_LATER":
            return "Too many attempts. Please try again later."
        default:
            return message.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }
}
