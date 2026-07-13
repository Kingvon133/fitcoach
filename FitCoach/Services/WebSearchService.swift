import Foundation

/// Ricerca web tramite Google Search grounding di Gemini.
/// Chiamata SEPARATA con solo il tool googleSearch (non combinabile
/// con functionDeclarations nella stessa richiesta — vedi ARCHITECTURE.md).
struct WebSearchService {
    var gemini = GeminiService()

    struct SearchResult {
        var answer: String
        var sources: [(title: String, url: String)]
    }

    func search(query: String) async throws -> SearchResult {
        let candidate = try await gemini.generate(
            systemPrompt: "Rispondi in modo conciso e fattuale in italiano, citando i dati trovati.",
            history: [GeminiContent(role: "user", parts: [GeminiPart(text: query)])],
            tools: [GeminiTool(functionDeclarations: nil, googleSearch: .init())]
        )

        let answer = candidate.content?.parts.compactMap(\.text).joined(separator: "\n") ?? ""
        let sources: [(String, String)] = (candidate.groundingMetadata?.groundingChunks ?? [])
            .compactMap { chunk in
                guard let web = chunk.web, let uri = web.uri else { return nil }
                return (web.title ?? uri, uri)
            }

        guard !answer.isEmpty else { throw GeminiError.invalidResponse }
        return SearchResult(answer: answer, sources: sources)
    }

    /// Risultato in formato JSON da restituire all'agente come functionResponse.
    func searchAsToolResult(query: String) async -> JSONValue {
        do {
            let result = try await search(query: query)
            return .object([
                "answer": .string(result.answer),
                "sources": .array(result.sources.map { .string("\($0.title): \($0.url)") })
            ])
        } catch {
            return .object(["error": .string(error.localizedDescription)])
        }
    }
}
