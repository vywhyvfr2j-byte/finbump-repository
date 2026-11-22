import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';
import { buildDigest } from '@/lib/buildDigest';

// Keeps a single backend DigestSnapshot record (one per user) fresh with the
// latest digest text, so the server-side daily workflow can email the digest
// even when the app is closed. Best-effort: failures are logged and never
// block the UI — acts/events/gift ideas stay instant and local-first.
export function useDigestSnapshotSync() {
  const { settings, acts, events, giftIdeas } = useKeepsake();
  const timerRef = useRef(null);
  const idRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { sync(); }, 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.digestCadence, settings.email, acts, events, giftIdeas]);

  async function sync() {
    const email = settings.email;
    const cadence = settings.digestCadence;
    if (!email || !cadence) return;
    try {
      const { subject, body } = buildDigest({ acts, events, giftIdeas, cadence });
      const payload = { email, cadence, subject, body, lastBuiltAt: new Date().toISOString() };
      if (idRef.current) {
        await base44.entities.DigestSnapshot.update(idRef.current, payload);
        return;
      }
      const existing = await base44.entities.DigestSnapshot.list('-updated_date', 10, 0);
      if (existing.length) {
        idRef.current = existing[0].id;
        await base44.entities.DigestSnapshot.update(idRef.current, payload);
      } else {
        const created = await base44.entities.DigestSnapshot.create(payload);
        idRef.current = created.id;
      }
    } catch (err) {
      // Reset so a later sync re-resolves the snapshot id instead of failing on a stale one.
      console.warn('digest snapshot sync failed:', err?.message || err);
      idRef.current = null;
    }
  }
}

export default useDigestSnapshotSync;