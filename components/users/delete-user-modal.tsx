'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onDeleteUser: (userId: string, userName: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export function DeleteUserModal({ isOpen, user, onClose, onDeleteUser, loading, error }: DeleteUserModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      await onDeleteUser(user._id, user.name);
      onClose();
    } catch (error) {
      // Error is handled by parent component
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete User
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. This will permanently delete{' '}
              <strong>{user.name}</strong>'s account and remove all associated data.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">User Details:</h4>
            <div className="bg-muted/50 p-3 rounded-lg space-y-1">
              <p className="text-sm"><strong className="text-xs">Name:</strong> {user.name}</p>
              <p className="text-sm"><strong className="text-xs">Email:</strong> {user.email}</p>
              <p className="text-sm"><strong className="text-xs">ID:</strong> {user._id}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Type "DELETE" to confirm:
            </Label>
            <Input
              type="text"
              placeholder="Type DELETE to confirm"
              className="text-center font-mono"
              required
              pattern="DELETE"
              title="Please type DELETE to confirm deletion"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
