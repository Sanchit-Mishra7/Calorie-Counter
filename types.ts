
export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

export enum ActivityLevel {
  Sedentary = 'Sedentary', // BMR x 1.2
  LightlyActive = 'Lightly Active', // BMR x 1.375
  ModeratelyActive = 'Moderately Active', // BMR x 1.55
  VeryActive = 'Very Active', // BMR x 1.725
  Athlete = 'Athlete' // BMR x 1.9
}

export enum GoalType {
  LoseWeight = 'Lose Weight',
  Maintain = 'Maintain',
  GainMuscle = 'Gain Muscle'
}

export enum DietaryPreference {
  NonVegetarian = 'Non-Vegetarian',
  Vegetarian = 'Vegetarian'
}

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string; // In a real app, never store plain text. We will do simple hashing.
  createdAt: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number; // timestamp
}

export interface MealTemplate {
  id: string;
  name: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  qualityScore: QualityScore;
}

export interface UserProfile {
  id: string; // Linked to UserAccount.id
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
  dietaryPreference: DietaryPreference;
  bmr: number;
  tdee: number;
  macroTargets: MacroTargets;
  badges: Badge[];
  savedTemplates: MealTemplate[];
  theme: 'light' | 'dark';
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface QualityScore {
  score: number; // 0-100
  explanation: string;
  suggestions: string[];
}

export interface Meal {
  id: string;
  timestamp: number;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  imageUrl?: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  qualityScore: QualityScore;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: Meal[];
  weight?: number;
}

export interface Recipe {
  name: string;
  calories: number;
  ingredients: string[];
  instructions: string[];
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}
