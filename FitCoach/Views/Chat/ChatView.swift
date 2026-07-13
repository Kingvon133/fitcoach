import SwiftUI
import SwiftData

struct ChatView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \ChatMessage.date) private var messages: [ChatMessage]

    @State private var viewModel: ChatViewModel?
    @State private var inputText = ""
    @FocusState private var isInputFocused: Bool

    private let suggestions = [
        "Cosa mi manca per chiudere i macro di oggi?",
        "Non ho il pollo, alternativa con gli stessi macro?",
        "Ho male alla spalla, sostituisci la panca piana",
        "Come sta andando la mia progressione in stacco?"
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                messagesList

                if let activityLabel = viewModel?.activity.label {
                    AgentActivityBar(label: activityLabel)
                }

                if let error = viewModel?.errorMessage {
                    ErrorBanner(message: error)
                }

                inputBar
            }
            .navigationTitle("Coach AI")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                if viewModel == nil {
                    let vm = ChatViewModel(modelContext: modelContext)
                    vm.loadHistory(from: messages)
                    viewModel = vm
                }
            }
        }
    }

    // MARK: - Lista messaggi

    private var messagesList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    if messages.isEmpty {
                        emptyState
                    }
                    ForEach(messages, id: \.persistentModelID) { message in
                        MessageBubble(message: message)
                            .id(message.persistentModelID)
                    }
                }
                .padding()
            }
            .onChange(of: messages.count) {
                if let last = messages.last {
                    withAnimation(.easeOut(duration: 0.25)) {
                        proxy.scrollTo(last.persistentModelID, anchor: .bottom)
                    }
                }
            }
            .onTapGesture { isInputFocused = false }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "figure.run.circle.fill")
                .font(.system(size: 56))
                .foregroundStyle(.green.gradient)
                .padding(.top, 40)
            Text("Il tuo coach personale")
                .font(.title3.bold())
            Text("Conosce la tua dieta, la tua scheda e i tuoi progressi. Può cercare sul web e modificare i tuoi piani.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            VStack(spacing: 8) {
                ForEach(suggestions, id: \.self) { suggestion in
                    Button {
                        Task { await sendMessage(suggestion) }
                    } label: {
                        Text(suggestion)
                            .font(.subheadline)
                            .multilineTextAlignment(.leading)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.top, 8)
        }
    }

    // MARK: - Input

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Chiedi al tuo coach…", text: $inputText, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 20))
                .focused($isInputFocused)
                .onSubmit { Task { await sendMessage(inputText) } }

            Button {
                Task { await sendMessage(inputText) }
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 30))
                    .foregroundStyle(canSend ? Color.green : Color(.systemGray3))
            }
            .disabled(!canSend)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.bar)
    }

    private var canSend: Bool {
        guard let viewModel else { return false }
        return !viewModel.isBusy && !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func sendMessage(_ text: String) async {
        guard let viewModel else { return }
        inputText = ""
        await viewModel.send(text)
    }
}

// MARK: - Bolla messaggio

private struct MessageBubble: View {
    let message: ChatMessage

    private var isUser: Bool { message.role == .user }

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 48) }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                Text(LocalizedStringKey(message.text)) // rende il markdown dell'agente
                    .font(.subheadline)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        isUser ? AnyShapeStyle(Color.green.gradient) : AnyShapeStyle(Color(.secondarySystemGroupedBackground)),
                        in: RoundedRectangle(cornerRadius: 18)
                    )
                    .foregroundStyle(isUser ? .white : .primary)
                    .textSelection(.enabled)

                Text(message.date, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            if !isUser { Spacer(minLength: 48) }
        }
    }
}

// MARK: - Barra attività agente

private struct AgentActivityBar: View {
    let label: String

    var body: some View {
        HStack(spacing: 8) {
            ProgressView()
                .controlSize(.small)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
                .contentTransition(.opacity)
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 6)
        .background(.bar)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }
}

// MARK: - Banner errore

private struct ErrorBanner: View {
    let message: String

    var body: some View {
        Label(message, systemImage: "exclamationmark.triangle.fill")
            .font(.caption)
            .foregroundStyle(.orange)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal)
            .padding(.vertical, 6)
            .background(.bar)
    }
}

#Preview {
    ChatView()
        .modelContainer(for: [ChatMessage.self, DietPlan.self, WorkoutPlan.self, BodyMetric.self, FoodLogEntry.self, WorkoutSession.self], inMemory: true)
}
