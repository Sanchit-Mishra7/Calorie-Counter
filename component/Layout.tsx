import React from 'react';
import { Home, PieChart, User, MessageCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'progress' | 'coach' | 'profile';
  onTabChange: (tab: 'dashboard' | 'progress' | 'coach' | 'profile') => void;
  showNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, showNav = true }) => {
  const navItems = [
    { id: 'dashboard' as const, label: 'Home', icon: Home },
    { id: 'coach' as const, label: 'Coach', icon: MessageCircle },
    { id: 'progress' as const, label: 'Progress', icon: PieChart },
    { id: 'profile' as const, label: 'Profile', icon: User },
 ];

    return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-200 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 left-0 z-50 shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-emerald-200 dark:shadow-none shadow-md">
            C
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Calorie Counter</span>
        </div>

    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-800'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
                <item.icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${activeTab === item.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 relative h-full"> 
        {/* Mobile Header */}
        <div className="md:hidden px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-sm">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
             <span className="font-bold text-lg text-slate-900 dark:text-white">Calorie Counter</span>
           </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24 md:pb-8 h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {showNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex justify-between items-center z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'text-emerald-600 dark:text-emerald-500'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-current opacity-20' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};