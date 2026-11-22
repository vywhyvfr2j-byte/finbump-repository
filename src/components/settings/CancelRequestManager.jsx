import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function CancelRequestManager() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const all = await base44.entities.CancelRequest.filter({ status: 'pending' }, '-created_date', 50);
      setRequests(all || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId, action) => {
    setProcessing(requestId);
    try {
      const res = await base44.functions.invoke('approve-cancellation', { requestId, action });
      const data = res?.data || res;
      if (data?.error) {
        toast({ title: 'Could not process', description: data.error, variant: 'destructive' });
        return;
      }
      if (action === 'approve') {
        toast({
          title: 'Cancellation approved',
          description:
            data?.refundAmount > 0
              ? `Refund $${data.refundAmount.toFixed(2)} to process manually in Wix dashboard.`
              : 'Subscription canceled. No refund needed (trial).',
        });
      } else {
        toast({ title: 'Cancellation rejected' });
      }
      fetchRequests();
    } catch {
      toast({ title: 'Could not process', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <p className="font-display text-base font-semibold">Cancellation requests</p>
      {requests.map((r) => (
        <div key={r.id} className="border border-border rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium">{r.userEmail}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(r.requestDate).toLocaleDateString()}
            </p>
          </div>
          {r.isTrial ? (
            <p className="text-xs text-muted-foreground">
              Trial cancellation — no charge, no refund needed.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {r.monthsUsed} month{r.monthsUsed !== 1 ? 's' : ''} used · Refund: $
              {r.refundAmount?.toFixed(2)} · Effective: {new Date(r.effectiveDate).toLocaleDateString()}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAction(r.id, 'approve')}
              disabled={processing === r.id}
              className="flex-1 h-9 rounded-lg"
            >
              {processing === r.id ? '…' : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction(r.id, 'reject')}
              disabled={processing === r.id}
              className="flex-1 h-9 rounded-lg"
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}