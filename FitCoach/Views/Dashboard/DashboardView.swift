import SwiftUI
import SwiftData
import Charts

struct DashboardView: View {
    @Query private var dietPlans: [DietPlan]
    @Query private var workoutPlans: [WorkoutPlan]
    @Query(sort: \BodyMetric.date) private var bodyMetrics: [BodyMetric]
    @Query private var todayEntries: [FoodLogEntry]

    init() {
        let start = Calendar.current.startOfDay(for: .now)
        _todayEntries = Query(filter: #Predicate<FoodLogEntry> { $0.date >= start })
    }

    private var dietPlan: DietPlan? { dietPlans.first }

    private var consumedCalories: Double { todayEntries.reduce(0) { $0 + $1.calories } }
    private var consumedProtein: Double { todayEntries.reduce(0) { $0 + $1.protein } }
    private var consumedCarbs: Double { todayEntries.reduce(0) { $0 + $1.carbs } }
    private var consumedFat: Double { todayEntries.reduce(0) { $0 + $1.fat } }

    private var todayWorkoutDay: WorkoutDay? {
        guard let days = workoutPlans.first?.sortedDays, !days.isEmpty else { return nil }
        let weekday = Calendar.current.component(.weekday, from: .now) // 1 = domenica
        let index = (weekday - 2 + days.count * 2) % days.count // lunedì = giorno 0
        return days[index]
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    CalorieCard(
                        consumed: consumedCalories,
                        target: Double(dietPlan?.targetCalories ?? 0)
                    )

                    MacroRow(
                        protein: (consumedProtein, Double(dietPlan?.targetProtein ?? 0)),
                        carbs: (consumedCarbs, Double(dietPlan?.targetCarbs ?? 0)),
                        fat: (consumedFat, Double(dietPlan?.targetFat ?? 0))
                    )

                    if let day = todayWorkoutDay {
                        TodayWorkoutCard(day: day)
                    }

                    if bodyMetrics.count >= 2 {
                        WeightTrendCard(metrics: Array(bodyMetrics.suffix(30)))
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Oggi")
        }
    }
}

// MARK: - Anello calorie

private struct CalorieCard: View {
    let consumed: Double
    let target: Double

    private var progress: Double {
        target > 0 ? min(consumed / target, 1.0) : 0
    }

    private var remaining: Int {
        max(Int(target - consumed), 0)
    }

    var body: some View {
        HStack(spacing: 24) {
            ZStack {
                Circle()
                    .stroke(Color(.systemFill), lineWidth: 12)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        consumed > target ? Color.orange : Color.green,
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.easeOut(duration: 0.6), value: progress)
                VStack(spacing: 2) {
                    Text("\(Int(consumed))")
                        .font(.title2.bold())
                        .monospacedDigit()
                    Text("kcal")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 110, height: 110)

            VStack(alignment: .leading, spacing: 8) {
                Label("\(Int(target)) obiettivo", systemImage: "target")
                Label("\(remaining) rimanenti", systemImage: "fork.knife")
                if consumed > target {
                    Label("+\(Int(consumed - target)) oltre", systemImage: "exclamationmark.triangle")
                        .foregroundStyle(.orange)
                }
            }
            .font(.subheadline)
            .foregroundStyle(.secondary)

            Spacer()
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Macro

private struct MacroRow: View {
    let protein: (consumed: Double, target: Double)
    let carbs: (consumed: Double, target: Double)
    let fat: (consumed: Double, target: Double)

    var body: some View {
        HStack(spacing: 12) {
            MacroGauge(title: "Proteine", value: protein.consumed, target: protein.target, color: .blue)
            MacroGauge(title: "Carboidrati", value: carbs.consumed, target: carbs.target, color: .orange)
            MacroGauge(title: "Grassi", value: fat.consumed, target: fat.target, color: .purple)
        }
    }
}

private struct MacroGauge: View {
    let title: String
    let value: Double
    let target: Double
    let color: Color

    private var progress: Double {
        target > 0 ? min(value / target, 1.0) : 0
    }

    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Gauge(value: progress) {
                EmptyView()
            } currentValueLabel: {
                Text("\(Int(value))")
                    .font(.caption2.bold())
                    .monospacedDigit()
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .tint(color)
            .scaleEffect(0.9)
            Text("/ \(Int(target))g")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.background, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Workout di oggi

private struct TodayWorkoutCard: View {
    let day: WorkoutDay

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Allenamento di oggi", systemImage: "dumbbell.fill")
                    .font(.headline)
                Spacer()
                Text(day.name)
                    .font(.subheadline.bold())
                    .foregroundStyle(.secondary)
            }
            Divider()
            ForEach(day.sortedExercises.prefix(4), id: \.persistentModelID) { exercise in
                HStack {
                    Text(exercise.name)
                        .font(.subheadline)
                    Spacer()
                    Text("\(exercise.targetSets) × \(exercise.targetReps)")
                        .font(.subheadline)
                        .monospacedDigit()
                        .foregroundStyle(.secondary)
                }
            }
            if day.exercises.count > 4 {
                Text("+ altri \(day.exercises.count - 4) esercizi")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - Trend peso (Swift Charts)

private struct WeightTrendCard: View {
    let metrics: [BodyMetric]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Peso", systemImage: "scalemass")
                    .font(.headline)
                Spacer()
                if let last = metrics.last {
                    Text(last.weightKg.formatted(.number.precision(.fractionLength(1))) + " kg")
                        .font(.subheadline.bold())
                        .monospacedDigit()
                }
            }
            Chart(metrics, id: \.persistentModelID) { metric in
                LineMark(
                    x: .value("Data", metric.date),
                    y: .value("Peso", metric.weightKg)
                )
                .interpolationMethod(.catmullRom)
                .foregroundStyle(.green)
                AreaMark(
                    x: .value("Data", metric.date),
                    y: .value("Peso", metric.weightKg)
                )
                .interpolationMethod(.catmullRom)
                .foregroundStyle(.green.opacity(0.1))
            }
            .chartYScale(domain: .automatic(includesZero: false))
            .frame(height: 120)
        }
        .padding()
        .background(.background, in: RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    DashboardView()
        .modelContainer(for: [DietPlan.self, WorkoutPlan.self, BodyMetric.self, FoodLogEntry.self], inMemory: true)
}
