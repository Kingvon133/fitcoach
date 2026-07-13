import Foundation
import SwiftData

/// Dichiarazioni dei tool esposti all'agente + esecuzione locale su SwiftData.
@MainActor
struct AgentToolExecutor {
    let context: ModelContext
    var webSearch = WebSearchService()

    // MARK: - Dichiarazioni (inviate a Gemini)

    static var declarations: [GeminiFunctionDeclaration] {
        [
            .init(
                name: "get_diet_plan",
                description: "Restituisce la dieta preimpostata dell'utente: pasti, alimenti, grammature, calorie e macro, più i target giornalieri.",
                parameters: nil
            ),
            .init(
                name: "get_today_nutrition",
                description: "Restituisce calorie e macro consumati oggi dall'utente e i target giornalieri rimanenti.",
                parameters: nil
            ),
            .init(
                name: "log_food",
                description: "Registra un alimento consumato oggi nel diario alimentare, con calorie e macro. Usalo quando l'utente dice cosa ha mangiato.",
                parameters: ToolSchema.object(
                    properties: [
                        "meal_name": ToolSchema.string("Pasto di appartenenza, es. Colazione, Pranzo, Cena, Spuntino"),
                        "food_name": ToolSchema.string("Nome dell'alimento"),
                        "grams": ToolSchema.number("Quantità in grammi"),
                        "calories": ToolSchema.number("Calorie totali (kcal)"),
                        "protein": ToolSchema.number("Proteine in grammi"),
                        "carbs": ToolSchema.number("Carboidrati in grammi"),
                        "fat": ToolSchema.number("Grassi in grammi")
                    ],
                    required: ["meal_name", "food_name", "grams", "calories", "protein", "carbs", "fat"]
                )
            ),
            .init(
                name: "replace_planned_food",
                description: "Sostituisce un alimento nella dieta preimpostata con un'alternativa (es. macro equivalenti). Chiedi conferma all'utente prima di chiamarla.",
                parameters: ToolSchema.object(
                    properties: [
                        "meal_name": ToolSchema.string("Nome del pasto che contiene l'alimento da sostituire"),
                        "old_food_name": ToolSchema.string("Nome dell'alimento da sostituire"),
                        "new_food_name": ToolSchema.string("Nome del nuovo alimento"),
                        "grams": ToolSchema.number("Quantità in grammi del nuovo alimento"),
                        "calories": ToolSchema.number("Calorie del nuovo alimento (kcal)"),
                        "protein": ToolSchema.number("Proteine in grammi"),
                        "carbs": ToolSchema.number("Carboidrati in grammi"),
                        "fat": ToolSchema.number("Grassi in grammi")
                    ],
                    required: ["meal_name", "old_food_name", "new_food_name", "grams", "calories", "protein", "carbs", "fat"]
                )
            ),
            .init(
                name: "get_workout_plan",
                description: "Restituisce la scheda di allenamento preimpostata: giorni, esercizi, serie, ripetizioni e recuperi.",
                parameters: nil
            ),
            .init(
                name: "get_exercise_history",
                description: "Restituisce lo storico di carichi, serie e ripetizioni di un esercizio nelle ultime sessioni. Utile per valutare la progressione.",
                parameters: ToolSchema.object(
                    properties: [
                        "exercise_name": ToolSchema.string("Nome dell'esercizio"),
                        "limit": ToolSchema.integer("Numero massimo di sessioni da restituire (default 10)")
                    ],
                    required: ["exercise_name"]
                )
            ),
            .init(
                name: "replace_exercise",
                description: "Sostituisce un esercizio nella scheda con un altro (es. per infortunio o mancanza di attrezzatura). Chiedi conferma all'utente prima di chiamarla.",
                parameters: ToolSchema.object(
                    properties: [
                        "day_name": ToolSchema.string("Nome del giorno della scheda che contiene l'esercizio"),
                        "old_exercise_name": ToolSchema.string("Esercizio da sostituire"),
                        "new_exercise_name": ToolSchema.string("Nuovo esercizio"),
                        "muscle_group": ToolSchema.string("Gruppo muscolare del nuovo esercizio"),
                        "target_sets": ToolSchema.integer("Numero di serie"),
                        "target_reps": ToolSchema.string("Range ripetizioni, es. 8-10"),
                        "rest_seconds": ToolSchema.integer("Recupero in secondi"),
                        "notes": ToolSchema.string("Note tecniche opzionali")
                    ],
                    required: ["day_name", "old_exercise_name", "new_exercise_name", "muscle_group", "target_sets", "target_reps"]
                )
            ),
            .init(
                name: "log_weight",
                description: "Registra il peso corporeo di oggi in kg.",
                parameters: ToolSchema.object(
                    properties: ["weight_kg": ToolSchema.number("Peso in kg")],
                    required: ["weight_kg"]
                )
            ),
            .init(
                name: "get_weight_history",
                description: "Restituisce lo storico del peso corporeo dell'utente.",
                parameters: ToolSchema.object(
                    properties: ["limit": ToolSchema.integer("Numero massimo di misurazioni (default 30)")]
                )
            ),
            .init(
                name: "search_web",
                description: "Cerca informazioni aggiornate sul web (valori nutrizionali, ricette, evidenze scientifiche su esercizi). Usala quando servono dati che non conosci con certezza.",
                parameters: ToolSchema.object(
                    properties: ["query": ToolSchema.string("La ricerca da effettuare, formulata in modo specifico")],
                    required: ["query"]
                )
            )
        ]
    }

