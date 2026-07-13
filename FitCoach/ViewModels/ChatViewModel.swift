import Foundation
import SwiftData
import Observation

/// Attività corrente dell'agente, mostrata nella UI durante l'elaborazione.
enum AgentActivity: Equatable {
    case idle
    case thinking
    case usingTool(String)

    var label: String? {
        switch self {
        case .idle: return nil
        case .thinking: return "Sto pensando…"
        case .usingTool(let name):
            switch name {
            case "search_web": return "Sto cercando sul web…"
            case "get_diet_plan", "get_today_nutrition": return "Consulto la tua dieta…"
            case "get_workout_plan", "get_exercise_history": return "Consulto la tua scheda…"
            case "log_food": return "Registro il pasto…"
            case "replace_planned_food": return "Aggiorno la dieta…"
            case "replace_exercise": return "Aggiorno la scheda…"
            case "log_weight", "get_weight_history": return "Aggiorno il peso…"
            default: return "Elaboro…"
            }
        }
    }
}

@MainActor
@Observable
final class ChatViewModel {
    private(set) var activity: AgentActivity = .idle
    private(set) var errorMessage: String?

    private let gemini: GeminiService
    private let modelContext: ModelContext
    /// History nel formato Gemini (include functionCall/functionResponse,
    /// che non vengono persistiti — solo i testi vanno in ChatMessage).
    private var history: [GeminiContent] = []

    private static let maxToolIterations = 6

    private static let systemPrompt = """
    Sei FitCoach, un coach virtuale esperto di nutrizione e allenamento con i pesi. Parli italiano, \
    sei diretto, motivante e concreto. Hai accesso ai dati reali dell'utente tramite i tool: \
    dieta preimpostata, diario alimentare, scheda di allenamento, storico carichi e peso corporeo. \
    Regole: \
    1) Usa SEMPRE i tool per leggere i dati reali invece di inventare. \
    2) Per sostituzioni di alimenti o esercizi: proponi prima l'alternativa con macro/dettagli, \
    chiedi conferma, e SOLO dopo la conferma chiama replace_planned_food o replace_exercise. \
    3) Usa search_web per valori nutrizionali che non conosci con certezza, ricette o evidenze \
    scientifiche recenti; cita le fonti quando le hai. \
    4) Quando l'utente descrive un pasto in linguaggio naturale, stima grammature e macro in modo \
    realistico e registralo con log_food, poi riepiloga cosa hai registrato. \
    5) Risposte concise, formattate con elenchi quando utile. Non dare consigli medici: per \
    infortuni seri suggerisci un professionista.
    """

    var isBusy: Bool { activity != .idle }

    init(modelContext: ModelContext, gemini: GeminiService = GeminiService()) {
        self.modelContext = modelContext
        self.gemini = gemini
    }

    /// Ricostruisce la history Gemini dallo storico persistito (solo testi).
    func loadHistory(from messages: [ChatMessage]) {
        guard history.isEmpty else { return }
        history = messages.suffix(30).map {
            GeminiContent(
                role: $0.role == .user ? "user" : "model",
                parts: [GeminiPart(text: $0.text)]
            )
        }
    }

    func send(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isBusy else { return }

        errorMessage = nil
        persist(role: .user, text: trimmed)
        let checkpoint = history.count // per ripristino pulito in caso di errore
        history.append(GeminiContent(role: "user", parts: [GeminiPart(text: trimmed)]))
        activity = .thinking

        defer { activity = .idle }

        let executor = AgentToolExecutor(context: modelContext)
        let tools = [GeminiTool(functionDeclarations: AgentToolExecutor.declarations, googleSearch: nil)]

        do {
            for _ in 0..<Self.maxToolIterations {
                let candidate = try await gemini.generate(
                    systemPrompt: Self.systemPrompt,
                    history: history,
                    tools: tools
                )
                guard let content = candidate.content else { throw GeminiError.invalidResponse }
                history.append(content)

                let functionCalls = content.parts.compactMap(\.functionCall)
                if functionCalls.isEmpty {
                    let reply = content.parts.compactMap(\.text).joined(separator: "\n")
                    persist(role: .assistant, text: reply.isEmpty ? "…" : reply)
                    return
                }

                var responseParts: [GeminiPart] = []
                for call in functionCalls {
                    activity = .usingTool(call.name)
                    let result = await executor.execute(name: call.name, args: call.args?.objectValue ?? [:])
                    responseParts.append(GeminiPart(
                        functionResponse: GeminiFunctionResponse(name: call.name, response: result)
                    ))
                }
                history.append(GeminiContent(role: "user", parts: responseParts))
                activity = .thinking
            }
            // Loop esaurito senza risposta testuale
            persist(role: .assistant, text: "Ho fatto troppe operazioni di fila senza arrivare a una risposta. Riprova con una richiesta più specifica.")
        } catch {
            errorMessage = error.localizedDescription
            // Ripristina la history al punto precedente: evita functionCall orfane
            // che invaliderebbero le richieste successive.
            if history.count > checkpoint {
                history.removeSubrange(checkpoint...)
            }
        }
    }

    private func persist(role: ChatRole, text: String) {
        modelContext.insert(ChatMessage(role: role, text: text))
        try? modelContext.save()
    }
}
