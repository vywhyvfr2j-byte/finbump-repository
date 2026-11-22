import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Phone, Search, X, Plus, Check, Users } from 'lucide-react';
import { colorFor } from '@/lib/groupConstants';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import BulkMessageSheet from '@/components/groups/BulkMessageSheet';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function GroupDetail() {
  useFeatureTracking('group_detail');
  const { t } = useI18n();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { groups, people, toggleGroupMember } = useKeepsake();
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const group = (groups || []).find((g) => g.id === groupId);

  if (!group) {
    return (
      <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
        <TopNav title={t('groupDetail.title')} back backTo="/groups" />
        <div className="px-5 mt-10 text-center text-muted-foreground">
          <p>{t('groupDetail.notFound')}</p>
          <Link to="/groups" className="text-primary text-sm font-medium mt-2 inline-block">{t('groupDetail.backToGroups')}</Link>
        </div>
      </div>
    );
  }

  const c = colorFor(group.color);
  const memberIds = group.memberIds || [];
  const members = memberIds.map((id) => people.find((p) => p.id === id)).filter(Boolean);

  // Non-partner people available to add.
  const candidates = people.filter((p) => p.relation !== 'partner');
  const searchList = query.trim()
    ? candidates.filter((p) => (p.name + ' ' + (p.preferredName || '')).toLowerCase().includes(query.trim().toLowerCase()))
    : candidates;

  // Single-member text fallback (some Android clients prefer sms: over sms:/open).
  const textOne = (phone) => {
    window.location.href = `sms:${phone}`;
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={group.name} subtitle={t('groupDetail.title')} back backTo="/groups" />

      <div className="px-5 mt-2 space-y-4">
        {/* Header */}
        <div className={`rounded-2xl border ${c.tile} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-background/70 flex items-center justify-center text-2xl">
              {group.emoji || '👥'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-lg font-semibold truncate">{group.name}</h2>
              <p className="text-xs text-muted-foreground">{members.length} {members.length === 1 ? t('groupDetail.person') : t('groupDetail.people')}</p>
            </div>
          </div>
          {group.notes && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{group.notes}</p>}
        </div>

        {/* Bulk messaging — only available once the group has members */}
        {members.length > 0 && (
          <div className="grid grid-cols-1 gap-2.5">
            <Button onClick={() => setBulkOpen(true)} className="h-12 rounded-2xl">
              <Users size={18} className="mr-1.5" /> {t('groupDetail.bulkMessage', { count: members.length })}
            </Button>
            <p className="text-xs text-muted-foreground text-center -mt-1">
              {t('groupDetail.bulkDesc')}
            </p>
          </div>
        )}

        {/* Members */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t('groupDetail.members')}</h3>
            <button
              onClick={() => setPicking((v) => !v)}
              className="text-primary text-sm font-medium flex items-center gap-1"
            >
              {picking ? <><X size={15} /> {t('groupDetail.done')}</> : <><Plus size={15} /> {t('groupDetail.add')}</>}
            </button>
          </div>

          {picking && (
            <div className="rounded-2xl border p-3 space-y-3 shadow-card ks-card-tint">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('groupDetail.searchPeople')} className="h-10 pl-9" />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
                {searchList.map((p) => {
                  const inGroup = memberIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleGroupMember(group.id, p.id)}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 border transition-colors ${inGroup ? 'bg-primary/10 border-primary/30' : 'bg-background border-border'}`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt="" loading="lazy" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                            {(p.name || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="text-sm font-medium truncate">{p.preferredName || p.name}</span>
                      </span>
                      {inGroup && <Check size={16} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
                {searchList.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">{t('groupDetail.noMatch', { query: query.trim() })}</p>
                )}
              </div>
            </div>
          )}

          {members.length === 0 && !picking && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">{t('groupDetail.noMembers')}</p>
            </div>
          )}

          <div className="space-y-2">
            {members.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3">
                <Link to={`/people?q=${encodeURIComponent(p.name)}`} className="flex items-center gap-3 flex-1 min-w-0">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="" loading="lazy" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                      {(p.name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.preferredName || p.name}</p>
                    {p.phone && <p className="text-xs text-muted-foreground truncate">{p.phone}</p>}
                  </div>
                </Link>
                {p.phone ? (
                  <button onClick={() => textOne(p.phone)} className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center" aria-label={t('groupDetail.textName', { name: p.name })}>
                    <Phone size={15} />
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">{t('groupDetail.noPhone')}</span>
                )}
                {picking && (
                  <button onClick={() => toggleGroupMember(group.id, p.id)} className="text-muted-foreground hover:text-destructive p-1" aria-label={t('groupDetail.removeName', { name: p.name })}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BulkMessageSheet
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        groupName={group.name}
        members={members}
      />
    </div>
  );
}