    // MARK: - Esecuzione

    func execute(name: String, args: [String: JSONValue]) async -> JSONValue {
        do {
            switch name {
            case "get_diet_plan": return try getDietPlan()
            case "get_today_nutrition": return try getTodayNutrition()
            case "log_food": return try logFood(args)
            case "replace_planned_food": return try replacePlannedFood(args)
            case "get_workout_plan": return try getWorkoutPlan()
            case "get_exercise_history": return try getExerciseHistory(args)
            case "replace_exercise": return try replaceExercise(args)
            case "log_weight": return try logWeight(args)
            case "get_weight_history": return try getWeightHistory(args)
            case "search_web":
                guard let query = args["query"]?.stringValue else {
                    return .object(["error": .string("Parametro query mancante")])
                }
                return await webSearch.searchAsToolResult(query: query)
            default:
                return .object(["error": .string("Tool sconosciuto: \(name)")])
            }
        } catch {
            return .object(["error": .string(error.localizedDescription)])
        }
    }

    // MARK: - Dieta

    private func getDietPlan() throws -> JSONValue {
        guard let plan = try context.fetch(FetchDescriptor<DietPlan>()).first else {
            return .object(["error": .string("Nessuna dieta configurata")])
        }
        let meals: [JSONValue] = plan.meals.sorted { $0.sortOrder < $1.sortOrder }.map { meal in
            .object([
                "name": .string(meal.name),
                "foods": .array(meal.foods.map { food in
                    .object([
                        "name": .string(food.name),
                        "grams": .number(food.grams),
                        "calories": .number(food.calories),
                        "protein": .number(food.protein),
                        "carbs": .number(food.carbs),
                        "fat": .number(food.fat)
                    ])
                })
            ])
        }
        return .object([
            "plan_name": .string(plan.name),
            "target_calories": .number(Double(plan.targetCalories)),
            "target_protein": .number(Double(plan.targetProtein)),
            "target_carbs": .number(Double(plan.targetCarbs)),
            "target_fat": .number(Double(plan.targetFat)),
            "meals": .array(meals)
        ])
    }

