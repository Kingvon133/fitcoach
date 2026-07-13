import Foundation
import SwiftData

// MARK: - Peso corporeo

@Model
final class BodyMetric {
    var date: Date
    var weightKg: Double

    init(date: Date = .now, weightKg: Double) {
        self.date = date
        self.weightKg = weightKg
    }
}

// MARK: - Messaggi chat agente (persistiti per lo storico)

enum ChatRole: String, Codable {
    case user
    case assistant
}

@Model
final class ChatMessage {
    var date: Date
    var roleRaw: String
    var text: String

    init(date: Date = .now, role: ChatRole, text: String) {
        self.date = date
        self.roleRaw = role.rawValue
        self.text = text
    }

    var role: ChatRole {
        ChatRole(rawValue: roleRaw) ?? .assistant
    }
}
