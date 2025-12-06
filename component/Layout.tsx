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


