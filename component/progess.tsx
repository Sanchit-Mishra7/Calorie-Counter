
import React from 'react';
import { Card } from './uii/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DailyLog, UserProfile } from '../types';
import { Calendar, Download } from 'lucide-react';

interface ProgressProps {
  logs: DailyLog[];
  userProfile: UserProfile;
}

export const Progress: React.FC<ProgressProps> = ({ logs, userProfile }) => {
  // Mock data generation if logs are empty, for visualization purposes in MVP
  const data = logs.length > 0 && logs[0].meals.length > 0 ? logs.map(log => ({
    date: log.date.split('-').slice(1).join('/'),
    calories: log.meals.reduce((sum, m) => sum + m.totalCalories, 0),
    weight: log.weight || userProfile.weightKg
  })) : [
    { date: 'Mon', calories: 2100, weight: 75.5 },
    { date: 'Tue', calories: 1950, weight: 75.4 },
    { date: 'Wed', calories: 2300, weight: 75.2 },
    { date: 'Thu', calories: 1800, weight: 75.1 },
    { date: 'Fri', calories: 2050, weight: 75.0 },
    { date: 'Sat', calories: 2400, weight: 74.9 },
    { date: 'Sun', calories: 1900, weight: 74.8 },
  ];

  const isDark = userProfile.theme === 'dark';
  const axisColor = isDark ? '#94a3b8' : '#94a3b8';
  const tooltipStyle = isDark 
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '8px' } 
    : { backgroundColor: '#fff', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderRadius: '8px' };

  // Prepare logs for history list (reverse chronological)
  const historyLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date)).filter(log => log.meals.length > 0);

  const handleExportCSV = () => {
    if (historyLogs.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = ["Date", "Total Calories", "Total Protein (g)", "Total Carbs (g)", "Total Fat (g)", "Meals Count"];
    const rows = historyLogs.map(log => {
      const cals = log.meals.reduce((acc, m) => acc + m.totalCalories, 0);
      const protein = log.meals.reduce((acc, m) => acc + m.totalProtein, 0);
      const carbs = log.meals.reduce((acc, m) => acc + m.totalCarbs, 0);
      const fat = log.meals.reduce((acc, m) => acc + m.totalFat, 0);
      return [
        log.date,
        cals,
        protein,
        carbs,
        fat,
        log.meals.length
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nutriai_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your Progress</h1>
        <button 
          onClick={handleExportCSV}
          className="text-emerald-600 dark:text-emerald-400 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          title="Export CSV Report"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <Card>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Weight Trend</h3>
        {/* Added explicit styling for width and height to parent, and minWidth to ResponsiveContainer */}
        <div className="h-64 w-full" style={{ width: '100%', height: '256px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={data}>
              <XAxis dataKey="date" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
          Current: <span className="font-bold text-slate-900 dark:text-white">{userProfile.weightKg}kg</span> • 
          Goal: <span className="font-bold text-slate-900 dark:text-white">{userProfile.targetWeightKg}kg</span>
        </p>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Calorie Consistency</h3>
        <div className="h-64 w-full" style={{ width: '100%', height: '256px' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data}>
               <XAxis dataKey="date" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
               <Tooltip cursor={{fill: isDark ? '#1e293b' : '#f1f5f9'}} contentStyle={tooltipStyle} />
               <Bar dataKey="calories" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* History List */}
      <div>
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400" />
          Log History
        </h3>
        
        {historyLogs.length === 0 ? (
          <div className="text-center py-8 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No history available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyLogs.map(log => {
              const cals = log.meals.reduce((acc, m) => acc + m.totalCalories, 0);
              const protein = log.meals.reduce((acc, m) => acc + m.totalProtein, 0);
              const carbs = log.meals.reduce((acc, m) => acc + m.totalCarbs, 0);
              const fat = log.meals.reduce((acc, m) => acc + m.totalFat, 0);
              const date = new Date(log.date);
              
              return (
                <div key={log.date} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{cals} kcal</div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex gap-3">
                       <span className="text-emerald-600 dark:text-emerald-400 font-medium">P: {protein}g</span>
                       <span className="text-blue-600 dark:text-blue-400 font-medium">C: {carbs}g</span>
                       <span className="text-amber-600 dark:text-amber-400 font-medium">F: {fat}g</span>
                    </div>
                    <div className="text-slate-400 dark:text-slate-500">{log.meals.length} meals</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30">
        <h3 className="font-bold text-emerald-900 dark:text-emerald-300 mb-2">Adaptive Goal Insight</h3>
        <p className="text-sm text-emerald-800 dark:text-emerald-400">
          You've been consistent with your deficit this week! If you maintain this pace, you are projected to reach your goal of {userProfile.targetWeightKg}kg in 6 weeks.
        </p>
      </div>
    </div>
  );
};
