import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import backend from '~backend/client';

interface RegisterProps {
  onNavigateToLogin: () => void;
}

export default function Register({ onNavigateToLogin }: RegisterProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hierarchyOptions, setHierarchyOptions] = useState<any[]>([]);
  const [canRegisterOwner, setCanRegisterOwner] = useState(true);
  const [canRegisterAdmin, setCanRegisterAdmin] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkRegistrationLimits();
  }, []);

  useEffect(() => {
    if (role && ['Cabang', 'Link'].includes(role)) {
      fetchHierarchyOptions();
    }
  }, [role]);

  const checkRegistrationLimits = async () => {
    try {
      const response = await backend.auth.getHierarchyOptions();
      setCanRegisterOwner(response.ownerCount === 0);
      setCanRegisterAdmin(response.adminCount < 2);
    } catch (error) {
      console.error('Failed to check registration limits:', error);
    }
  };

  const fetchHierarchyOptions = async () => {
    try {
      const response = await backend.auth.getHierarchyOptions();
      if (role === 'Cabang') {
        setHierarchyOptions(response.mitraCabang);
      } else if (role === 'Link') {
        const linkOptions = response.cabang.map(c => {
          const mitra = response.mitraCabang.find(m => m.id === c.parentId);
          return { ...c, mitraName: mitra?.fullName || 'Unknown' };
        });
        setHierarchyOptions(linkOptions);
      }
    } catch (error) {
      console.error('Failed to fetch hierarchy options:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hierarchy options.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idNumber) {
      toast({
        title: 'Error',
        description: "ID number is required",
        variant: 'destructive',
      });
      return;
    }

    if (!fullName || !username || !email || !password || !role) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if ((role === 'Cabang' || role === 'Link') && !parentId) {
      toast({
        title: 'Error',
        description: `Please select a parent ${role === 'Cabang' ? 'Mitra Cabang' : 'Cabang'}.`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName,
        username,
        email,
        password,
        confirmPassword,
        role: role as any,
        idNumber,
        address,
        phoneNumber,
        parentId: parentId || undefined,
      };

      await backend.auth.register(payload);

      toast({
        title: 'Success',
        description: 'Registration successful! You can now log in.',
      });
      
      onNavigateToLogin();
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleOptions = () => {
    const options = [];
    
    if (canRegisterOwner) {
      options.push({ value: 'Owner', label: 'Owner' });
    }
    
    if (canRegisterAdmin) {
      options.push({ value: 'Admin', label: 'Admin' });
    }
    
    options.push(
      { value: 'Mitra Cabang', label: 'Mitra Cabang' },
      { value: 'Cabang', label: 'Cabang' },
      { value: 'Link', label: 'Link' }
    );
    
    return options;
  };

  const inputStyles = "bg-yellow-400 text-black placeholder:text-gray-800 border-yellow-500 focus:ring-yellow-400 rounded-lg";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative z-10 bg-gradient-to-br from-blue-900 to-slate-900 backdrop-blur-sm border-2 border-yellow-500/50 shadow-2xl text-white">
        <CardHeader className="text-center space-y-2 py-8">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAMAAADLM3zqAAAAA1BMVEX///+nxBvIAAAAjklEQVR4nO3BMQEAAAwCoNm/9F3hAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgFduAAD+NAwHAAAAAElFTkSuQmCC" alt="MJ98 Logo" className="w-[150px] mx-auto" />
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputStyles}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={inputStyles}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-300">Address</Label>
              <Input
                id="address"
                placeholder="Enter your address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-gray-300">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={inputStyles}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputStyles}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber" className="text-gray-300">ID Number</Label>
              <Input
                id="idNumber"
                placeholder="Enter your ID Number"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
                className={inputStyles}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {getRoleOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === 'Cabang' && (
              <div className="space-y-2">
                <Label htmlFor="mitraCabang" className="text-gray-300">Select Mitra Cabang</Label>
                <Select value={parentId?.toString() || ''} onValueChange={(value) => setParentId(parseInt(value))}>
                  <SelectTrigger className={inputStyles}>
                    <SelectValue placeholder="Choose Mitra Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchyOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {role === 'Link' && (
              <div className="space-y-2">
                <Label htmlFor="cabang" className="text-gray-300">Select Cabang</Label>
                <Select value={parentId?.toString() || ''} onValueChange={(value) => setParentId(parseInt(value))}>
                  <SelectTrigger className={inputStyles}>
                    <SelectValue placeholder="Choose Cabang" />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchyOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.fullName} (under {option.mitraName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputStyles} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-black"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`${inputStyles} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-black"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300">
              Already have an account?{' '}
              <button
                onClick={onNavigateToLogin}
                className="text-yellow-400 hover:text-yellow-300 font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
