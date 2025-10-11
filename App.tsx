
import React, { useState, useCallback } from 'react';
import LoginScreen from './screens/LoginScreen';
import MainApp from './screens/MainApp';
import { GoogleDriveProvider } from './context/GoogleDriveContext';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return (
    <GoogleDriveProvider>
      <div className="min-h-screen bg-gray-100 text-dark">
        {isAuthenticated ? (
          <MainApp onLogout={handleLogout} />
        ) : (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
    </GoogleDriveProvider>
  );
};

export default App;
