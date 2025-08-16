import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { AuthResponse, UpdateUserProfileInput } from '../../../server/src/schema';

// Safe user type without password_hash for frontend use
type SafeUser = AuthResponse['user'];

interface ProfileEditorProps {
  user: SafeUser;
}

export function ProfileEditor({ user }: ProfileEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<{
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
  }>({
    display_name: user.display_name,
    bio: user.bio,
    avatar_url: user.avatar_url
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updateInput: UpdateUserProfileInput = {
        id: user.id,
        display_name: formData.display_name || null,
        bio: formData.bio || null,
        avatar_url: formData.avatar_url || null
      };

      await trpc.updateUserProfile.mutate(updateInput);
      setSuccess(true);
      
      // Update localStorage with new user data
      const updatedUser = {
        ...user,
        ...formData
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }, [user, formData]);

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  return (
    <div className="space-y-6">
      {/* Profile Preview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={formData.avatar_url || undefined} 
                alt={formData.display_name || user.username} 
              />
              <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                {getInitials(formData.display_name || user.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold">
                {formData.display_name || user.username}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                @{user.username}
              </div>
            </div>
          </CardTitle>
          {formData.bio && (
            <CardDescription className="text-gray-700 dark:text-gray-300">
              {formData.bio}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <AlertDescription>✅ Profile updated successfully!</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={user.username}
              disabled
              className="bg-gray-50 dark:bg-gray-900"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Username cannot be changed. This is your unique profile URL.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-50 dark:bg-gray-900"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Email cannot be changed from this interface.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="Your display name"
              value={formData.display_name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ 
                  ...prev, 
                  display_name: e.target.value || null 
                }))
              }
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              This is how your name will appear on your public profile.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-url">Avatar URL</Label>
            <Input
              id="avatar-url"
              type="url"
              placeholder="https://example.com/your-avatar.jpg"
              value={formData.avatar_url || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ 
                  ...prev, 
                  avatar_url: e.target.value || null 
                }))
              }
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Enter a URL to your profile picture.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell people about yourself..."
              value={formData.bio || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ 
                  ...prev, 
                  bio: e.target.value || null 
                }))
              }
              rows={4}
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              A short description about yourself for your public profile.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Saving Changes...' : 'Save Changes 💾'}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setFormData({
              display_name: user.display_name,
              bio: user.bio,
              avatar_url: user.avatar_url
            })}
            disabled={isLoading}
          >
            Reset
          </Button>
        </div>
      </form>

      {/* Profile URL Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔗 Your Profile URL</CardTitle>
          <CardDescription>
            Share this link with others to show them your links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/${user.username}`}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/${user.username}`);
              }}
              variant="outline"
              size="sm"
            >
              📋 Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}