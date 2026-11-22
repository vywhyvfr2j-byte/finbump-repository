import React, { useState, useMemo, useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { formatDate } from '@/lib/keepsakeUtils';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Bell, BellOff, Flag, Pencil, Trash2, Check, Share2, Target } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import GoalsBarChart from '@/components/goals/GoalsBarChart';
import ConnectionPicker from '@/components/people/ConnectionPicker';
import { useI18n } from '@/lib/i18n/I18nContext';
import PrivacyHint from '@/components/PrivacyHint';
import { useConfirm } from '@/components/ui/confirm-dialog';

const emptyMilestoneForm = { title: '', date: '', description: '', reminderOn: false, reminderDaysStr: '30,7,3', personId: '' };

export default function RelationshipNotes() {
  useFeatureTracking('relationship_notes');
  useEnsureEntities(['goals']);
  const { t } = useI18n();
  const { milestones, addMilestone, updateMilestone, deleteMilestone, completeMilestone, goals, addGoal, toggleGoal, updateGoal, deleteGoal, people } = useKeepsake();
  const { confirm, confirmDialog } = useConfirm();
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState(emptyMilestoneForm);
  const [addingGoal, setAddingGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [highlightId, setHighlightId] = useState(null);

  const sortedMilestones = useMemo(
    () => [...milestones].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [milestones]
  );

  const nameById = useMemo(
    () => new Map((people || []).map((p) => [String(p.id), p.preferredName || p.name])),
    [people]
  );

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (!q) return;
    const match = milestones.find((m) => m.title.toLowerCase().includes(q.toLowerCase()));
    if (match) {
      setHighlightId(match.id);
      setTimeout(() => {
        document.getElementById(`milestone-${match.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [milestones]);

  const resetMilestoneForm = () => {
    setMilestoneForm(emptyMilestoneForm);
    setEditingMilestoneId(null);
    setAddingMilestone(false);
  };

  const startEditMilestone = (m) => {
    const reminderOn = Array.isArray(m.reminderDays) && m.reminderDays.length > 0;
    setEditingMilestoneId(m.id);
    setAddingMilestone(false);
    setMilestoneForm({
      title: m.title || '',
      date: m.date ? m.date.slice(0, 10) : '',
      description: m.description || '',
      reminderOn,
      reminderDaysStr: reminderOn ? m.reminderDays.join(',') : '30,7,3',
      personId: m.personId || '',
    });
  };

  const handleSaveMilestone = () => {
    if (!milestoneForm.title.trim() || !milestoneForm.date) return;
    const reminderDays = milestoneForm.reminderOn
      ? milestoneForm.reminderDaysStr.split(',').map((d) => Number(d.trim())).filter((d) => !Number.isNaN(d))
      : [];
    const payload = {
      title: milestoneForm.title.trim(),
      date: new Date(milestoneForm.date).toISOString(),
      description: milestoneForm.description.trim(),
      reminderDays,
      personId: milestoneForm.personId || null,
    };
    if (editingMilestoneId) {
      updateMilestone(editingMilestoneId, payload);
    } else {
      addMilestone(payload);
    }
    resetMilestoneForm();
  };

  const handleDeleteMilestone = async (m) => {
    const answer = await confirm({
      title: t('relNotes.confirmRemove', { title: m.title }),
      confirmLabel: t('common.remove'),
    });
    if (!answer) return;
    deleteMilestone(m.id);
    if (editingMilestoneId === m.id) resetMilestoneForm();
  };

  const handleAddGoal = () => {
    if (!goalTitle.trim()) return;
    addGoal({ title: goalTitle.trim() });
    setGoalTitle('');
    setAddingGoal(false);
  };

  const startEditGoal = (g) => {
    setEditingGoalId(g.id);
    setEditGoalTitle(g.title);
  };

  const saveEditGoal = () => {
    if (!editGoalTitle.trim() || !editingGoalId) return;
    updateGoal(editingGoalId, { title: editGoalTitle.trim() });
    setEditingGoalId(null);
    setEditGoalTitle('');
  };

  const handleShareGoals = async () => {
    if (goals.length === 0) return;
    const lines = goals.map((g) => `${g.done ? '✓' : '○'} ${g.title}`);
    const text = `${t('relNotes.shareTitle')}\n\n${lines.join('\n')}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: t('relNotes.shareTitle'), text });
      } else {
        await navigator.clipboard.writeText(text);
        alert(t('relNotes.goalsCopied'));
      }
    } catch (e) {
      // user cancelled or share failed — silently ignore
    }
  };

  const milestoneFormOpen = addingMilestone || editingMilestoneId;

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('relNotes.title')} subtitle={t('relNotes.subtitle')} back />

      <div className="px-5 mt-2">
        <GoalsBarChart />

        {/* Milestones section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold flex items-center gap-1.5">
            <Flag size={18} /> {t('relNotes.milestones')}
          </h2>
          <button
            onClick={() => { if (editingMilestoneId) resetMilestoneForm(); setAddingMilestone((v) => !v); }}
            className="flex items-center justify-center w-11 h-11 rounded-full text-primary hover:bg-secondary/60 transition-colors"
            aria-label={t('relNotes.addMilestoneAria')}
          >
            {milestoneFormOpen ? <X size={18} /> : <Plus size={18} />}
          </button>
        </div>

        {milestoneFormOpen && (
          <div className="rounded-2xl border p-4 space-y-2.5 mb-5 shadow-card ks-card-tint">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">{editingMilestoneId ? t('relNotes.editMilestone') : t('relNotes.newMilestone')}</h3>
            </div>
            <Input
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t('relNotes.milestoneTitle')}
              aria-label={t('relNotes.milestoneTitle')}
              className="h-11"
            />
            <Input
              type="date"
              value={milestoneForm.date}
              onChange={(e) => setMilestoneForm((f) => ({ ...f, date: e.target.value }))}
              aria-label={t('relNotes.milestoneDate')}
              className="h-11"
            />
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5" htmlFor="milestone-connection">
                {t('timeline.linkPerson')}
              </label>
              <ConnectionPicker
                id="milestone-connection"
                people={people}
                value={milestoneForm.personId}
                onChange={(v) => setMilestoneForm((f) => ({ ...f, personId: v }))}
              />
            </div>
            <PrivacyHint className="mb-1" />
            <Textarea
              value={milestoneForm.description}
              onChange={(e) => setMilestoneForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={t('relNotes.milestoneDescPlaceholder')}
              aria-label={t('relNotes.milestoneDescAria')}
              rows={2}
            />
            <div className="flex items-center justify-between bg-secondary/60 rounded-xl px-3.5 py-2.5">
              <span className="text-sm font-medium flex items-center gap-1.5">
                {milestoneForm.reminderOn ? <Bell size={15} /> : <BellOff size={15} />} {t('relNotes.remindMe')}
              </span>
              <Switch checked={milestoneForm.reminderOn} onCheckedChange={(v) => setMilestoneForm((f) => ({ ...f, reminderOn: v }))} />
            </div>
            {milestoneForm.reminderOn && (
              <Input
                value={milestoneForm.reminderDaysStr}
                onChange={(e) => setMilestoneForm((f) => ({ ...f, reminderDaysStr: e.target.value }))}
                placeholder={t('relNotes.daysBeforePlaceholder')}
                aria-label={t('relNotes.daysBeforeAria')}
                className="h-11"
              />
            )}
            <div className="flex gap-2">
              <Button onClick={handleSaveMilestone} disabled={!milestoneForm.title.trim() || !milestoneForm.date} className="flex-1 h-11 rounded-xl">
                {editingMilestoneId ? t('relNotes.saveChanges') : t('relNotes.addMilestone')}
              </Button>
              <Button onClick={resetMilestoneForm} variant="outline" className="h-11 rounded-xl px-4">
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        <div className="relative pl-6 mb-8">
          {sortedMilestones.length > 0 && <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />}
          <div className="space-y-6">
            {sortedMilestones.map((m) => (
              <div
                key={m.id}
                id={`milestone-${m.id}`}
                className={`relative rounded-xl transition-colors ${highlightId === m.id ? 'ring-2 ring-accent bg-accent/10 -mx-2 px-2 py-1' : ''}`}
              >
                <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/15" />
                <p className="text-xs text-muted-foreground">{formatDate(m.date)}</p>
                <p className="font-display font-semibold text-[15px] mt-0.5">{m.title}</p>
                {m.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{m.description}</p>}
                {m.personId && nameById.get(String(m.personId)) && (
                  <p className="text-[11px] text-muted-foreground mt-1">{t('timeline.aboutPerson', { name: nameById.get(String(m.personId)) })}</p>
                )}
                {m.lastCompletedAt && (
                  <p className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 mt-1.5">
                    <Flag size={10} /> {t('relNotes.lastComplete', { date: formatDate(m.lastCompletedAt) })}
                  </p>
                )}
                {Array.isArray(m.reminderDays) && m.reminderDays.length === 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive mt-1.5">
                    <BellOff size={10} /> {t('relNotes.noReminder')}
                  </span>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => completeMilestone(m.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
                  >
                    <Flag size={12} /> {m.lastCompletedAt ? t('relNotes.completeAgain') : t('relNotes.markComplete')}
                  </button>
                  <button
                    onClick={() => startEditMilestone(m)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
                  >
                    <Pencil size={12} /> {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteMilestone(m)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive"
                  >
                    <Trash2 size={12} /> {t('common.remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {sortedMilestones.length === 0 && !milestoneFormOpen && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium">{t('relNotes.noMilestones')}</p>
              <p className="text-sm mt-1">{t('relNotes.noMilestonesDesc')}</p>
            </div>
          )}
        </div>

        {/* Goals section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold flex items-center gap-1.5">
            <Target size={18} /> {t('relNotes.goals')}
          </h2>
          <div className="flex items-center gap-0.5">
            {goals.length > 0 && (
              <button onClick={handleShareGoals} className="text-primary flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary/60 transition-colors" aria-label={t('relNotes.shareGoalsAria')}>
                <Share2 size={16} />
              </button>
            )}
            <button onClick={() => setAddingGoal((v) => !v)} className="text-primary flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary/60 transition-colors" aria-label={t('relNotes.addGoalAria')}>
              {addingGoal ? <X size={18} /> : <Plus size={18} />}
            </button>
          </div>
        </div>

        {addingGoal && (
          <div className="flex gap-2 mb-4">
            <Input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder={t('relNotes.goalPlaceholder')} aria-label={t('relNotes.goalTitleAria')} className="h-11" autoFocus />
            <Button onClick={handleAddGoal} className="h-11 px-4">
              {t('relNotes.add')}
            </Button>
          </div>
        )}

        <div className="space-y-2.5">
          {goals.map((g) => (
            editingGoalId === g.id ? (
              <div key={g.id} className="flex gap-2 bg-card rounded-2xl border border-primary/40 p-3">
                <Input
                  value={editGoalTitle}
                  onChange={(e) => setEditGoalTitle(e.target.value)}
                  aria-label={t('relNotes.goalTitleAria')}
                  className="h-10"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveEditGoal()}
                />
                <Button onClick={saveEditGoal} size="icon" className="h-11 w-11 shrink-0">
                  <Check size={16} />
                </Button>
                <Button onClick={() => { setEditingGoalId(null); setEditGoalTitle(''); }} variant="outline" size="icon" className="h-11 w-11 shrink-0">
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div
                key={g.id}
                className="w-full flex items-center gap-3 bg-card rounded-2xl border border-border p-3.5"
              >
                <button
                  onClick={() => toggleGoal(g.id)}
                  aria-label={g.done ? t('relNotes.markIncomplete') : t('relNotes.markComplete')}
                  className={`relative ks-hit w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    g.done ? 'bg-primary border-primary' : 'border-border'
                  }`}
                >
                  {g.done && <Check size={15} strokeWidth={3} className="text-primary-foreground" />}
                </button>
                <button
                  onClick={() => toggleGoal(g.id)}
                  className={`flex-1 text-sm font-medium text-left ${g.done ? 'line-through text-muted-foreground' : ''}`}
                >
                  {g.title}
                </button>
                <button
                  onClick={() => startEditGoal(g)}
                  className="text-muted-foreground hover:text-primary shrink-0 p-1"
                  aria-label={t('relNotes.editGoalAria')}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                  aria-label={t('relNotes.deleteGoalAria')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          ))}
          {goals.length === 0 && !addingGoal && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium">{t('relNotes.noGoals')}</p>
              <p className="text-sm mt-1">{t('relNotes.noGoalsDesc')}</p>
            </div>
          )}
        </div>
      </div>
      {confirmDialog}
    </div>
  );
}