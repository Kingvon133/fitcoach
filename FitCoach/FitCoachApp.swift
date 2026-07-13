import SwiftUI
import SwiftData

@main
struct FitCoachApp: App {
    let container: ModelContainer

    init() {
        do {
            container = try ModelContainer(for:
                DietPlan.self,
                FoodLogEntry.self,
                WorkoutPlan.self,
                WorkoutSession.self,
                BodyMetric.self,
                ChatMessage.self
            )
        } catch {
            fatalError("Impossibile inizializzare SwiftData: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .task {
                    SeedData.seedIfNeeded(context: container.mainContext)
                }
        }
        .modelContainer(container)
    }
}
