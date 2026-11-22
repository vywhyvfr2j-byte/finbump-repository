import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import FbIcon from '@/components/icons/FbIcon';
import { actStatus, formatDate } from '@/lib/keepsakeUtils';
import { TAG_BY_KEY, CATEGORY_BY_KEY } from '@/lib/actTags';
import { useI18n } from '@/lib/i18n/I18nContext';
import { pulseCheck } from '@/lib/reward';

const STATUS_STYLES = {
  overdue: { dot: 'bg-red-500', ring: 'ring-red-100', labelKey: 'act.statusOverdue', text: 'text-red-600' },
  soon: { dot: 'bg-amber-500', ring: 'ring-amber-100', labelKey: 'act.statusSoon', text: 'text-amber-600' },
  fresh: { dot: 'bg-emerald-500', ring: 'ring-emerald-100', labelKey: 'act.statusFresh', text: 'text-emerald-600' },
  idle: { dot: 'bg-red-500', ring: 'ring-red-100', labelKey: 'act.statusIdle', text: 'text-red-600' },
};

function ActRow({ act, onToggle, showCheck = true, onClick, onEdit, onDelete, selectable, selected, onSelect, personName, stacked, onSchedule }) {
  const { t } = useI18n();
  const status = actStatus(act);
  const s = STATUS_STYLES[status];
  const done = status === 'fresh';
  const statusLabel = t(s.labelKey);

  // Check-off reward: the tick pops once and a light haptic fires, so the act
  // feels finished rather than merely stored.
  const [popped, setPopped] = useState(false);
  const celebrate = () => {
    pulseCheck();
    setPopped(true);
    setTimeout(() => setPopped(false), 600);
  };

  const handleRowClick = selectable ? () => onSelect?.(act) : onClick;

  const cadenceLabel = (() => {
    const d = act.intervalDays;
    if (!d) return '';
    if (d % 7 === 0) return t(d / 7 === 1 ? 'act.everyWeek' : 'act.everyWeeks', { n: d / 7 });
    if (d % 30 === 0) return t(d / 30 === 1 ? 'act.everyMonth' : 'act.everyMonths', { n: d / 30 });
    return t(d === 1 ? 'act.everyDay' : 'act.everyDays', { n: d });
  })();
  const detailsTitle = [
    act.name,
    TAG_BY_KEY[act.tag]?.label,
    cadenceLabel,
    act.lastCompleted ? t('act.lastDone', { date: formatDate(act.lastCompleted) }) : t('act.notDoneYet'),
    statusLabel,
  ].filter(Boolean).join('\n');

  // Stacked layout (Acts of support page): the act text takes the full width so
  // it always stays readable, and its four actions — schedule, edit, delete and
  // acknowledgement — sit together in one row underneath it.
  if (stacked) {
    const scheduleHandler = onSchedule || onClick;
    const btn = 'flex-1 h-11 rounded-lg flex items-center justify-center transition-colors';
    return (
      <div
        className={`px-3.5 py-3 bg-card rounded-xl ring-1 ${s.ring} shadow-card ${handleRowClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
        onClick={handleRowClick}
        title={detailsTitle}
      >
        <div className="flex items-start gap-2">
          {selectable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(act);
              }}
              className="shrink-0 -mt-1.5 w-11 h-11 flex items-center justify-center"
              aria-label={selected ? t('act.selected') : t('act.selectAct')}
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected ? 'bg-primary border-primary' : 'border-primary bg-secondary/60'
                }`}
              >
                {selected && <Check size={12} strokeWidth={3} className="text-primary-foreground" />}
              </motion.div>
            </button>
          )}
          <p className="flex-1 min-w-0 font-medium text-sm leading-snug break-words">{act.name}</p>
        </div>

        {((act.tag && TAG_BY_KEY[act.tag]) || (act.category && act.category !== 'act' && CATEGORY_BY_KEY[act.category])) && (
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {act.tag && TAG_BY_KEY[act.tag] && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                <span className={`w-1.5 h-1.5 rounded-full ${TAG_BY_KEY[act.tag].dot}`} />
                {TAG_BY_KEY[act.tag].label}
              </span>
            )}
            {act.category && act.category !== 'act' && CATEGORY_BY_KEY[act.category] && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                <span>{CATEGORY_BY_KEY[act.category].emoji}</span>
                {CATEGORY_BY_KEY[act.category].label}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
          <span className="text-xs text-muted-foreground">
            {act.lastCompleted ? t('act.doneStatus', { date: formatDate(act.lastCompleted), status: statusLabel }) : t('act.notYetStatus', { status: statusLabel })}
          </span>
          <span className="text-xs text-muted-foreground/70">· {personName || act.person || t('act.general')}</span>
        </div>

        {!selectable && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
            {scheduleHandler && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  scheduleHandler(act);
                }}
                className={`${btn} bg-secondary text-secondary-foreground hover:bg-secondary/70`}
                aria-label={t('act.reschedule')}
                title={t('act.reschedule')}
              >
                <FbIcon name="reschedule" style="color" size={20} />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(act);
                }}
                className={`${btn} bg-primary/10 text-primary hover:bg-primary/20`}
                aria-label={t('act.editAct')}
                title={t('act.editAct')}
              >
                <FbIcon name="edit" style="color" size={20} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(act);
                }}
                className={`${btn} bg-destructive/10 text-destructive hover:bg-destructive/20`}
                aria-label={t('act.deleteAct')}
                title={t('act.deleteAct')}
              >
                <FbIcon name="delete" style="color" size={20} />
              </button>
            )}
            {showCheck && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  celebrate();
                  onToggle?.(act);
                }}
                className={`${btn} ${popped ? 'ks-check-pop' : ''} ${
                  done
                    ? 'bg-emerald-500 text-primary-foreground hover:bg-emerald-600'
                    : 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25'
                }`}
                aria-label={done ? t('act.completed') : t('act.markComplete')}
                title={done ? t('act.completed') : t('act.markComplete')}
              >
                <FbIcon name="mark-complete" style="color" size={20} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 bg-card rounded-xl ring-1 ${s.ring} shadow-card ${handleRowClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
      onClick={handleRowClick}
      title={detailsTitle}
    >
      {selectable ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(act);
          }}
          className="shrink-0 w-11 h-11 -my-2 flex items-center justify-center"
          aria-label={selected ? t('act.selected') : t('act.selectAct')}
        >
          <motion.div
            whileTap={{ scale: 0.8 }}
            className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-colors ${
              selected ? 'bg-primary border-primary' : 'border-primary bg-secondary/60'
            }`}
          >
            {selected && <Check size={12} strokeWidth={3} className="text-primary-foreground" />}
          </motion.div>
        </button>
      ) : showCheck ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.(act);
          }}
          className="shrink-0 w-11 h-11 -my-2 flex items-center justify-center"
          aria-label={done ? t('act.completed') : t('act.markComplete')}
        >
          <motion.div
            whileTap={{ scale: 0.8 }}
            className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-colors ${
              done ? 'bg-emerald-500 border-emerald-500' : 'border-primary bg-secondary/60'
            }`}
          >
            {done && <Check size={12} strokeWidth={3} className="text-primary-foreground" />}
          </motion.div>
        </button>
      ) : (
        <span className="text-lg shrink-0">{act.emoji}</span>
      )}

      <div className="flex-1 min-w-0">
        {/* The description takes the full column and is never clipped: at the
            larger accessibility text sizes a clamp leaves the sentence
            unreadable, and squeezing the chips in beside it steals the width
            the text needs. */}
        <p className="font-medium text-sm leading-snug break-words">{act.name}</p>
        {(act.tag && TAG_BY_KEY[act.tag]) || (act.category && act.category !== 'act' && CATEGORY_BY_KEY[act.category]) ? (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {act.tag && TAG_BY_KEY[act.tag] && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                <span className={`w-1.5 h-1.5 rounded-full ${TAG_BY_KEY[act.tag].dot}`} />
                {TAG_BY_KEY[act.tag].label}
              </span>
            )}
            {act.category && act.category !== 'act' && CATEGORY_BY_KEY[act.category] && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                <span>{CATEGORY_BY_KEY[act.category].emoji}</span>
                {CATEGORY_BY_KEY[act.category].label}
              </span>
            )}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
          <span className="text-xs text-muted-foreground">
            {act.lastCompleted ? t('act.doneStatus', { date: formatDate(act.lastCompleted), status: statusLabel }) : t('act.notYetStatus', { status: statusLabel })}
          </span>
          <span className="text-xs text-muted-foreground/70">· {personName || act.person || t('act.general')}</span>
        </div>
      </div>

      {!selectable && (((status === 'overdue' || status === 'idle') && onClick) || onEdit || onDelete) && (
        <div className="flex items-center gap-1 shrink-0">
          {(status === 'overdue' || status === 'idle') && onClick && (
            <button
              onClick={(e) => { e.stopPropagation(); onClick(act); }}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              aria-label={t('act.reschedule')}
              title={t('act.reschedule')}
            >
              <FbIcon name="reschedule" style="color" size={18} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(act);
              }}
              className="w-11 h-11 -m-1 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label={t('act.editAct')}
            >
              <FbIcon name="edit" style="color" size={18} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(act);
              }}
              className="w-11 h-11 -m-1 flex items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
              aria-label={t('act.deleteAct')}
            >
              <FbIcon name="delete" style="color" size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(ActRow);