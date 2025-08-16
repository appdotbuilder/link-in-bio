import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { AuthResponse, RegisterUserInput, LoginUserInput } from '../../../server/src/schema';

// Safe user type without password_hash for frontend use
type SafeUser = AuthResponse['user'];

interface AuthPageProps {
  onAuthSuccess: (user: SafeUser) => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register form state
  const [registerForm, setRegisterForm] = useState<RegisterUserInput>({
    username: '',
    email: '',
    password: '',
    display_name: null,
    bio: null
  });

  // Login form state
  const [loginForm, setLoginForm] = useState<LoginUserInput>({
    email: '',
    password: ''
  });

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await trpc.registerUser.mutate(registerForm);
      onAuthSuccess(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [registerForm, onAuthSuccess]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await trpc.loginUser.mutate(loginForm);
      onAuthSuccess(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }, [loginForm, onAuthSuccess]);

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Sign In</TabsTrigger>
        <TabsTrigger value="register">Sign Up</TabsTrigger>
      </TabsList>

      {error && (
        <Alert className="mt-4 border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <TabsContent value="login" className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="your@email.com"
              value={loginForm.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLoginForm((prev: LoginUserInput) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="Your password"
              value={loginForm.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLoginForm((prev: LoginUserInput) => ({ ...prev, password: e.target.value }))
              }
              required
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Signing in...' : 'Sign In 🚀'}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="register" className="space-y-4">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="register-username">Username</Label>
            <Input
              id="register-username"
              type="text"
              placeholder="your_username"
              value={registerForm.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRegisterForm((prev: RegisterUserInput) => ({ ...prev, username: e.target.value }))
              }
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-zA-Z0-9_]+$"
              title="Username can only contain letters, numbers, and underscores"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Your username will be your unique profile URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="your@email.com"
              value={registerForm.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRegisterForm((prev: RegisterUserInput) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>
            <Input
              id="register-password"
              type="password"
              placeholder="Choose a strong password"
              value={registerForm.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRegisterForm((prev: RegisterUserInput) => ({ ...prev, password: e.target.value }))
              }
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-display-name">Display Name (optional)</Label>
            <Input
              id="register-display-name"
              type="text"
              placeholder="Your display name"
              value={registerForm.display_name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setRegisterForm((prev: RegisterUserInput) => ({
                  ...prev,
                  display_name: e.target.value || null
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-bio">Bio (optional)</Label>
            <Textarea
              id="register-bio"
              placeholder="Tell people about yourself..."
              value={registerForm.bio || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRegisterForm((prev: RegisterUserInput) => ({
                  ...prev,
                  bio: e.target.value || null
                }))
              }
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating account...' : 'Create Account ✨'}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}