import Foundation

/// Carica i segreti da Secrets.plist (NON committato — vedi README e .gitignore).
enum SecretsLoader {
    static var geminiAPIKey: String? {
        guard
            let url = Bundle.main.url(forResource: "Secrets", withExtension: "plist"),
            let data = try? Data(contentsOf: url),
            let plist = try? PropertyListSerialization.propertyList(from: data, format: nil) as? [String: Any]
        else {
            return nil
        }
        return plist["GEMINI_API_KEY"] as? String
    }
}
