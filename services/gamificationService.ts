import { Badge, DailyLog } from '../types';

export const AVAILABLE_BADGES: Omit<Badge, 'unlockedAt'>[] = [
  { id: 'first_log', name: 'First Step', description: 'Logged your first meal', icon: '🌱' },
  { id: 'streak_3', name: 'On Fire', description: '3-day logging streak', icon: '🔥' },
  { id: 'streak_7', name: 'Unstoppable', description: '7-day logging streak', icon: '🚀' },
  { id: 'streak_14', name: 'Habit Master', description: '14-day logging streak', icon: '👑' },
  { id: 'quality_80', name: 'Clean Eater', description: 'Logged a meal with 80+ quality score', icon: '🥗' },
  { id: 'perfect_day', name: 'Perfect Day', description: 'Hit all macro targets within 10%', icon: '🎯' },
];

export const calculateStreak = (logs: DailyLog[]): number => {
  // Filter logs that actually have meals
  const logsWithMeals = logs.filter(l => l.meals.length > 0);
  
  if (logsWithMeals.length === 0) return 0;

  // Get unique sorted dates (descending)
  const sortedDates = [...new Set(logsWithMeals.map(l => l.date))].sort((a, b) => b.localeCompare(a));
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // If most recent log is not today or yesterday, streak is broken
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 0;
  // Create a date object from the most recent logged date
  let checkDate = new Date(sortedDates[0]);

  // Iterate backwards
  for (let i = 0; i < sortedDates.length; i++) {
    const logDate = sortedDates[i];
    const expectedDateString = checkDate.toISOString().split('T')[0];
    
    if (logDate === expectedDateString) {
      streak++;
      // Move checkDate back one day
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break; // Gap found
    }
  }

  return streak;
};

export const checkNewBadges = (
  logs: DailyLog[], 
  currentBadges: Badge[], 
  currentStreak: number
): Badge[] => {
  const newBadges: Badge[] = [];
  const existingIds = new Set(currentBadges.map(b => b.id));

  const unlock = (badgeId: string) => {
    if (!existingIds.has(badgeId)) {
      const template = AVAILABLE_BADGES.find(b => b.id === badgeId);
      if (template) {
        newBadges.push({ ...template, unlockedAt: Date.now() });
      }
    }
  };

  // 1. First Log
  const totalMeals = logs.reduce((acc, log) => acc + log.meals.length, 0);
  if (totalMeals > 0) unlock('first_log');

  // 2. Streaks
  if (currentStreak >= 3) unlock('streak_3');
  if (currentStreak >= 7) unlock('streak_7');
  if (currentStreak >= 14) unlock('streak_14');

  // 3. Quality Score (check latest log)
  const latestLog = logs[logs.length - 1]; // Assuming appended order
  if (latestLog && latestLog.meals.some(m => m.qualityScore.score >= 80)) {
    unlock('quality_80');
  }

  return newBadges;
};