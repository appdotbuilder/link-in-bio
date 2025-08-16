import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Link, CreateLinkInput, UpdateLinkInput } from '../../../server/src/schema';

interface LinkManagerProps {
  userId: number;
  links: Link[];
  onLinksChange: (links: Link[]) => void;
  isLoading: boolean;
}

interface LinkFormData {
  title: string;
  url: string;
  icon: string | null;
}

export function LinkManager({ userId, links, onLinksChange, isLoading }: LinkManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [deletingLink, setDeletingLink] = useState<Link | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating/editing links
  const [formData, setFormData] = useState<LinkFormData>({
    title: '',
    url: '',
    icon: null
  });

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      url: '',
      icon: null
    });
    setError(null);
  }, []);

  const openCreateDialog = useCallback(() => {
    resetForm();
    setIsCreating(true);
  }, [resetForm]);

  const openEditDialog = useCallback((link: Link) => {
    setFormData({
      title: link.title,
      url: link.url,
      icon: link.icon
    });
    setEditingLink(link);
    setError(null);
  }, []);

  const handleCreateLink = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      const createInput: CreateLinkInput = {
        user_id: userId,
        title: formData.title,
        url: formData.url,
        icon: formData.icon || null,
        order_index: links.length
      };

      const newLink = await trpc.createLink.mutate(createInput);
      onLinksChange([...links, newLink]);
      setIsCreating(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setActionLoading(false);
    }
  }, [userId, formData, links, onLinksChange, resetForm]);

  const handleUpdateLink = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    setActionLoading(true);
    setError(null);

    try {
      const updateInput: UpdateLinkInput = {
        id: editingLink.id,
        title: formData.title,
        url: formData.url,
        icon: formData.icon || null
      };

      const updatedLink = await trpc.updateLink.mutate(updateInput);
      onLinksChange(links.map((link: Link) => 
        link.id === editingLink.id ? updatedLink : link
      ));
      setEditingLink(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update link');
    } finally {
      setActionLoading(false);
    }
  }, [editingLink, formData, links, onLinksChange, resetForm]);

  const handleToggleActive = useCallback(async (link: Link) => {
    setActionLoading(true);

    try {
      const updateInput: UpdateLinkInput = {
        id: link.id,
        is_active: !link.is_active
      };

      const updatedLink = await trpc.updateLink.mutate(updateInput);
      onLinksChange(links.map((l: Link) => 
        l.id === link.id ? updatedLink : l
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update link status');
    } finally {
      setActionLoading(false);
    }
  }, [links, onLinksChange]);

  const handleDeleteLink = useCallback(async () => {
    if (!deletingLink) return;

    setActionLoading(true);
    setError(null);

    try {
      await trpc.deleteLink.mutate({ linkId: deletingLink.id });
      onLinksChange(links.filter((link: Link) => link.id !== deletingLink.id));
      setDeletingLink(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete link');
    } finally {
      setActionLoading(false);
    }
  }, [deletingLink, links, onLinksChange]);

  const LinkForm = ({ onSubmit, submitText }: { onSubmit: (e: React.FormEvent) => Promise<void>; submitText: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="link-title">Title</Label>
        <Input
          id="link-title"
          placeholder="My awesome link"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: LinkFormData) => ({ ...prev, title: e.target.value }))
          }
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="link-url">URL</Label>
        <Input
          id="link-url"
          type="url"
          placeholder="https://example.com"
          value={formData.url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: LinkFormData) => ({ ...prev, url: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="link-icon">Icon (optional)</Label>
        <Input
          id="link-icon"
          placeholder="🌐 or icon name"
          value={formData.icon || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: LinkFormData) => ({ 
              ...prev, 
              icon: e.target.value || null 
            }))
          }
        />
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Use emoji or icon names like "globe", "github", "twitter"
        </p>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={actionLoading}>
          {actionLoading ? 'Saving...' : submitText}
        </Button>
      </DialogFooter>
    </form>
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading your links...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Link Button */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <Button onClick={openCreateDialog} className="w-full">
            ➕ Add New Link
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Link</DialogTitle>
            <DialogDescription>
              Create a new link for your profile
            </DialogDescription>
          </DialogHeader>
          <LinkForm onSubmit={handleCreateLink} submitText="Create Link" />
        </DialogContent>
      </Dialog>

      {/* Links List */}
      {links.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-4xl mb-4">🔗</div>
            <CardTitle className="mb-2">No links yet</CardTitle>
            <CardDescription className="mb-4">
              Create your first link to get started with your profile page
            </CardDescription>
            <Button onClick={openCreateDialog}>
              Create Your First Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {links.map((link: Link) => (
            <Card key={link.id} className={`transition-all ${!link.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">
                      {link.icon || '🔗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{link.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {link.url}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        👆 {link.click_count}
                      </Badge>
                      {!link.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Active */}
                    <Switch
                      checked={link.is_active}
                      onCheckedChange={() => handleToggleActive(link)}
                      disabled={actionLoading}
                    />

                    {/* Edit Link */}
                    <Dialog 
                      open={editingLink?.id === link.id} 
                      onOpenChange={(open) => !open && setEditingLink(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => openEditDialog(link)}
                          variant="outline"
                          size="sm"
                        >
                          ✏️
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Link</DialogTitle>
                          <DialogDescription>
                            Update your link details
                          </DialogDescription>
                        </DialogHeader>
                        <LinkForm onSubmit={handleUpdateLink} submitText="Update Link" />
                      </DialogContent>
                    </Dialog>

                    {/* Delete Link */}
                    <AlertDialog 
                      open={deletingLink?.id === link.id}
                      onOpenChange={(open) => !open && setDeletingLink(null)}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          onClick={() => setDeletingLink(link)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          🗑️
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Link</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{link.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteLink}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}