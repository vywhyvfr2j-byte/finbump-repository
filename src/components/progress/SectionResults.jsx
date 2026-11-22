import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { formatDate } from '@/lib/keepsakeUtils';
import { useI18n } from '@/lib/i18n/I18nContext';
import { ChevronDown, Check, Flag, Gift, Moon, PenLine } from 'lucide-react';

const MAX_RESULTS = 100;

// Results for one query inside the Progress & History section. It searches
// across everything the section holds — acts you've checked off, gifts you've
// given, milestones and notes — and each match opens up to show the full
// detail behind it, plus a link to the connection it belongs to.
export default function SectionResults({ query }) {
  const { t } = useI18n();
  const { history, acts, giftIdeas, milestones, personalNotes, people } = useKeepsake();
  useEnsureEntities(['history']);
  const [openKey, setOpenKey] = useState(null);

  const items = useMemo(() => {
    const personList = people || [];
    const nameById = new Map(personList.map((p) => [String(p.id), p.preferredName || p.name]));
    const idByName = new Map(personList.map((p) => [p.name, p.id]));
    const actById = new Map((acts || []).map((a) => [a.id, a]));
    const nameOf = (personId) => nameById.get(String(personId)) || '';
    const out = [];

    (history || []).forEach((h) => {
      if (!h.completedAt) return;
      const act = actById.get(h.actId);
      const personId = act ? act.personId || (act.person ? idByName.get(act.person) || '' : '') : '';
      out.push({
        key: `comp-${h.id || `${h.actId}${h.completedAt}`}`,
        date: h.completedAt,
        tag: t('section.act'),
        glyph: h.emoji || <Check size={15} className="text-emerald-500" />,
        title: h.actName || act?.name || t('section.act'),
        lines: [t('section.completed', { date: formatDate(h.completedAt) })],
        personId,
        personName: nameOf(personId),
      });
    });

    (giftIdeas || []).forEach((g) => {
      if (!g.purchased || !g.purchasedAt) return;
      out.push({
        key: `gift-${g.id}`,
        date: g.purchasedAt,
        tag: t('section.gift'),
        glyph: <Gift size={15} />,
        title: g.title,
        lines: [t('section.given', { date: formatDate(g.purchasedAt) })],
        personId: g.personId || '',
        personName: nameOf(g.personId),
      });
    });

    (milestones || []).forEach((m) => {
      if (!m.date) return;
      const lines = [];
      if (m.description) lines.push(m.description);
      lines.push(t('section.milestoneDate', { date: formatDate(m.date) }));
      if (m.lastCompletedAt) lines.push(t('section.lastMarked', { date: formatDate(m.lastCompletedAt) }));
      out.push({
        key: `ms-${m.id}`,
        date: m.date,
        tag: t('timeline.milestoneTag'),
        glyph: <Flag size={15} />,
        title: m.title,
        lines,
        personId: m.personId || '',
        personName: nameOf(m.personId),
      });
    });

    (personalNotes || []).forEach((n) => {
      if (!n.created_date) return;
      const lines = [n.text || ''];
      lines.push(t('section.saved', { date: formatDate(n.created_date) }));
      if (n.photos?.length) lines.push(t('section.photos', { count: n.photos.length }));
      out.push({
        key: `note-${n.id}`,
        date: n.created_date,
        tag: n.type === 'memory'
          ? t('timeline.memoryTag')
          : n.type === 'appreciation'
            ? t('timeline.appreciationTag')
            : t('timeline.noteTag'),
        glyph: n.type === 'memory' ? <Moon size={15} /> : <PenLine size={15} />,
        title: n.text || '',
        lines,
        personId: n.personId || '',
        personName: nameOf(n.personId),
      });
    });

    return out.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [history, acts, giftIdeas, milestones, personalNotes, people, t]);

  const needle = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!needle) return [];
    return items.filter((i) =>
      `${i.title} ${i.tag} ${i.personName} ${i.lines.join(' ')}`.toLowerCase().includes(needle)
    );
  }, [items, needle]);

  if (!needle) return null;
  const shown = matches.slice(0, MAX_RESULTS);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t('section.results', { count: matches.length })}
        </p>
        {matches.length > MAX_RESULTS && (
          <p className="text-[11px] text-muted-foreground shrink-0">
            {t('section.showingFirst', { count: MAX_RESULTS, total: matches.length })}
          </p>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">{t('section.noResults')}</p>
      ) : (
        <ul className="bg-card rounded-xl border border-border overflow-hidden">
          {shown.map((item, i) => {
            const open = openKey === item.key;
            return (
              <li key={item.key} className={i > 0 ? 'border-t border-border/60' : ''}>
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : item.key)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                >
                  <span className="text-base shrink-0 w-6 text-center">{item.glyph}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-sm leading-tight truncate">{item.title}</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">{item.tag}</span>
                  </span>
                  <ChevronDown
                    size={15}
                    className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>

                {open && (
                  <div className="px-3 pb-3 pl-11 space-y-1.5">
                    {item.lines.map((line, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {line}
                      </p>
                    ))}
                    {item.personId ? (
                      <Link
                        to={`/people?person=${encodeURIComponent(item.personId)}`}
                        className="inline-flex text-[12px] font-medium text-primary hover:underline"
                      >
                        {t('section.openPerson', { name: item.personName })}
                      </Link>
                    ) : item.personName ? (
                      <p className="text-[12px] text-muted-foreground">{item.personName}</p>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}