
import React, { useState } from 'react';
import { UserProfile, DailyLog, Badge, Meal, MealTemplate } from '../types';
import { Card } from './ui/Card';
import { Plus, Flame, Sparkles, Heart } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  userProfile: UserProfile;
  dailyLog: DailyLog;
  onLogMeal: () => void;
  currentStreak: number;
  onSaveTemplate: (template: MealTemplate) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProfile, dailyLog, onLogMeal, currentStreak, onSaveTemplate }) => {
  const [savingMeal, setSavingMeal] = useState<Meal | null>(null);
  const [templateName, setTemplateName] = useState('');

  const consumedCalories = dailyLog.meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  const consumedProtein = dailyLog.meals.reduce((sum, meal) => sum + meal.totalProtein, 0);
  const consumedCarbs = dailyLog.meals.reduce((sum, meal) => sum + meal.totalCarbs, 0);
  const consumedFat = dailyLog.meals.reduce((sum, meal) => sum + meal.totalFat, 0);

  const remainingCalories = Math.max(0, userProfile.macroTargets.calories - consumedCalories);
  const calorieProgress = Math.min(100, (consumedCalories / userProfile.macroTargets.calories) * 100);

  const isDark = userProfile.theme === 'dark';

  const renderMacroRing = (current: number, target: number, color: string, label: string, unit: string) => {
    const data = [
      { name: 'consumed', value: current },
      { name: 'remaining', value: Math.max(0, target - current) }
    ];

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16">
          <PieChart width={64} height={64}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={22}
              outerRadius={28}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
              isAnimationActive={false} 
            >
              <Cell fill={color} />
              <Cell fill={isDark ? '#334155' : '#f1f5f9'} />
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{Math.round(current)}</span>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">{target}{unit}</span>
      </div>
    );
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400';
    return 'text-red-500 bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
  };

  // Helper to check if a meal is already saved as a template
  const isMealSaved = (meal: Meal) => {
    return userProfile.savedTemplates.some(template => {
      // Fast check on totals
      if (Math.abs(template.totalCalories - meal.totalCalories) > 1) return false;
      if (template.items.length !== meal.items.length) return false;
      
      // Deep check on item names
      return template.items.every((item, i) => item.name === meal.items[i].name);
    });
  };

  const initiateSave = (meal: Meal, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMealSaved(meal)) return; // Prevent saving if already saved
    setSavingMeal(meal);
    setTemplateName(meal.items.map(i => i.name).join(', ').substring(0, 25));
  };

  const confirmSave = () => {
    if (!savingMeal || !templateName.trim()) return;

    const newTemplate: MealTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: templateName,
      items: savingMeal.items,
      totalCalories: savingMeal.totalCalories,
      totalProtein: savingMeal.totalProtein,
      totalCarbs: savingMeal.totalCarbs,
      totalFat: savingMeal.totalFat,
      qualityScore: savingMeal.qualityScore
    };

    onSaveTemplate(newTemplate);
    setSavingMeal(null);
    setTemplateName('');
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {savingMeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl scale-in-center border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500">
                 <Heart className="w-5 h-5 fill-current" />
               </div>
               <div>
                 <h3 className="font-bold text-slate-900 dark:text-white">Save to Favorites</h3>
                 <p className="text-xs text-slate-500">Save this meal as a template</p>
               </div>
             </div>
             
             <div className="mb-4">
               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Meal Name</label>
               <input 
                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                 value={templateName}
                 onChange={(e) => setTemplateName(e.target.value)}
                 autoFocus
                 placeholder="e.g. My Breakfast"
               />
             </div>

             <div className="flex gap-3">
               <button 
                 onClick={() => setSavingMeal(null)}
                 className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={confirmSave}
                 disabled={!templateName.trim()}
                 className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
               >
                 Save
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Today</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-800/50">
            <Flame className="w-4 h-4 text-orange-500 mr-1.5" fill="currentColor" />
            <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{currentStreak} Day Streak</span>
          </div>
          <button className="p-0.5 border-2 border-white dark:border-slate-800 shadow-sm rounded-full bg-slate-100 dark:bg-slate-700 md:hidden">
             <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
               {userProfile.name.charAt(0)}
             </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Main Stats */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white border-none shadow-xl shadow-slate-200 dark:shadow-none flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-slate-400 text-sm font-medium">Calories Remaining</span>
              <div className="text-4xl font-bold mt-1 tracking-tight">{remainingCalories}</div>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
               <Flame className="w-6 h-6 text-orange-400" fill="currentColor" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span>{consumedCalories} eaten</span>
              <span>{userProfile.macroTargets.calories} goal</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
               <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${calorieProgress}%` }}
               />
            </div>
          </div>
        </Card>

        {/* Macro Rings */}
        <div className="grid grid-cols-3 gap-3 h-full">
          <Card className="flex flex-col items-center justify-center py-2 h-full">
            {renderMacroRing(consumedProtein, userProfile.macroTargets.protein, '#10b981', 'Protein', 'g')}
          </Card>
          <Card className="flex flex-col items-center justify-center py-2 h-full">
            {renderMacroRing(consumedCarbs, userProfile.macroTargets.carbs, '#3b82f6', 'Carbs', 'g')}
          </Card>
          <Card className="flex flex-col items-center justify-center py-2 h-full">
            {renderMacroRing(consumedFat, userProfile.macroTargets.fat, '#f59e0b', 'Fat', 'g')}
          </Card>
        </div>
      </div>

      {/* Badges Section */}
      {userProfile.badges.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-yellow-500" /> 
            Recent Achievements
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {userProfile.badges.slice().reverse().map((badge) => (
              <div key={badge.id} className="flex-shrink-0 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-3 pr-6 min-w-[200px] hover:shadow-md transition-shadow cursor-default">
                <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-xl border border-yellow-100 dark:border-yellow-800/30">
                  {badge.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{badge.name}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meals List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Meals</h2>
          <button 
            onClick={onLogMeal}
            className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> Log Meal
          </button>
        </div>

        {dailyLog.meals.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">No meals logged today</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Tap the + button to start tracking</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailyLog.meals.map((meal) => {
              const saved = isMealSaved(meal);
              return (
                <Card key={meal.id} className="p-4 flex gap-4 transition-all hover:shadow-md cursor-pointer group relative overflow-hidden">
                  {meal.imageUrl ? (
                    <img src={meal.imageUrl} alt="Meal" className="w-24 h-24 rounded-xl object-cover bg-slate-100 dark:bg-slate-700 group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform duration-300">
                      🍽️
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {meal.items.map(i => i.name).join(', ').substring(0, 30)}{meal.items.length > 1 ? '...' : ''}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wide font-medium">{meal.type} • {new Date(meal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className={`px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wide ${getQualityColor(meal.qualityScore.score)}`}>
                          Score: {meal.qualityScore.score}
                        </div>
                        <button 
                          onClick={(e) => initiateSave(meal, e)}
                          className={`p-1.5 rounded-lg transition-colors z-10 ${
                            saved 
                              ? 'text-red-500 bg-red-50 dark:bg-red-900/20 cursor-default' 
                              : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title={saved ? "Saved to Favorites" : "Save to Favorites"}
                          disabled={saved}
                        >
                          <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg mt-2">
                      <span className="font-bold text-slate-900 dark:text-white">{meal.totalCalories} kcal</span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span>{meal.totalProtein}g P</span>
                      <span>{meal.totalCarbs}g C</span>
                      <span>{meal.totalFat}g F</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
