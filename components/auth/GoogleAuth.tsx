import React from 'react';
import { useDrive } from '../../context/GoogleDriveContext';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

const GoogleAuth: React.FC = () => {
    const { isAuthenticated, isConfigured, user, signIn, signOut } = useDrive();

    if (!isConfigured) {
        return (
             <div className="p-4 text-center text-red-800 bg-red-100 border border-red-200 rounded-lg">
                <p className="font-semibold">Google Drive no configurado.</p>
                <p className="text-sm">Por favor, añada el Client ID en el archivo `constants.ts` para habilitar esta función.</p>
            </div>
        );
    }
    
    if (isAuthenticated && user) {
        return (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                    <img src={user.picture} alt="User" className="w-10 h-10 rounded-full"/>
                    <div>
                        <p className="font-semibold text-green-800">{user.name}</p>
                        <p className="text-xs text-green-600">{user.email}</p>
                    </div>
                </div>
                <button 
                    onClick={signOut}
                    className="flex items-center px-3 py-2 text-sm font-medium text-red-600 transition duration-200 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                    aria-label="Desconectar de Google Drive"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5 md:mr-2" />
                    <span className="hidden md:inline">Desconectar</span>
                </button>
            </div>
        );
    }

    return (
        <button 
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 font-semibold text-white transition duration-300 bg-secondary rounded-lg hover:bg-blue-600"
        >
            <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M44.5 24.5C44.5 22.9 44.3 21.4 44 20H24V28H35.8C35.2 30.7 33.7 32.9 31.4 34.4V39.6H38.5C42.4 35.9 44.5 30.7 44.5 24.5Z" fill="#4285F4"/>
                <path d="M24 45C30.5 45 35.9 42.7 39.5 39.6L31.4 34.4C29.2 35.8 26.8 36.5 24 36.5C18.5 36.5 13.9 33 12 28.5H4.8V33.7C8.4 40.5 15.7 45 24 45Z" fill="#34A853"/>
                <path d="M12 28.5C11.5 27.1 11.2 25.6 11.2 24C11.2 22.4 11.5 20.9 12 19.5V14.3H4.8C2.8 18.1 1.5 22.9 1.5 28C1.5 33.1 2.8 37.9 4.8 41.7L12 36.5V28.5Z" fill="#FBBC05"/>
                <path d="M24 11.5C27.3 11.5 30.1 12.7 32.4 14.8L40.2 7C35.9 3.2 30.5 1 24 1C15.7 1 8.4 5.5 4.8 12.3L12 17.5C13.9 13 18.5 9.5 24 9.5V11.5Z" fill="#EA4335"/>
            </svg>
            Conectar mi Cuenta de Google Drive
        </button>
    );
};

export default GoogleAuth;