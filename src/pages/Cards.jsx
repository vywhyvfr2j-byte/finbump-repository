import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import TopNav from '@/components/TopNav';
import CardView from '@/components/cards/CardView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TEMPLATE_MAP } from '@/lib/cardTemplates';
import { relativeLast } from '@/lib/keepsakeUtils';
import { Mail, Send, Plus, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Cards inbox: lists cards the user has received (app-to-app) and sent. A
// realtime subscription refreshes the list when new cards arrive. Opening a
// received card marks it read via the mark-card-read backend function.
export default function Cards() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [cards, setCards] = useState(null);
  const [tab, setTab] = useState('received');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      const all = await base44.entities.Card.list('-deliveredAt', 100);
      setCards(all);
    } catch {
      setCards([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsub = base44.entities.Card.subscribe(() => { load(); });
    return unsub;
  }, [load]);

  const received = useMemo(() => (cards || []).filter((c) => String(c.recipientUserId) === String(user?.id)), [cards, user]);
  const sent = useMemo(() => (cards || []).filter((c) => String(c.created_by_id) === String(user?.id)), [cards, user]);
  const unreadCount = received.filter((c) => !c.readAt).length;
  const list = tab === 'received' ? received : sent;
  const openCard = list.find((c) => c.id === openId) || (cards || []).find((c) => c.id === openId) || null;

  const markRead = useCallback(async (card) => {
    if (!card || card.readAt) return;
    try { await base44.functions.invoke('mark-card-read', { cardId: card.id }); load(); } catch {}
  }, [load]);

  const handleOpen = (card) => {
    setOpenId(card.id);
    if (tab === 'received' && !card.readAt) markRead(card);
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('cards.title')} subtitle={t('cards.subtitle')} back />
      <div className="px-5 mt-2 space-y-4">
        <Link to="/card-builder" className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-medium text-sm">
          <Plus size={16} /> {t('cards.sendCard')}
        </Link>

        <div className="flex rounded-2xl bg-secondary/60 p-1">
          {['received', 'sent'].map((tabKey) => (
            <button key={tabKey} onClick={() => setTab(tabKey)} className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-medium capitalize transition-colors ${tab === tabKey ? 'bg-card shadow-card text-foreground' : 'text-muted-foreground'}`}>
              {tabKey === 'received' ? <Mail size={15} /> : <Send size={15} />} {tabKey === 'received' ? t('cards.received') : t('cards.sent')}
              {tabKey === 'received' && unreadCount > 0 && <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{unreadCount}</span>}
            </button>
          ))}
        </div>

        {cards === null ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {tab === 'received' ? t('cards.noReceived') : t('cards.noSent')}
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((c) => {
              const tpl = TEMPLATE_MAP[c.templateKey] || TEMPLATE_MAP[c.occasion] || TEMPLATE_MAP['justbecause'];
              const incoming = tab === 'received';
              const name = incoming ? (c.senderName || t('cards.someone')) : (c.personName || c.recipientEmail || '—');
              return (
                <button key={c.id} onClick={() => handleOpen(c)} className="w-full text-left">
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card shadow-card">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tpl.gradient} ${tpl.ink} flex items-center justify-center text-xl shrink-0`}>{tpl.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{incoming ? t('cards.from') : t('cards.to')}{name}</p>
                        {incoming && !c.readAt && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{tpl.label} · {c.message?.slice(0, 60) || ''}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.deliveredAt ? relativeLast(c.deliveredAt) : ''}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!openCard} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-[420px] p-0 overflow-hidden">
          <DialogHeader className="sr-only"><DialogTitle>{t('cards.cardTitle')}</DialogTitle></DialogHeader>
          {openCard && <CardView card={openCard} big />}
        </DialogContent>
      </Dialog>
    </div>
  );
}