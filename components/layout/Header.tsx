import React from 'react';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between p-4 text-white shadow-md bg-indigo-900 gap-4">
      <h1 className="text-xl font-bold whitespace-nowrap">Sistema de Finanzas</h1>
      <div className="flex items-center gap-2">
        <button 
          onClick={onLogout}
          className="flex items-center px-3 py-2 text-sm font-medium transition duration-200 bg-white rounded-lg text-indigo-900 hover:bg-gray-200"
          aria-label="Cerrar sesión"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 md:mr-2" />
          <span className="hidden md:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
};

export default Header;