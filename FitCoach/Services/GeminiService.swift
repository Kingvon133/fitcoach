import Foundation

// MARK: - JSON generico (per args/response delle funzioni)

enum JSONValue: Codable, Equatable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([String: JSONValue].self) {
            self = .object(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Valore JSON non supportato")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }

    var stringValue: String? {
        if case .string(let value) = self { return value }
        return nil
    }

    var doubleValue: Double? {
        if case .number(let value) = self { return value }
        return nil
    }

    var intValue: Int? {
        doubleValue.map(Int.init)
    }

    var objectValue: [String: JSONValue]? {
        if case .object(let value) = self { return value }
        return nil
    }
}

// MARK: - Tipi richiesta/risposta Gemini (REST v1beta)

struct GeminiContent: Codable {
    var role: String   // "user" | "model"
    var parts: [GeminiPart]
}

struct GeminiPart: Codable {
    var text: String?
    var functionCall: GeminiFunctionCall?
    var functionResponse: GeminiFunctionResponse?

    init(text: String? = nil, functionCall: GeminiFunctionCall? = nil, functionResponse: GeminiFunctionResponse? = nil) {
        self.text = text
        self.functionCall = functionCall
        self.functionResponse = functionResponse
    }
}

struct GeminiFunctionCall: Codable {
    var name: String
    var args: JSONValue?
}

struct GeminiFunctionResponse: Codable {
    var name: String
    var response: JSONValue
}

struct GeminiFunctionDeclaration: Encodable {
    var name: String
    var description: String
    var parameters: JSONValue?
}

struct GeminiTool: Encodable {
    var functionDeclarations: [GeminiFunctionDeclaration]?
    var googleSearch: GeminiEmptyObject?

    struct GeminiEmptyObject: Encodable {}
}

private struct GeminiRequest: Encodable {
    var systemInstruction: GeminiSystemInstruction?
    var contents: [GeminiContent]
    var tools: [GeminiTool]?

    struct GeminiSystemInstruction: Encodable {
        var parts: [GeminiPart]
    }
}

struct GeminiResponse: Decodable {
    var candidates: [Candidate]?
    var error: APIError?

    struct Candidate: Decodable {
        var content: GeminiContent?
        var finishReason: String?
        var groundingMetadata: GroundingMetadata?
    }

    struct GroundingMetadata: Decodable {
        var groundingChunks: [GroundingChunk]?

        struct GroundingChunk: Decodable {
            var web: WebSource?

            struct WebSource: Decodable {
                var uri: String?
                var title: String?
            }
        }
    }

    struct APIError: Decodable {
        var code: Int?
        var message: String?
    }
}

// MARK: - Errori

enum GeminiError: LocalizedError {
    case missingAPIKey
    case invalidResponse
    case rateLimited
    case api(String)

    var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "API key mancante. Aggiungi GEMINI_API_KEY in Secrets.plist (vedi README)."
        case .invalidResponse:
            return "Risposta non valida dal server AI. Riprova."
        case .rateLimited:
            return "Limite gratuito raggiunto, attendi qualche secondo e riprova."
        case .api(let message):
            return "Errore AI: \(message)"
        }
    }
}

// MARK: - Client

struct GeminiService {
    static let defaultModel = "gemini-2.5-flash"

    var model: String = GeminiService.defaultModel
    var session: URLSession = .shared

    /// Chiamata generateContent. `tools` opzionale: functionDeclarations per l'agente,
    /// googleSearch per il grounding (mai insieme nella stessa richiesta — vedi ARCHITECTURE.md).
    func generate(
        systemPrompt: String?,
        history: [GeminiContent],
        tools: [GeminiTool]?
    ) async throws -> GeminiResponse.Candidate {
        guard let apiKey = SecretsLoader.geminiAPIKey, !apiKey.isEmpty else {
            throw GeminiError.missingAPIKey
        }

        var components = URLComponents(string: "https://generativelanguage.googleapis.com/v1beta/models/\(model):generateContent")
        components?.queryItems = [URLQueryItem(name: "key", value: apiKey)]
        guard let url = components?.url else { throw GeminiError.invalidResponse }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 60

        let body = GeminiRequest(
            systemInstruction: systemPrompt.map { .init(parts: [GeminiPart(text: $0)]) },
            contents: history,
            tools: tools
        )
        request.httpBody = try JSONEncoder().encode(body)

        let (data, urlResponse) = try await session.data(for: request)

        if let http = urlResponse as? HTTPURLResponse {
            if http.statusCode == 429 { throw GeminiError.rateLimited }
            if !(200..<300).contains(http.statusCode) {
                let decoded = try? JSONDecoder().decode(GeminiResponse.self, from: data)
                throw GeminiError.api(decoded?.error?.message ?? "HTTP \(http.statusCode)")
            }
        }

        let decoded = try JSONDecoder().decode(GeminiResponse.self, from: data)
        if let apiError = decoded.error {
            throw GeminiError.api(apiError.message ?? "sconosciuto")
        }
        guard let candidate = decoded.candidates?.first else {
            throw GeminiError.invalidResponse
        }
        return candidate
    }
}

// MARK: - Helper per costruire schemi parametri (OpenAPI subset)

enum ToolSchema {
    static func object(properties: [String: JSONValue], required: [String] = []) -> JSONValue {
        .object([
            "type": .string("object"),
            "properties": .object(properties),
            "required": .array(required.map { .string($0) })
        ])
    }

    static func string(_ description: String) -> JSONValue {
        .object(["type": .string("string"), "description": .string(description)])
    }

    static func number(_ description: String) -> JSONValue {
        .object(["type": .string("number"), "description": .string(description)])
    }

    static func integer(_ description: String) -> JSONValue {
        .object(["type": .string("integer"), "description": .string(description)])
    }
}
