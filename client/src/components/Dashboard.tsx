import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LinkManager } from '@/components/LinkManager';
import { ProfileEditor } from '@/components/ProfileEditor';
import { trpc } from '@/utils/trpc';
import type { AuthResponse, Link } from '../../../server/src/schema';

// Safe user type without password_hash for frontend use
type SafeUser = AuthResponse['user'];

interface DashboardProps {
  user: SafeUser;
  onViewProfile: (username: string) => void;
}

export function Dashboard({ user, onViewProfile }: DashboardProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'links' | 'profile'>('links');
  const [error, setError] = useState<string | null>(null);

  const loadUserLinks = useCallback(async () => {
    try {
      setIsLoading(true);
      const userLinks = await trpc.getUserLinks.query({ userId: user.id });
      setLinks(userLinks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load links');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadUserLinks();
  }, [loadUserLinks]);

  const totalClicks = links.reduce((sum: number, link: Link) => sum + link.click_count, 0);
  const activeLinks = links.filter((link: Link) => link.is_active);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
        <CardHeader>
          <CardTitle className="text-3xl">
            Welcome back, {user.display_name || user.username}! 👋
          </CardTitle>
          <CardDescription className="text-purple-100">
            Manage your links and track your engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
            <div className="text-2xl font-bold">{links.length}</div>
            <div className="text-sm text-purple-100">Total Links</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
            <div className="text-2xl font-bold">{activeLinks.length}</div>
            <div className="text-sm text-purple-100">Active Links</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
            <div className="text-2xl font-bold">{totalClicks}</div>
            <div className="text-sm text-purple-100">Total Clicks</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3">
            <Button 
              onClick={() => onViewProfile(user.username)}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              View Public Profile 🔗
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveTab('links')}
          variant={activeTab === 'links' ? 'default' : 'outline'}
        >
          📎 Links
        </Button>
        <Button
          onClick={() => setActiveTab('profile')}
          variant={activeTab === 'profile' ? 'default' : 'outline'}
        >
          👤 Profile Settings
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <Button 
              onClick={loadUserLinks} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {activeTab === 'links' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔗 Link Management
                <Badge variant="secondary">{links.length}</Badge>
              </CardTitle>
              <CardDescription>
                Add, edit, and organize your links. Drag to reorder them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinkManager 
                userId={user.id}
                links={links}
                onLinksChange={setLinks}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👤 Profile Settings
              </CardTitle>
              <CardDescription>
                Update your public profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileEditor user={user} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}