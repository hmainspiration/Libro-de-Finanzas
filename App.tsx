import React, { useState, useCallback, useEffect } from 'react';
import LoginScreen from './screens/LoginScreen';
import MainApp from './screens/MainApp';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Verificar si hay sesión guardada al cargar la app
  useEffect(() => {
    const savedSession = localStorage.getItem('churchSession');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      if (session.loggedIn) {
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    // Limpiar sesión
    localStorage.removeItem('churchSession');
    setIsAuthenticated(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-dark">
      {isAuthenticated ? (
        <MainApp onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;
