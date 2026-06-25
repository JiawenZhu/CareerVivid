import SwiftUI

struct AuthView: View {
    @ObservedObject var store: AuthSessionStore

    @State private var action: AuthSessionStore.AuthAction = .signIn
    @State private var email = ""
    @State private var password = ""

    private var primaryTitle: String {
        action == .signIn ? "Sign in" : "Create account"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 22) {
                    brandHeader
                    providerButtons
                    emailForm
                    guestButton
                }
                .padding(24)
                .padding(.top, 28)
            }
            .background(Color.cvSystemGroupedBackground.ignoresSafeArea())
        }
        .tint(Color.cvBrand)
    }

    private var brandHeader: some View {
        VStack(alignment: .leading, spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color.cvBrand)
                Image(systemName: "sparkles")
                    .font(.title.weight(.bold))
                    .foregroundStyle(.white)
            }
            .frame(width: 58, height: 58)

            VStack(alignment: .leading, spacing: 6) {
                Text("CareerVivid")
                    .font(.largeTitle.weight(.black))
                Text("Sign in to sync resumes, jobs, and interview reports.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var providerButtons: some View {
        VStack(spacing: 10) {
            Button {
                Task { await store.signInWithGoogle() }
            } label: {
                HStack(spacing: 10) {
                    Text("G")
                        .font(.headline.weight(.black))
                        .frame(width: 26, height: 26)
                        .foregroundStyle(Color.cvBrand)
                        .background(Color.cvBrandSoft)
                        .clipShape(Circle())
                    Text("Continue with Google")
                        .font(.headline.weight(.semibold))
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.secondary)
                }
                .foregroundStyle(.primary)
                .cvCard()
            }
            .buttonStyle(.plain)

            if let message = store.errorMessage {
                AuthMessage(message: message)
            }
        }
    }

    private var emailForm: some View {
        VStack(spacing: 16) {
            Picker("Auth action", selection: $action) {
                Text("Sign in").tag(AuthSessionStore.AuthAction.signIn)
                Text("Create").tag(AuthSessionStore.AuthAction.createAccount)
            }
            .pickerStyle(.segmented)

            VStack(spacing: 12) {
                AuthTextField(
                    title: "Email",
                    placeholder: "you@example.com",
                    text: $email,
                    systemImage: "envelope.fill",
                    isSecure: false
                )
                AuthTextField(
                    title: "Password",
                    placeholder: "At least 6 characters",
                    text: $password,
                    systemImage: "lock.fill",
                    isSecure: true
                )
            }

            Button {
                submitEmail()
            } label: {
                HStack {
                    Spacer()
                    if store.isSubmitting {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: action == .signIn ? "arrow.right.circle.fill" : "person.crop.circle.badge.plus")
                        Text(primaryTitle)
                            .font(.headline.weight(.bold))
                    }
                    Spacer()
                }
                .foregroundStyle(.white)
                .padding(.vertical, 15)
                .background(Color.cvBrand)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .buttonStyle(.plain)
            .disabled(store.isSubmitting)
            .opacity(store.isSubmitting ? 0.78 : 1)
        }
        .cvCard()
    }

    private var guestButton: some View {
        Button {
            Task { await store.continueAsGuest() }
        } label: {
            HStack {
                Image(systemName: "person.fill.questionmark")
                Text("Continue as guest")
                    .font(.subheadline.weight(.semibold))
                Spacer()
            }
            .foregroundStyle(Color.cvBrand)
            .padding(16)
            .background(Color.cvBrandSoft)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(store.isSubmitting)
    }

    private func submitEmail() {
        let normalizedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        Task {
            switch action {
            case .signIn:
                await store.signIn(email: normalizedEmail, password: password)
            case .createAccount:
                await store.createAccount(email: normalizedEmail, password: password)
            }
        }
    }
}

private struct AuthMessage: View {
    let message: String

    var body: some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: "info.circle.fill")
                .foregroundStyle(Color.cvBrand)
            Text(message)
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(Color.cvBrandSoft)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct AuthTextField: View {
    let title: String
    let placeholder: String
    @Binding var text: String
    let systemImage: String
    let isSecure: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption.weight(.bold))
                .foregroundStyle(.secondary)

            HStack(spacing: 10) {
                Image(systemName: systemImage)
                    .foregroundStyle(Color.cvBrand)
                    .frame(width: 22)
                if isSecure {
                    SecureField(placeholder, text: $text)
                        .textContentType(.password)
                } else {
                    TextField(placeholder, text: $text)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
            }
            .padding(14)
            .background(Color.cvSystemBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color.cvSeparator.opacity(0.45), lineWidth: 1)
            )
        }
    }
}
