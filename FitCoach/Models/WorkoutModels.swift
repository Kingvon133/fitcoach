import Foundation
import SwiftData

// MARK: - Scheda preimpostata

@Model
final class WorkoutPlan {
    var name: String
    @Relationship(deleteRule: .cascade, inverse: \WorkoutDay.plan)
    var days: [WorkoutDay]

    init(name: String, days: [WorkoutDay] = []) {
        self.name = name
        self.days = days
    }

    var sortedDays: [WorkoutDay] {
        days.sorted { $0.sortOrder < $1.sortOrder }
    }
}

@Model
final class WorkoutDay {
    var name: String
    var sortOrder: Int
    var plan: WorkoutPlan?
    @Relationship(deleteRule: .cascade, inverse: \PlannedExercise.day)
    var exercises: [PlannedExercise]

    init(name: String, sortOrder: Int, exercises: [PlannedExercise] = []) {
        self.name = name
        self.sortOrder = sortOrder
        self.exercises = exercises
    }

    var sortedExercises: [PlannedExercise] {
        exercises.sorted { $0.sortOrder < $1.sortOrder }
    }
}

@Model
final class PlannedExercise {
    var name: String
    var muscleGroup: String
    var targetSets: Int
    var targetReps: String   // es. "8-10", "12", "AMRAP"
    var restSeconds: Int
    var notes: String
    var sortOrder: Int
    var day: WorkoutDay?

    init(
        name: String,
        muscleGroup: String,
        targetSets: Int,
        targetReps: String,
        restSeconds: Int = 90,
        notes: String = "",
        sortOrder: Int
    ) {
        self.name = name
        self.muscleGroup = muscleGroup
        self.targetSets = targetSets
        self.targetReps = targetReps
        self.restSeconds = restSeconds
        self.notes = notes
        self.sortOrder = sortOrder
    }
}

// MARK: - Diario di bordo (sessioni svolte)

@Model
final class WorkoutSession {
    var date: Date
    var dayName: String
    @Relationship(deleteRule: .cascade, inverse: \ExerciseLog.session)
    var exerciseLogs: [ExerciseLog]

    init(date: Date = .now, dayName: String, exerciseLogs: [ExerciseLog] = []) {
        self.date = date
        self.dayName = dayName
        self.exerciseLogs = exerciseLogs
    }
}

@Model
final class ExerciseLog {
    var exerciseName: String
    var session: WorkoutSession?
    @Relationship(deleteRule: .cascade, inverse: \SetLog.exerciseLog)
    var sets: [SetLog]

    init(exerciseName: String, sets: [SetLog] = []) {
        self.exerciseName = exerciseName
        self.sets = sets
    }

    var sortedSets: [SetLog] {
        sets.sorted { $0.order < $1.order }
    }

    /// Carico massimo della sessione — usato per il grafico di progressione.
    var topWeight: Double {
        sets.map(\.weightKg).max() ?? 0
    }

    /// Volume totale (kg × reps) della sessione per questo esercizio.
    var totalVolume: Double {
        sets.reduce(0) { $0 + $1.weightKg * Double($1.reps) }
    }
}

@Model
final class SetLog {
    var order: Int
    var weightKg: Double
    var reps: Int
    var exerciseLog: ExerciseLog?

    init(order: Int, weightKg: Double, reps: Int) {
        self.order = order
        self.weightKg = weightKg
        self.reps = reps
    }
}
