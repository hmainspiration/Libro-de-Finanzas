
import React from 'react';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between p-4 text-white shadow-md bg-primary">
      <h1 className="text-xl font-bold">Sistema de Finanzas</h1>
      <button 
        onClick={onLogout}
        className="flex items-center px-3 py-2 text-sm font-medium transition duration-200 bg-white rounded-lg text-primary hover:bg-gray-200"
        aria-label="Cerrar sesión"
      >
        <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
        <span>Cerrar sesión</span>
      </button>
    </header>
  );
};

export default Header;
