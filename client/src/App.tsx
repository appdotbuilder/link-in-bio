import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { AuthPage } from '@/components/AuthPage';
import { Dashboard } from '@/components/Dashboard';
import { PublicProfile } from '@/components/PublicProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AuthResponse } from '../../server/src/schema';

// Safe user type without password_hash for frontend use
type SafeUser = AuthResponse['user'];

function App() {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [currentView, setCurrentView] = useState<'auth' | 'dashboard' | 'profile'>('auth');
  const [profileUsername, setProfileUsername] = useState('');
  const [searchUsername, setSearchUsername] = useState('');

  // Check for stored user session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser) as SafeUser;
        setUser(userData);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleAuthSuccess = useCallback((userData: SafeUser) => {
    setUser(userData);
    setCurrentView('dashboard');
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setCurrentView('auth');
    localStorage.removeItem('user');
  }, []);

  const handleViewProfile = useCallback((username: string) => {
    setProfileUsername(username);
    setCurrentView('profile');
  }, []);

  const handleSearchProfile = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchUsername.trim()) {
      handleViewProfile(searchUsername.trim());
    }
  }, [searchUsername, handleViewProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('auth')}
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              🔗 LinkHub
            </button>

            {/* Profile Search */}
            <form onSubmit={handleSearchProfile} className="hidden sm:flex items-center gap-2">
              <Input
                type="text"
                placeholder="Search profile..."
                value={searchUsername}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchUsername(e.target.value)}
                className="w-40 h-8 text-sm"
              />
              <Button type="submit" size="sm" variant="outline">
                🔍
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button
                  onClick={() => setCurrentView('dashboard')}
                  variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={() => handleViewProfile(user.username)}
                  variant={currentView === 'profile' && profileUsername === user.username ? 'default' : 'ghost'}
                  size="sm"
                >
                  My Profile
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setCurrentView('auth')}
                variant={currentView === 'auth' ? 'default' : 'ghost'}
                size="sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Profile Search */}
        <div className="sm:hidden border-t px-4 py-3">
          <form onSubmit={handleSearchProfile} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search profile..."
              value={searchUsername}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchUsername(e.target.value)}
              className="flex-1 h-8 text-sm"
            />
            <Button type="submit" size="sm" variant="outline">
              🔍
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'auth' && !user && (
          <div className="max-w-md mx-auto">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome to LinkHub
                </CardTitle>
                <CardDescription className="text-lg">
                  Create your personalized link-in-bio page 🌟
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuthPage onAuthSuccess={handleAuthSuccess} />
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'dashboard' && user && (
          <Dashboard user={user} onViewProfile={handleViewProfile} />
        )}

        {currentView === 'profile' && profileUsername && (
          <PublicProfile username={profileUsername} onBack={() => setCurrentView(user ? 'dashboard' : 'auth')} />
        )}

        {currentView === 'auth' && user && (
          <div className="text-center">
            <Card className="max-w-md mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Welcome back, {user.display_name || user.username}! 👋</CardTitle>
                <CardDescription>
                  Ready to manage your links?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setCurrentView('dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;