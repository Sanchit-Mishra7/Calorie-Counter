 
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { MealLogger } from './components/MealLogger';
 import { Progress } from './components/Progress';
import { NutritionCoach } from './components/NutritionCoach';
import { Auth } from './components/Auth';
import { UserProfile, DailyLog, Meal, Badge, MealTemplate, Gender, ActivityLevel, GoalType, DietaryPreference, UserAccount } from './types';
import { calculateStreak, checkNewBadges } from './services/gamificationService';
import { calculateBMR, calculateTDEE, calculateMacroTargets } from './services/nutritionService';
import { authService } from './services/authService';
import { Confetti } from './components/ui/Confetti';
import { Trophy, Trash2, Moon, Sun, Edit2, Check, X, User, Save, Heart, LogOut } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Toast } from './components/ui/Toast';

const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'progress' | 'coach' | 'profile'>('dashboard');
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newBadgeAlert, setNewBadgeAlert] = useState<Badge | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Notification State
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Profile Info Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});

  // Template Editing State
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);

  // 1. Initial Authentication Check
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      loadDataForUser(user.id);
    }
    setIsLoadingAuth(false);
  }, []);

  // 2. Load Data from "Database"
  const loadDataForUser = (userId: string) => {
    const data = authService.loadUserData(userId);
    setUserProfile(data.profile);
    
    // Ensure we have at least today's log entry initialized
    const today = new Date().toISOString().split('T')[0];
    const hasToday = data.logs.some(l => l.date === today);
    
    let logs = data.logs;
    if (!hasToday) {
      logs = [...logs, { date: today, meals: [] }];
    }
    setDailyLogs(logs);
  };

  // 3. Save Data to "Database" whenever state changes
  useEffect(() => {
    if (currentUser) {
      // Debounce saving to prevent excessive writes
      const timeoutId = setTimeout(() => {
        authService.saveUserData(currentUser.id, {
          profile: userProfile,
          logs: dailyLogs
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [userProfile, dailyLogs, currentUser]);

  // Apply dark mode class
  useEffect(() => {
    if (userProfile?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userProfile?.theme]);

  // Update streak whenever logs change
  useEffect(() => {
    const streak = calculateStreak(dailyLogs);
    setCurrentStreak(streak);
  }, [dailyLogs]);

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    loadDataForUser(user.id);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setUserProfile(null);
    setDailyLogs([]);
  };

  const handleOnboardingComplete = (profile: Omit<UserProfile, 'id'>) => {
    if (currentUser) {
      const profileWithId: UserProfile = { ...profile, id: currentUser.id };
      setUserProfile(profileWithId);
      // Data will be auto-saved by the useEffect
    }
  };

  const handleToggleTheme = () => {
    setUserProfile(prev => prev ? ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }) : null);
  };

  const handleStartEditName = () => {
    if (userProfile) {
      setTempName(userProfile.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserProfile(prev => prev ? ({ ...prev, name: tempName }) : null);
    }
    setIsEditingName(false);
  };

  const handleStartEditProfile = () => {
    if (userProfile) {
      setEditFormData({
        age: userProfile.age,
        gender: userProfile.gender,
        heightCm: userProfile.heightCm,
        weightKg: userProfile.weightKg,
        targetWeightKg: userProfile.targetWeightKg,
        activityLevel: userProfile.activityLevel,
        goal: userProfile.goal,
        dietaryPreference: userProfile.dietaryPreference
      });
      setIsEditingProfile(true);
    }
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setEditFormData({});
  };

  const handleSaveProfile = () => {
    if (!userProfile || !editFormData) return;

    // Use existing values as fallback
    const age = editFormData.age ?? userProfile.age;
    const gender = editFormData.gender ?? userProfile.gender;
    const heightCm = editFormData.heightCm ?? userProfile.heightCm;
    const weightKg = editFormData.weightKg ?? userProfile.weightKg;
    const targetWeightKg = editFormData.targetWeightKg ?? userProfile.targetWeightKg;
    const activityLevel = editFormData.activityLevel ?? userProfile.activityLevel;
    const goal = editFormData.goal ?? userProfile.goal;
    const dietaryPreference = editFormData.dietaryPreference ?? userProfile.dietaryPreference;

    // Recalculate nutrition targets
    const bmr = calculateBMR(weightKg, heightCm, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const macroTargets = calculateMacroTargets(tdee, goal);

    setUserProfile({
      ...userProfile,
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
      macroTargets
    });

    setIsEditingProfile(false);
  };

  const handleSaveMeal = (mealData: Omit<Meal, 'id' | 'timestamp'>) => {
    if (!userProfile) return;

    const newMeal: Meal = {
      ...mealData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };

    let updatedLogs: DailyLog[] = [];

    // Update Logs
    setDailyLogs(prev => {
      const today = new Date().toISOString().split('T')[0];
      const todayLogIndex = prev.findIndex(l => l.date === today);
      
      let newLogs;
      if (todayLogIndex >= 0) {
        const logsCopy = [...prev];
        logsCopy[todayLogIndex] = {
          ...logsCopy[todayLogIndex],
          meals: [...logsCopy[todayLogIndex].meals, newMeal]
        };
        newLogs = logsCopy;
      } else {
        newLogs = [...prev, { date: today, meals: [newMeal] }];
      }
      updatedLogs = newLogs;
      return newLogs;
    });

    setIsLoggingMeal(false);

    // Gamification Checks
    const today = new Date().toISOString().split('T')[0];
    const todayLog = dailyLogs.find(l => l.date === today);
    const isFirstMealOfDay = !todayLog || todayLog.meals.length === 0;

    if (isFirstMealOfDay) {
      setShowConfetti(true);
    }

    // Badge Logic
    const newStreak = calculateStreak(updatedLogs);
    const unlockedBadges = checkNewBadges(updatedLogs, userProfile.badges, newStreak);

    if (unlockedBadges.length > 0) {
      const badge = unlockedBadges[0]; // Show first new badge
      setNewBadgeAlert(badge);
      setShowConfetti(true);
      
      setUserProfile(prev => prev ? ({
        ...prev,
        badges: [...prev.badges, ...unlockedBadges]
      }) : null);
    }
  };

  const handleSaveTemplate = (template: MealTemplate) => {
    setUserProfile(prev => prev ? ({
      ...prev,
      savedTemplates: [...prev.savedTemplates, template]
    }) : null);
    
    setToastMessage('Meal saved to Favorites in Profile!');
    setShowToast(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setUserProfile(prev => prev ? ({
      ...prev,
      savedTemplates: prev.savedTemplates.filter(t => t.id !== templateId)
    }) : null);
    
    setToastMessage('Template removed');
    setShowToast(true);
  };

  const handleStartEditTemplate = (template: MealTemplate) => {
    setEditingTemplateId(template.id);
    setEditTemplateName(template.name);
  };

  const handleSaveEditTemplate = () => {
    if (editingTemplateId && editTemplateName.trim()) {
      setUserProfile(prev => prev ? ({
        ...prev,
        savedTemplates: prev.savedTemplates.map(t => 
          t.id === editingTemplateId ? { ...t, name: editTemplateName } : t
        )
      }) : null);
      setEditingTemplateId(null);
      setEditTemplateName('');
      setToastMessage('Template renamed');
      setShowToast(true);
    }
  };

  const handleCancelEditTemplate = () => {
    setEditingTemplateId(null);
    setEditTemplateName('');
  };

  // --- RENDER ---

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const todayLog = dailyLogs.find(l => l.date === new Date().toISOString().split('T')[0]) || { date: new Date().toISOString().split('T')[0], meals: [] };

  return (
    <>
      {showToast && (
        <Toast message={toastMessage} onClose={() => setShowToast(false)} />
      )}

      {showConfetti && (
        <Confetti onComplete={() => setShowConfetti(false)} />
      )}
      
      {/* Badge Notification Overlay */}
      {newBadgeAlert && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl scale-in-center">
            <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-6xl animate-bounce">
              {newBadgeAlert.icon}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Badge Unlocked!</h2>
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-4">{newBadgeAlert.name}</div>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{newBadgeAlert.description}</p>
            <button 
              onClick={() => setNewBadgeAlert(null)}
              className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      <Layout activeTab={currentTab} onTabChange={setCurrentTab}>
        {currentTab === 'dashboard' && (
          <Dashboard 
            userProfile={userProfile} 
            dailyLog={todayLog} 
            onLogMeal={() => setIsLoggingMeal(true)} 
            currentStreak={currentStreak}
            onSaveTemplate={handleSaveTemplate}
          />
        )}
        {currentTab === 'coach' && (
          <NutritionCoach userProfile={userProfile} />
        )}
        {currentTab === 'progress' && (
          <Progress logs={dailyLogs} userProfile={userProfile} />
        )}
        {currentTab === 'profile' && (
          <div className="flex flex-col items-center h-full text-slate-500 space-y-8 animate-fade-in pb-10">
             <div className="text-center w-full max-w-sm">
               <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-full mb-4 mx-auto flex items-center justify-center text-3xl font-bold text-slate-400 dark:text-slate-500">
                 {userProfile.name.charAt(0)}
               </div>
               
               {isEditingName ? (
                 <div className="flex items-center justify-center gap-2 mb-2">
                   <input 
                     className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-bold text-lg text-center w-40"
                     value={tempName}
                     onChange={(e) => setTempName(e.target.value)}
                     autoFocus
                   />
                   <button onClick={handleSaveName} className="p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full">
                     <Check className="w-4 h-4" />
                   </button>
                   <button onClick={() => setIsEditingName(false)} className="p-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full">
                     <X className="w-4 h-4" />
                   </button>
                 </div>
               ) : (
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                   {userProfile.name}
                   <button onClick={handleStartEditName} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                     <Edit2 className="w-4 h-4" />
                   </button>
                 </h2>
               )}
               
               <div className="flex items-center justify-center mt-2 text-slate-600 dark:text-slate-400">
                 <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                 <span>{userProfile.badges.length} Badges Earned</span>
               </div>

               {/* Theme Toggle */}
               <button 
                 onClick={handleToggleTheme}
                 className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center mx-auto hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
               >
                 {userProfile.theme === 'light' ? (
                   <>
                     <Moon className="w-4 h-4 mr-2" /> Dark Mode
                   </>
                 ) : (
                   <>
                     <Sun className="w-4 h-4 mr-2" /> Light Mode
                   </>
                 )}
               </button>
             </div>

             {/* Personal Information Section */}
             <div className="w-full px-4 max-w-md">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-900 dark:text-white flex items-center">
                    <User className="w-4 h-4 mr-2" /> Personal Information
                 </h3>
                 {!isEditingProfile && (
                   <button 
                    onClick={handleStartEditProfile}
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center"
                   >
                     <Edit2 className="w-3 h-3 mr-1" /> Edit
                   </button>
                 )}
               </div>
               
               <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
                 {isEditingProfile ? (
                   <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 block">Age</label>
                          <input 
                            type="number" 
                            value={editFormData.age || ''} 
                            onChange={(e) => setEditFormData({...editFormData, age: Number(e.target.value)})}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 block">Gender</label>
                          <select 
                            value={editFormData.gender} 
                            onChange={(e) => setEditFormData({...editFormData, gender: e.target.value as Gender})}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
                          >
                             {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 block">Height (cm)</label>
                          <input 
                            type="number" 
                            value={editFormData.heightCm || ''} 
                            onChange={(e) => setEditFormData({...editFormData, heightCm: Number(e.target.value)})}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                           <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 block">Weight (kg)</label>
                           <input 
                            type="number" 
                            value={editFormData.weightKg || ''} 
                            onChange={(e) => setEditFormData({...editFormData, weightKg: Number(e.target.value)})}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="col-span-2">
                           <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 block">Target Weight (kg)</label>
                           <input 
                            type="number" 
                            value={editFormData.targetWeightKg || ''} 
                            onChange={(e) => setEditFormData({...editFormData, targetWeightKg: Number(e.target.value)})}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                         <div>
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 block">Activity Level</label>
                            <select 
                              value={editFormData.activityLevel} 
                              onChange={(e) => setEditFormData({...editFormData, activityLevel: e.target.value as ActivityLevel})}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
                            >
                               {Object.values(ActivityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 block">Goal</label>
                            <select 
                              value={editFormData.goal} 
                              onChange={(e) => setEditFormData({...editFormData, goal: e.target.value as GoalType})}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
                            >
                               {Object.values(GoalType).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1 block">Dietary Preference</label>
                            <select 
                              value={editFormData.dietaryPreference} 
                              onChange={(e) => setEditFormData({...editFormData, dietaryPreference: e.target.value as DietaryPreference})}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white"
                            >
                               {Object.values(DietaryPreference).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                         </div>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <Button fullWidth variant="ghost" onClick={handleCancelEditProfile} size="sm">Cancel</Button>
                        <Button fullWidth onClick={handleSaveProfile} size="sm">Save Changes</Button>
                      </div>
                   </div>
                 ) : (
                   <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Age / Sex</p>
                        <p className="font-medium text-slate-900 dark:text-white mt-1">{userProfile.age} • {userProfile.gender}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Height</p>
                        <p className="font-medium text-slate-900 dark:text-white mt-1">{userProfile.heightCm} cm</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Current Weight</p>
                        <p className="font-medium text-slate-900 dark:text-white mt-1">{userProfile.weightKg} kg</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Target Weight</p>
                        <p className="font-medium text-emerald-600 dark:text-emerald-400 mt-1">{userProfile.targetWeightKg} kg</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Activity Level</p>
                          <p className="font-medium text-slate-900 dark:text-white mt-1">{userProfile.activityLevel}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Primary Goal</p>
                          <p className="font-medium text-slate-900 dark:text-white mt-1">{userProfile.goal}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Dietary Preference</p>
                          <p className="font-medium text-slate-900 dark:text-white mt-1">{userProfile.dietaryPreference}</p>
                        </div>
                    </div>
                   </>
                 )}
               </div>
             </div>

             {/* Badges Grid */}
             <div className="w-full px-4 max-w-md">
               <h3 className="font-bold text-slate-900 dark:text-white mb-4">Your Collection</h3>
               <div className="grid grid-cols-2 gap-3">
                 {userProfile.badges.length === 0 ? (
                   <div className="col-span-2 text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                     <p className="text-slate-500 dark:text-slate-400">Log meals to earn badges!</p>
                   </div>
                 ) : (
                   userProfile.badges.map(b => (
                     <div key={b.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center space-x-3 transition-colors">
                       <div className="text-2xl">{b.icon}</div>
                       <div className="text-left">
                         <div className="text-xs font-bold text-slate-900 dark:text-white">{b.name}</div>
                       </div>
                     </div>
                   ))
                 )}
               </div>
             </div>

             {/* Favorite Meals */}
             <div className="w-full px-4 max-w-md">
               <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                 <Heart className="w-4 h-4 mr-2 text-red-500" fill="currentColor" /> Favorite Meals
               </h3>
               <div className="grid grid-cols-1 gap-3">
                 {userProfile.savedTemplates.length === 0 ? (
                   <div className="text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                     <p className="text-slate-500 dark:text-slate-400 text-sm">Save meals as templates to see them here!</p>
                   </div>
                 ) : (
                   userProfile.savedTemplates.map(t => (
                     <div key={t.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center group transition-colors">
                       
                       {editingTemplateId === t.id ? (
                         <div className="flex-1 flex items-center space-x-2 mr-2">
                            <input 
                              className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              value={editTemplateName}
                              onChange={(e) => setEditTemplateName(e.target.value)}
                              autoFocus
                            />
                            <button onClick={handleSaveEditTemplate} className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800/50">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancelEditTemplate} className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                              <X className="w-4 h-4" />
                            </button>
                         </div>
                       ) : (
                         <div className="flex-1 min-w-0 mr-4">
                           <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{t.name}</div>
                           <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {t.items.map(i => i.name).join(', ')}
                           </div>
                           <div className="text-[10px] text-slate-400 mt-0.5">
                             {t.totalCalories} kcal • <span className="text-emerald-600 dark:text-emerald-400">{t.totalProtein}g P</span> • <span className="text-blue-600 dark:text-blue-400">{t.totalCarbs}g C</span> • <span className="text-amber-600 dark:text-amber-400">{t.totalFat}g F</span>
                           </div>
                         </div>
                       )}

                       {editingTemplateId !== t.id && (
                         <div className="flex items-center space-x-1">
                           <div className="hidden sm:block text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded mr-2">
                             {t.qualityScore.score}
                           </div>
                           <button 
                             onClick={() => handleStartEditTemplate(t)}
                             className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                             title="Edit Name"
                           >
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleDeleteTemplate(t.id)}
                             className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                             title="Delete"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       )}
                     </div>
                   ))
                 )}
               </div>
             </div>

             {/* Logout Button */}
             <button 
               onClick={handleLogout} 
               className="flex items-center text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl transition-colors mb-8"
             >
               <LogOut className="w-4 h-4 mr-2" /> Sign Out
             </button>
          </div>
        )}
      </Layout>

      {isLoggingMeal && (
        <MealLogger 
          onSave={handleSaveMeal} 
          onCancel={() => setIsLoggingMeal(false)} 
          templates={userProfile.savedTemplates}
          onSaveTemplate={handleSaveTemplate}
        />
      )}
    </>
  );
};

export default App;
