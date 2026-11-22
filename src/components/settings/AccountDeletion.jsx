import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { base44 } from '@/api/base44Client';
import { clearAppCaches } from '@/lib/appCache';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

const DELETED_ITEMS = [
  'All acts of support and their completion history',
  'Every event, milestone, and special date',
  'All gift ideas, budgets, and purchase records',
  'Every person, pet, and their profile details',
  'All trips, vacation plans, and itineraries',
  'Personal notes, goals, and communication logs',
  'Your profile, preferences, and paired partner link',
];

export default function AccountDeletion() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { deleteAccount } = useKeepsake();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [open, setOpen] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!canDelete) return;
    setDeleting(true);
    try {
      await deleteAccount();
      toast({ title: 'Account data cleared', description: 'Signing you out…' });
      await clearAppCaches();
      await base44.auth.logout();
      // The caches are already cleared and the token is gone, so a router hop to
      // the login screen is enough — no reload needed.
      navigate('/login', { replace: true });
    } catch {
      setDeleting(false);
      toast({ title: 'Could not delete account', variant: 'destructive' });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setConfirmText(''); setDeleting(false); } }}>
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-destructive">Delete account</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permanently clears every act, event, gift, person, and trip tied to your account, then signs you out.
          </p>
        </div>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full h-11 rounded-xl">
            <Trash2 size={16} /> Delete account
          </Button>
        </AlertDialogTrigger>
      </div>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={18} /> {t('app.deleteAccount')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="font-medium text-foreground">This will permanently erase everything below — it cannot be undone:</p>
              <ul className="space-y-1.5">
                {DELETED_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm">You'll be signed out immediately afterwards. If you're paired with a partner, they'll lose access to anything you shared.</p>
              <p className="text-sm font-medium text-foreground">
                Type <span className="font-bold text-destructive tracking-wider">DELETE</span> below to confirm:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="h-11"
                disabled={deleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canDelete || deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Deleting…' : 'Yes, delete everything'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}