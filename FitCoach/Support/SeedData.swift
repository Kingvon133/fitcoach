import Foundation
import SwiftData

/// Popola dieta e scheda d'esempio al primo avvio.
/// Sostituisci i valori con la TUA dieta e la TUA scheda reali.
enum SeedData {
    @MainActor
    static func seedIfNeeded(context: ModelContext) {
        let existingPlans = (try? context.fetch(FetchDescriptor<DietPlan>())) ?? []
        guard existingPlans.isEmpty else { return }

        seedDiet(context: context)
        seedWorkout(context: context)
        try? context.save()
    }

    // MARK: - Dieta

    @MainActor
    private static func seedDiet(context: ModelContext) {
        let plan = DietPlan(
            name: "Dieta personale",
            targetCalories: 2400,
            targetProtein: 180,
            targetCarbs: 260,
            targetFat: 70
        )
        context.insert(plan)

        let colazione = Meal(name: "Colazione", sortOrder: 0)
        colazione.foods = [
            PlannedFood(name: "Fiocchi d'avena", grams: 80, calories: 300, protein: 11, carbs: 53, fat: 6),
            PlannedFood(name: "Albume d'uovo", grams: 200, calories: 104, protein: 22, carbs: 1, fat: 0),
            PlannedFood(name: "Banana", grams: 120, calories: 107, protein: 1, carbs: 27, fat: 0)
        ]

        let pranzo = Meal(name: "Pranzo", sortOrder: 1)
        pranzo.foods = [
            PlannedFood(name: "Riso basmati", grams: 100, calories: 350, protein: 8, carbs: 78, fat: 1),
            PlannedFood(name: "Petto di pollo", grams: 200, calories: 220, protein: 46, carbs: 0, fat: 3),
            PlannedFood(name: "Olio EVO", grams: 10, calories: 90, protein: 0, carbs: 0, fat: 10),
            PlannedFood(name: "Verdure miste", grams: 200, calories: 50, protein: 3, carbs: 8, fat: 0)
        ]

        let spuntino = Meal(name: "Spuntino", sortOrder: 2)
        spuntino.foods = [
            PlannedFood(name: "Yogurt greco 0%", grams: 170, calories: 100, protein: 17, carbs: 6, fat: 0),
            PlannedFood(name: "Mandorle", grams: 20, calories: 120, protein: 4, carbs: 4, fat: 10)
        ]

        let cena = Meal(name: "Cena", sortOrder: 3)
        cena.foods = [
            PlannedFood(name: "Patate", grams: 300, calories: 231, protein: 6, carbs: 52, fat: 0),
            PlannedFood(name: "Salmone", grams: 180, calories: 370, protein: 37, carbs: 0, fat: 24),
            PlannedFood(name: "Verdure miste", grams: 200, calories: 50, protein: 3, carbs: 8, fat: 0)
        ]

        plan.meals = [colazione, pranzo, spuntino, cena]
    }

    // MARK: - Scheda

    @MainActor
    private static func seedWorkout(context: ModelContext) {
        let plan = WorkoutPlan(name: "Push / Pull / Legs")
        context.insert(plan)

        let push = WorkoutDay(name: "Giorno A — Push", sortOrder: 0)
        push.exercises = [
            PlannedExercise(name: "Panca piana bilanciere", muscleGroup: "Petto", targetSets: 4, targetReps: "6-8", restSeconds: 150, sortOrder: 0),
            PlannedExercise(name: "Lento avanti manubri", muscleGroup: "Spalle", targetSets: 3, targetReps: "8-10", restSeconds: 120, sortOrder: 1),
            PlannedExercise(name: "Panca inclinata manubri", muscleGroup: "Petto", targetSets: 3, targetReps: "8-10", restSeconds: 120, sortOrder: 2),
            PlannedExercise(name: "Alzate laterali", muscleGroup: "Spalle", targetSets: 3, targetReps: "12-15", restSeconds: 90, sortOrder: 3),
            PlannedExercise(name: "Pushdown ai cavi", muscleGroup: "Tricipiti", targetSets: 3, targetReps: "10-12", restSeconds: 90, sortOrder: 4)
        ]

        let pull = WorkoutDay(name: "Giorno B — Pull", sortOrder: 1)
        pull.exercises = [
            PlannedExercise(name: "Stacco da terra", muscleGroup: "Schiena", targetSets: 3, targetReps: "5", restSeconds: 180, sortOrder: 0),
            PlannedExercise(name: "Trazioni", muscleGroup: "Schiena", targetSets: 4, targetReps: "6-10", restSeconds: 150, sortOrder: 1),
            PlannedExercise(name: "Rematore bilanciere", muscleGroup: "Schiena", targetSets: 3, targetReps: "8-10", restSeconds: 120, sortOrder: 2),
            PlannedExercise(name: "Face pull", muscleGroup: "Spalle posteriori", targetSets: 3, targetReps: "12-15", restSeconds: 90, sortOrder: 3),
            PlannedExercise(name: "Curl bilanciere", muscleGroup: "Bicipiti", targetSets: 3, targetReps: "10-12", restSeconds: 90, sortOrder: 4)
        ]

        let legs = WorkoutDay(name: "Giorno C — Legs", sortOrder: 2)
        legs.exercises = [
            PlannedExercise(name: "Squat bilanciere", muscleGroup: "Quadricipiti", targetSets: 4, targetReps: "6-8", restSeconds: 180, sortOrder: 0),
            PlannedExercise(name: "Stacco rumeno", muscleGroup: "Femorali", targetSets: 3, targetReps: "8-10", restSeconds: 150, sortOrder: 1),
            PlannedExercise(name: "Leg press", muscleGroup: "Quadricipiti", targetSets: 3, targetReps: "10-12", restSeconds: 120, sortOrder: 2),
            PlannedExercise(name: "Leg curl", muscleGroup: "Femorali", targetSets: 3, targetReps: "10-12", restSeconds: 90, sortOrder: 3),
            PlannedExercise(name: "Calf raise in piedi", muscleGroup: "Polpacci", targetSets: 4, targetReps: "12-15", restSeconds: 60, sortOrder: 4)
        ]

        plan.days = [push, pull, legs]
    }
}
