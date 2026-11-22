import React from 'react';
import { Link } from 'react-router-dom';
import { Flag, Moon, PenLine } from 'lucide-react';
import { formatDate, relativeLast } from '@/lib/keepsakeUtils';
import { useI18n } from '@/lib/i18n/I18nContext';

// One row on the merged milestones + notes timeline.
export default function TimelineEntry({ entry }) {
  const { t } = useI18n();
  const isMilestone = entry.kind === 'milestone';
  const isMemory = !isMilestone && !!entry.memory;
  const Icon = isMilestone ? Flag : isMemory ? Moon : PenLine;
  const tag = isMilestone
    ? t('timeline.milestoneTag')
    : isMemory
      ? t('timeline.memoryTag')
      : entry.appreciation
        ? t('timeline.appreciationTag')
        : t('timeline.noteTag');

  return (
    <li className="relative pl-8">
      <span
        className={`absolute left-0 top-0.5 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-background ${
          isMilestone ? 'bg-primary/15 text-primary' : isMemory ? 'bg-accent/40 text-accent-foreground' : 'bg-secondary text-foreground'
        }`}
      >
        <Icon size={13} />
      </span>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium text-muted-foreground">{formatDate(entry.at)}</span>
        <span className="text-[11px] text-muted-foreground">· {relativeLast(entry.at)}</span>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            isMilestone ? 'bg-primary/15 text-primary' : isMemory ? 'bg-accent/40 text-accent-foreground' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {tag}
        </span>
      </div>

      <p
        className={
          isMilestone
            ? 'font-display font-semibold text-[15px] leading-snug mt-1'
            : 'text-sm leading-relaxed whitespace-pre-wrap mt-1'
        }
      >
        {entry.title}
      </p>

      {entry.detail && (
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap">{entry.detail}</p>
      )}

      {entry.personName &&
        (entry.personId ? (
          <Link
            to={`/people?person=${encodeURIComponent(entry.personId)}`}
            className="inline-flex text-[11px] text-primary font-medium mt-1 hover:underline"
          >
            {t('timeline.aboutPerson', { name: entry.personName })}
          </Link>
        ) : (
          <p className="text-[11px] text-muted-foreground mt-1">{t('timeline.aboutPerson', { name: entry.personName })}</p>
        ))}

      {entry.completedAt && (
        <p className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 mt-1.5">
          <Flag size={10} /> {t('timeline.markedComplete', { date: formatDate(entry.completedAt) })}
        </p>
      )}
    </li>
  );
}