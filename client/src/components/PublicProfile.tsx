import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { PublicProfile as PublicProfileType } from '../../../server/src/schema';

interface PublicProfileProps {
  username: string;
  onBack: () => void;
}

export function PublicProfile({ username, onBack }: PublicProfileProps) {
  const [profile, setProfile] = useState<PublicProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickingLinks, setClickingLinks] = useState<Set<number>>(new Set());

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profileData = await trpc.getPublicProfile.query({ username });
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLinkClick = useCallback(async (linkId: number, url: string) => {
    // Track click analytics
    try {
      setClickingLinks((prev) => new Set(prev).add(linkId));
      await trpc.trackClick.mutate({ link_id: linkId });
      
      // Open link in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to track click:', err);
      // Still open the link even if tracking fails
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setClickingLinks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(linkId);
        return newSet;
      });
    }
  }, []);

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const copyProfileUrl = useCallback(() => {
    const url = `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(url);
    // Could add a toast notification here
  }, [username]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading profile...</p>
            <p className="text-gray-600 dark:text-gray-400">@{username}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">😞</div>
            <CardTitle className="mb-2">Profile Not Found</CardTitle>
            <CardDescription className="mb-6">
              {error}
            </CardDescription>
            <div className="flex gap-2 justify-center">
              <Button onClick={onBack} variant="outline">
                ← Go Back
              </Button>
              <Button onClick={loadProfile}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Button onClick={onBack} variant="outline" size="sm">
        ← Back
      </Button>

      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-xl">
        <CardContent className="text-center py-8">
          <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-white/30">
            <AvatarImage 
              src={profile.avatar_url || undefined} 
              alt={profile.display_name || profile.username} 
            />
            <AvatarFallback className="bg-white/20 text-white text-xl">
              {getInitials(profile.display_name || profile.username)}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-3xl font-bold mb-2">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-purple-100 mb-4">@{profile.username}</p>

          {profile.bio && (
            <p className="text-purple-100 max-w-md mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}

          <div className="flex justify-center gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-xl font-bold">{profile.links.length}</div>
              <div className="text-xs text-purple-100">Links</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-xl font-bold">
                {profile.links.reduce((sum, link) => sum + link.click_count, 0)}
              </div>
              <div className="text-xs text-purple-100">Total Clicks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      {profile.links.length === 0 ? (
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">🔗</div>
            <CardTitle className="mb-2">No links yet</CardTitle>
            <CardDescription>
              This user hasn't added any links to their profile yet.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {profile.links.map((link) => {
            const isClicking = clickingLinks.has(link.id);
            return (
              <Card 
                key={link.id} 
                className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 ${
                  isClicking ? 'scale-95' : 'hover:scale-[1.02]'
                }`}
                onClick={() => handleLinkClick(link.id, link.url)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl flex-shrink-0">
                      {link.icon || '🔗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate">
                        {link.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm truncate">
                        {link.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        👆 {link.click_count}
                      </Badge>
                      <div className="text-gray-400">
                        {isClicking ? '⏳' : '↗️'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-0">
        <CardContent className="text-center py-6">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <Button onClick={copyProfileUrl} variant="ghost" size="sm">
              📋 Copy Profile URL
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <span>Powered by 🔗 LinkHub</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}