import React, { useState } from 'react';
import { ActivityLevel, DietaryPreference, Gender, GoalType, UserProfile } from '../types';
import { createInitialProfile } from '../services/nutritionService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ArrowRight, Check, User, Activity, Target, Leaf } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: Omit<UserProfile, 'id'>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: 30,
    gender: Gender.Male,
    heightCm: 175,
    weightKg: 75,
    targetWeightKg: 70,
    activityLevel: ActivityLevel.ModeratelyActive,
    goal: GoalType.LoseWeight,
    dietaryPreference: DietaryPreference.NonVegetarian
  });

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const finish = () => {
    const profile = createInitialProfile(
      formData.name,
      formData.age,
      formData.gender,
      formData.heightCm,
      formData.weightKg,
      formData.targetWeightKg,
      formData.activityLevel,
      formData.goal,
      formData.dietaryPreference
    );
    onComplete(profile);
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to Calorie Counter</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Let's get to know you better to personalize your plan.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name</label>
          <input
            type="text"
            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 border outline-none"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Biological Sex</label>
          <div className="grid grid-cols-2 gap-4">
            {Object.values(Gender).map((g) => (
              <button
                key={g}
                onClick={() => updateField('gender', g)}
                className={`p-3 rounded-xl border-2 font-medium transition-all ${
                  formData.gender === g 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-200 dark:hover:border-emerald-800'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dietary Preference</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(DietaryPreference).map((d) => (
              <button
                key={d}
                onClick={() => updateField('dietaryPreference', d)}
                className={`p-2 rounded-xl border-2 font-medium text-sm transition-all ${
                  formData.dietaryPreference === d
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-green-200 dark:hover:border-green-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
          <input
            type="number"
            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 border outline-none"
            value={formData.age}
            onChange={(e) => updateField('age', Number(e.target.value))}
          />
        </div>
      </div>
      <Button fullWidth onClick={nextStep} disabled={!formData.name}>Next Step <ArrowRight className="ml-2 w-4 h-4" /></Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Body Metrics</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Used to calculate your metabolic rate.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Height (cm)</label>
          <input
            type="number"
            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 border outline-none"
            value={formData.heightCm}
            onChange={(e) => updateField('heightCm', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Weight (kg)</label>
          <input
            type="number"
            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 border outline-none"
            value={formData.weightKg}
            onChange={(e) => updateField('weightKg', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Weight (kg)</label>
          <input
            type="number"
            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 border outline-none"
            value={formData.targetWeightKg}
            onChange={(e) => updateField('targetWeightKg', Number(e.target.value))}
          />
        </div>
      </div>
      <div className="flex gap-4">
        <Button variant="ghost" onClick={prevStep} className="w-1/3">Back</Button>
        <Button fullWidth onClick={nextStep}>Next Step <ArrowRight className="ml-2 w-4 h-4" /></Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Activity & Goal</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">This determines your daily calorie targets.</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Activity Level</label>
        <div className="space-y-2">
          {Object.values(ActivityLevel).map((level) => (
            <div 
              key={level}
              onClick={() => updateField('activityLevel', level)}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center ${
                formData.activityLevel === level
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                 formData.activityLevel === level ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {formData.activityLevel === level && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-sm font-medium ${formData.activityLevel === level ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {level}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary Goal</label>
        <div className="grid grid-cols-1 gap-2">
           {Object.values(GoalType).map((g) => (
            <button
              key={g}
              onClick={() => updateField('goal', g)}
              className={`p-3 rounded-xl border-2 font-medium text-sm transition-all text-left ${
                formData.goal === g 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-indigo-800'
              }`}
            >
              {g}
            </button>
           ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="ghost" onClick={prevStep} className="w-1/3">Back</Button>
        <Button fullWidth onClick={finish} variant="primary">Generate Plan</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-none p-8 transition-colors duration-200">
        <div className="flex justify-center mb-6 space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200 dark:bg-slate-700'}`} />
          ))}
        </div>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};