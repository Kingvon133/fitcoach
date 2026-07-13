import SwiftUI

struct RootTabView: View {
    var body: some View {
        TabView {
            Tab("Oggi", systemImage: "square.grid.2x2.fill") {
                DashboardView()
            }
            Tab("Dieta", systemImage: "fork.knife") {
                PlaceholderView(title: "Dieta", symbol: "fork.knife")
            }
            Tab("Workout", systemImage: "dumbbell.fill") {
                PlaceholderView(title: "Workout", symbol: "dumbbell.fill")
            }
            Tab("Coach", systemImage: "sparkles") {
                ChatView()
            }
        }
        .tint(.green)
    }
}

/// Placeholder per le sezioni Dieta/Workout complete (prossima iterazione).
private struct PlaceholderView: View {
    let title: String
    let symbol: String

    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                title,
                systemImage: symbol,
                description: Text("Sezione in costruzione. Intanto puoi gestire tutto dal Coach AI.")
            )
            .navigationTitle(title)
        }
    }
}

#Preview {
    RootTabView()
        .modelContainer(for: [DietPlan.self, WorkoutPlan.self, BodyMetric.self, FoodLogEntry.self, ChatMessage.self, WorkoutSession.self], inMemory: true)
}
