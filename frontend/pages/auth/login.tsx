import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import backend from '~backend/client';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

export default function LoginPage({ onLoginSuccess, onNavigateToRegister }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await backend.auth.login({ username, password });
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      onLoginSuccess();
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-amber-100"
    >
      <Card className="w-full max-w-md mx-4 bg-slate-900/80 backdrop-blur-lg border-yellow-500/30 rounded-2xl shadow-2xl text-white">
        <CardHeader className="text-center space-y-2 py-8">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAMAAADLM3zqAAAAA1BMVEX///+nxBvIAAAAjklEQVR4nO3BMQEAAAwCoNm/9F3hAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgFduAAD+NAwHAAAAAElFTkSuQmCC" alt="MJ98 Logo" className="w-[150px] mx-auto" />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-400/70" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="pl-10 bg-slate-800/60 border-slate-700 placeholder:text-gray-400 text-white focus:ring-yellow-500 rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-400/70" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 bg-slate-800/60 border-slate-700 placeholder:text-gray-400 text-white focus:ring-yellow-500 rounded-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-yellow-500 text-black hover:bg-yellow-600 transition-transform hover:scale-105 rounded-lg py-3 font-bold text-lg"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'LOGIN'}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-yellow-400 hover:text-yellow-300 transition-transform hover:scale-105"
              onClick={onNavigateToRegister}
            >
              Don't have an account? Register
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