    private func getTodayNutrition() throws -> JSONValue {
        let start = Calendar.current.startOfDay(for: .now)
        let descriptor = FetchDescriptor<FoodLogEntry>(predicate: #Predicate { $0.date >= start })
        let entries = try context.fetch(descriptor)
        let plan = try context.fetch(FetchDescriptor<DietPlan>()).first

        let calories = entries.reduce(0) { $0 + $1.calories }
        let protein = entries.reduce(0) { $0 + $1.protein }
        let carbs = entries.reduce(0) { $0 + $1.carbs }
        let fat = entries.reduce(0) { $0 + $1.fat }

        return .object([
            "consumed_calories": .number(calories),
            "consumed_protein": .number(protein),
            "consumed_carbs": .number(carbs),
            "consumed_fat": .number(fat),
            "target_calories": .number(Double(plan?.targetCalories ?? 0)),
            "target_protein": .number(Double(plan?.targetProtein ?? 0)),
            "target_carbs": .number(Double(plan?.targetCarbs ?? 0)),
            "target_fat": .number(Double(plan?.targetFat ?? 0)),
            "logged_foods": .array(entries.map { .string("\($0.foodName) (\(Int($0.grams))g, \(Int($0.calories)) kcal) - \($0.mealName)") })
        ])
    }

    private func logFood(_ args: [String: JSONValue]) throws -> JSONValue {
        guard
            let mealName = args["meal_name"]?.stringValue,
            let foodName = args["food_name"]?.stringValue,
            let grams = args["grams"]?.doubleValue,
            let calories = args["calories"]?.doubleValue,
            let protein = args["protein"]?.doubleValue,
            let carbs = args["carbs"]?.doubleValue,
            let fat = args["fat"]?.doubleValue
        else {
            return .object(["error": .string("Parametri mancanti o non validi")])
        }
        let entry = FoodLogEntry(
            mealName: mealName, foodName: foodName, grams: grams,
            calories: calories, protein: protein, carbs: carbs, fat: fat
        )
        context.insert(entry)
        try context.save()
        return .object(["status": .string("registrato"), "food": .string("\(foodName) \(Int(grams))g, \(Int(calories)) kcal")])
    }

    private func replacePlannedFood(_ args: [String: JSONValue]) throws -> JSONValue {
        guard
            let mealName = args["meal_name"]?.stringValue,
            let oldName = args["old_food_name"]?.stringValue,
            let newName = args["new_food_name"]?.stringValue,
            let grams = args["grams"]?.doubleValue,
            let calories = args["calories"]?.doubleValue,
            let protein = args["protein"]?.doubleValue,
            let carbs = args["carbs"]?.doubleValue,
            let fat = args["fat"]?.doubleValue
        else {
            return .object(["error": .string("Parametri mancanti o non validi")])
        }
        guard let plan = try context.fetch(FetchDescriptor<DietPlan>()).first,
              let meal = plan.meals.first(where: { $0.name.localizedCaseInsensitiveContains(mealName) }),
              let food = meal.foods.first(where: { $0.name.localizedCaseInsensitiveContains(oldName) })
        else {
            return .object(["error": .string("Alimento '\(oldName)' non trovato nel pasto '\(mealName)'")])
        }
        food.name = newName
        food.grams = grams
        food.calories = calories
        food.protein = protein
        food.carbs = carbs
        food.fat = fat
        try context.save()
        return .object(["status": .string("sostituito"), "detail": .string("\(oldName) -> \(newName) in \(meal.name)")])
    }

    // MARK: - Allenamento

    private func getWorkoutPlan() throws -> JSONValue {
        guard let plan = try context.fetch(FetchDescriptor<WorkoutPlan>()).first else {
            return .object(["error": .string("Nessuna scheda configurata")])
        }
        let days: [JSONValue] = plan.sortedDays.map { day in
            .object([
                "name": .string(day.name),
                "exercises": .array(day.sortedExercises.map { exercise in
                    .object([
                        "name": .string(exercise.name),
                        "muscle_group": .string(exercise.muscleGroup),
                        "sets": .number(Double(exercise.targetSets)),
                        "reps": .string(exercise.targetReps),
                        "rest_seconds": .number(Double(exercise.restSeconds)),
                        "notes": .string(exercise.notes)
                    ])
                })
            ])
        }
        return .object(["plan_name": .string(plan.name), "days": .array(days)])
    }

    private func getExerciseHistory(_ args: [String: JSONValue]) throws -> JSONValue {
        guard let exerciseName = args["exercise_name"]?.stringValue else {
            return .object(["error": .string("Parametro exercise_name mancante")])
        }
        let limit = args["limit"]?.intValue ?? 10
        var descriptor = FetchDescriptor<WorkoutSession>(sortBy: [SortDescriptor(\.date, order: .reverse)])
        descriptor.fetchLimit = 50
        let sessions = try context.fetch(descriptor)

        var history: [JSONValue] = []
        for session in sessions where history.count < limit {
            guard let log = session.exerciseLogs.first(where: {
                $0.exerciseName.localizedCaseInsensitiveContains(exerciseName)
            }) else { continue }
            history.append(.object([
                "date": .string(session.date.formatted(date: .abbreviated, time: .omitted)),
                "sets": .array(log.sortedSets.map { .string("\($0.weightKg)kg x \($0.reps)") }),
                "top_weight_kg": .number(log.topWeight),
                "total_volume_kg": .number(log.totalVolume)
            ]))
        }
        if history.isEmpty {
            return .object(["info": .string("Nessuno storico per '\(exerciseName)'")])
        }
        return .object(["exercise": .string(exerciseName), "sessions": .array(history)])
    }

    private func replaceExercise(_ args: [String: JSONValue]) throws -> JSONValue {
        guard
            let dayName = args["day_name"]?.stringValue,
            let oldName = args["old_exercise_name"]?.stringValue,
            let newName = args["new_exercise_name"]?.stringValue,
            let muscleGroup = args["muscle_group"]?.stringValue,
            let targetSets = args["target_sets"]?.intValue,
            let targetReps = args["target_reps"]?.stringValue
        else {
            return .object(["error": .string("Parametri mancanti o non validi")])
        }
        guard let plan = try context.fetch(FetchDescriptor<WorkoutPlan>()).first,
              let day = plan.days.first(where: { $0.name.localizedCaseInsensitiveContains(dayName) }),
              let exercise = day.exercises.first(where: { $0.name.localizedCaseInsensitiveContains(oldName) })
        else {
            return .object(["error": .string("Esercizio '\(oldName)' non trovato nel giorno '\(dayName)'")])
        }
        exercise.name = newName
        exercise.muscleGroup = muscleGroup
        exercise.targetSets = targetSets
        exercise.targetReps = targetReps
        exercise.restSeconds = args["rest_seconds"]?.intValue ?? exercise.restSeconds
        exercise.notes = args["notes"]?.stringValue ?? ""
        try context.save()
        return .object(["status": .string("sostituito"), "detail": .string("\(oldName) -> \(newName) in \(day.name)")])
    }

    // MARK: - Peso

    private func logWeight(_ args: [String: JSONValue]) throws -> JSONValue {
        guard let weight = args["weight_kg"]?.doubleValue, weight > 20, weight < 400 else {
            return .object(["error": .string("Peso non valido")])
        }
        context.insert(BodyMetric(weightKg: weight))
        try context.save()
        return .object(["status": .string("registrato"), "weight_kg": .number(weight)])
    }

    private func getWeightHistory(_ args: [String: JSONValue]) throws -> JSONValue {
        let limit = args["limit"]?.intValue ?? 30
        var descriptor = FetchDescriptor<BodyMetric>(sortBy: [SortDescriptor(\.date, order: .reverse)])
        descriptor.fetchLimit = limit
        let metrics = try context.fetch(descriptor)
        return .object([
            "measurements": .array(metrics.map {
                .object([
                    "date": .string($0.date.formatted(date: .abbreviated, time: .omitted)),
                    "weight_kg": .number($0.weightKg)
                ])
            })
        ])
    }
}
