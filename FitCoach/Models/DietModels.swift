import Foundation
import SwiftData

// MARK: - Dieta preimpostata

@Model
final class DietPlan {
    var name: String
    var targetCalories: Int
    var targetProtein: Int
    var targetCarbs: Int
    var targetFat: Int
    @Relationship(deleteRule: .cascade, inverse: \Meal.plan)
    var meals: [Meal]

    init(
        name: String,
        targetCalories: Int,
        targetProtein: Int,
        targetCarbs: Int,
        targetFat: Int,
        meals: [Meal] = []
    ) {
        self.name = name
        self.targetCalories = targetCalories
        self.targetProtein = targetProtein
        self.targetCarbs = targetCarbs
        self.targetFat = targetFat
        self.meals = meals
    }
}

@Model
final class Meal {
    var name: String
    var sortOrder: Int
    var plan: DietPlan?
    @Relationship(deleteRule: .cascade, inverse: \PlannedFood.meal)
    var foods: [PlannedFood]

    init(name: String, sortOrder: Int, foods: [PlannedFood] = []) {
        self.name = name
        self.sortOrder = sortOrder
        self.foods = foods
    }

    var sortedFoods: [PlannedFood] {
        foods.sorted { $0.name < $1.name }
    }
}

@Model
final class PlannedFood {
    var name: String
    var grams: Double
    var calories: Double
    var protein: Double
    var carbs: Double
    var fat: Double
    var meal: Meal?

    init(name: String, grams: Double, calories: Double, protein: Double, carbs: Double, fat: Double) {
        self.name = name
        self.grams = grams
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
    }
}

// MARK: - Diario alimentare (cosa ho mangiato davvero)

@Model
final class FoodLogEntry {
    var date: Date
    var mealName: String
    var foodName: String
    var grams: Double
    var calories: Double
    var protein: Double
    var carbs: Double
    var fat: Double

    init(
        date: Date = .now,
        mealName: String,
        foodName: String,
        grams: Double,
        calories: Double,
        protein: Double,
        carbs: Double,
        fat: Double
    ) {
        self.date = date
        self.mealName = mealName
        self.foodName = foodName
        self.grams = grams
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
    }
}
