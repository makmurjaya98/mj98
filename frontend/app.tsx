import React, { useState } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from "@/components/ui/toaster"
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import DashboardLayout from './components/layout/DashboardLayout';

type AuthPage = 'login' | 'register';

export default function App() {
  // In a real app, this would be driven by a token in localStorage or a cookie
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPage>('login');

  const renderContent = () => {
    if (isAuthenticated) {
      return <DashboardLayout onLogout={() => setIsAuthenticated(false)} />;
    }
    
    switch (authPage) {
      case 'login':
        return <LoginPage 
                  onLoginSuccess={() => setIsAuthenticated(true)} 
                  onNavigateToRegister={() => setAuthPage('register')} 
               />;
      case 'register':
        return <RegisterPage onNavigateToLogin={() => setAuthPage('login')} />;
      default:
        return <LoginPage 
                  onLoginSuccess={() => setIsAuthenticated(true)} 
                  onNavigateToRegister={() => setAuthPage('register')} 
               />;
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {renderContent()}
      <Toaster />
    </ThemeProvider>
  );
}
