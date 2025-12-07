import { ActivityLevel, DietaryPreference, Gender, GoalType, MacroTargets, UserProfile } from '../types';

export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number => {
  // Mifflin-St Jeor Equation
  if (gender === Gender.Male) {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
  const multipliers: Record<ActivityLevel, number> = {
    [ActivityLevel.Sedentary]: 1.2,
    [ActivityLevel.LightlyActive]: 1.375,
    [ActivityLevel.ModeratelyActive]: 1.55,
    [ActivityLevel.VeryActive]: 1.725,
    [ActivityLevel.Athlete]: 1.9,
  };
  return Math.round(bmr * multipliers[activityLevel]);
};

export const calculateMacroTargets = (tdee: number, goal: GoalType): MacroTargets => {
  let targetCalories = tdee;
  let proteinRatio = 0.25;
  let carbsRatio = 0.45;
  let fatRatio = 0.30;

  switch (goal) {
    case GoalType.LoseWeight:
      targetCalories = Math.round(tdee * 0.80); // 20% deficit
      proteinRatio = 0.35;
      carbsRatio = 0.35;
      fatRatio = 0.30;
      break;
    case GoalType.GainMuscle:
      targetCalories = Math.round(tdee * 1.10); // 10% surplus
      proteinRatio = 0.30;
      carbsRatio = 0.45;
      fatRatio = 0.25;
      break;
    case GoalType.Maintain:
    default:
      targetCalories = tdee;
      proteinRatio = 0.25;
      carbsRatio = 0.45;
      fatRatio = 0.30;
      break;
  }

  // 1g Protein = 4 cal, 1g Carb = 4 cal, 1g Fat = 9 cal
  return {
    calories: targetCalories,
    protein: Math.round((targetCalories * proteinRatio) / 4),
    carbs: Math.round((targetCalories * carbsRatio) / 4),
    fat: Math.round((targetCalories * fatRatio) / 9),
  };
};

export const createInitialProfile = (
  name: string,
  age: number,
  gender: Gender,
  heightCm: number,
  weightKg: number,
  targetWeightKg: number,
  activityLevel: ActivityLevel,
  goal: GoalType,
  dietaryPreference: DietaryPreference
): Omit<UserProfile, 'id'> => {
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const macroTargets = calculateMacroTargets(tdee, goal);

  return {
    name,
    age,
    gender,
    heightCm,
    weightKg,
    targetWeightKg,
    activityLevel,
    goal,
    dietaryPreference,
    bmr,
    tdee,
    macroTargets,
    badges: [],
    savedTemplates: [],
    theme: 'light'
  };
};