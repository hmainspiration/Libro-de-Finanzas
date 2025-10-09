
import React, { useState } from 'react';
import { BuildingStorefrontIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [churchName, setChurchName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (churchName === 'La Empresa' && password === 'NIMT02') {
      setError('');
      onLoginSuccess();
    } else {
      setError('Credenciales incorrectas. Intente nuevamente.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Sistema de Finanzas</h1>
          <p className="text-gray-500">Bienvenido</p>
        </div>
        
        {error && <div className="p-3 text-sm text-center text-red-800 bg-red-100 border border-red-200 rounded-lg">{error}</div>}

        <div className="space-y-4">
          <div>
            <label htmlFor="churchName" className="text-sm font-medium text-gray-700">Nombre de Iglesia</label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <BuildingStorefrontIcon className="w-5 h-5 text-gray-400" />
              </span>
              <input
                id="churchName"
                type="text"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                placeholder="Iglesia"
                className="w-full py-3 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password-login" className="text-sm font-medium text-gray-700">Clave de Iglesia</label>
            <div className="relative mt-1">
               <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LockClosedIcon className="w-5 h-5 text-gray-400" />
              </span>
              <input
                id="password-login"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-3 font-semibold text-white transition duration-300 rounded-lg bg-secondary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
        >
          Ingresar
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
