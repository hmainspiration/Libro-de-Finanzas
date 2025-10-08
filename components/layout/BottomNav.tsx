
import React from 'react';
import { Tab } from '../../types';
import { HomeIcon, ChartBarIcon, CalendarDaysIcon, ChartPieIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const navItems = [
  { id: 'register', label: 'Registro', icon: HomeIcon },
  { id: 'summary', label: 'Resumen', icon: ChartBarIcon },
  { id: 'history', label: 'Semanas', icon: CalendarDaysIcon },
  { id: 'monthly', label: 'Mensual', icon: ChartPieIcon },
  { id: 'admin', label: 'Admin', icon: Cog6ToothIcon },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-t-lg">
      <div className="flex justify-around max-w-4xl mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition-colors duration-200 ${
              activeTab === item.id ? 'text-secondary' : 'text-gray-500 hover:text-secondary'
            }`}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span>{item.label}</span>
            {activeTab === item.id && <div className="w-8 h-1 mt-1 rounded-full bg-secondary"></div>}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
