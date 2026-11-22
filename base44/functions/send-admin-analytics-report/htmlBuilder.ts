// Builds the HTML email body for the daily admin analytics report.
// All styles are inline (email clients strip <style> tags). Charts are
// pure HTML/CSS — div-based bar charts with percentage heights/widths.

const COLORS = {
  bg: '#FCF6F1',
  card: '#FFFFFF',
  panel: 'rgba(122,156,144,0.18)',
  panelBorder: 'rgba(122,156,144,0.35)',
  primary: '#D07A6A',
  secondary: '#7A9C90',
  accent: '#EFB47A',
  text: '#3E2A32',
  muted: '#8A7A82',
  light: '#F5EFE9',
  bar: '#D07A6A',
  barLight: '#E8B5A8',
  green: '#7A9C90',
  greenLight: '#B5CDC4',
  gold: '#EFB47A',
  red: '#C85A4F',
};

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pct(n, max) {
  return Math.max(2, Math.round((n / Math.max(max, 1)) * 100));
}

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function delta(current, previous) {
  if (!previous) return current > 0 ? '+∞%' : '—';
  const d = Math.round(((current - previous) / previous) * 100);
  return `${d >= 0 ? '+' : ''}${d}%`;
}

function deltaColor(current, previous) {
  if (!previous) return COLORS.muted;
  return current >= previous ? COLORS.green : COLORS.red;
}

function statCard(label, value, sub, subColor) {
  return `
    <td style="padding:4px;width:50%;vertical-align:top;">
      <div style="background:${COLORS.panel};border:1px solid ${COLORS.panelBorder};border-radius:10px;padding:14px;">
        <p style="margin:0 0 6px;font-size:11px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
        <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:${COLORS.text};">${fmt(value)}</p>
        ${sub ? `<p style="margin:0;font-size:11px;color:${subColor || COLORS.muted};">${sub}</p>` : ''}
      </div>
    </td>`;
}

function barChartRow(label, value, max, color) {
  const w = pct(value, max);
  return `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:12px;color:${COLORS.text};font-weight:500;">${label}</span>
        <span style="font-size:12px;color:${COLORS.muted};">${fmt(value)}</span>
      </div>
      <div style="background:${COLORS.light};border-radius:6px;overflow:hidden;height:10px;">
        <div style="background:${color || COLORS.bar};height:100%;width:${w}%;border-radius:6px;"></div>
      </div>
    </div>`;
}

function verticalBars(data, max) {
  const bars = data.map((d) => {
    const h = Math.max(3, Math.round((d.count / Math.max(max, 1)) * 80));
    const label = d.date ? d.date.slice(5) : '';
    return `
      <td style="padding:0 2px;text-align:center;vertical-align:bottom;width:${Math.floor(100 / data.length)}%">
        <div style="font-size:9px;color:${COLORS.muted};margin-bottom:2px;">${d.count || ''}</div>
        <div style="background:${COLORS.bar};width:100%;height:${h}px;border-radius:3px 3px 0 0;min-height:3px;"></div>
        <div style="font-size:8px;color:${COLORS.muted};margin-top:3px;">${label}</div>
      </td>`;
  }).join('');
  return `<table style="width:100%;border-collapse:collapse;"><tr>${bars}</tr></table>`;
}

// SVG line chart for 7-day trends. Renders an actual line with dots, value
// labels, and date labels. Gmail and Apple Mail render inline SVG; Outlook
// desktop falls back to blank but the surrounding text report has the data.
function lineChart(data, max, color, fillRgba) {
  if (!data || !data.length) {
    return `<p style="margin:0;font-size:12px;color:${COLORS.muted};">No data yet.</p>`;
  }
  const W = 300, H = 90, padX = 16, padTop = 10, padBottom = 20;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const safeMax = Math.max(max, 1);
  const pts = data.map((d, i) => {
    const x = padX + (data.length > 1 ? i * step : innerW / 2);
    const y = padTop + innerH - (d.count / safeMax) * innerH;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, count: d.count, date: d.date };
  });
  const linePath = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaPath = `M${pts[0].x},${padTop + innerH} L${pts.map((p) => `${p.x},${p.y}`).join(' L')} L${pts[pts.length - 1].x},${padTop + innerH} Z`;
  const dots = pts.map((p) =>
    `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}" stroke="#fff" stroke-width="1.5"/>`
  ).join('');
  const labels = pts.map((p) =>
    `<text x="${p.x}" y="${H - 5}" font-size="8" fill="${COLORS.muted}" text-anchor="middle">${p.date.slice(5)}</text>`
  ).join('');
  const values = pts.map((p) =>
    p.count > 0 ? `<text x="${p.x}" y="${p.y - 7}" font-size="8" fill="${color}" text-anchor="middle" font-weight="bold">${p.count}</text>` : ''
  ).join('');
  return `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;max-width:100%;">
    <path d="${areaPath}" fill="${fillRgba}" stroke="none"/>
    <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}${values}${labels}
  </svg>`;
}

function section(title, content) {
  return `
    <div style="background:${COLORS.card};border:1px solid ${COLORS.panelBorder};border-radius:12px;padding:16px;margin-bottom:14px;">
      <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:${COLORS.text};">${title}</h2>
      ${content}
    </div>`;
}

function comparisonTable(rows) {
  const header = `
    <tr style="background:${COLORS.panel};">
      <th style="padding:8px 10px;text-align:left;font-size:11px;color:${COLORS.muted};border-radius:6px 0 0 6px;">Metric</th>
      <th style="padding:8px 10px;text-align:center;font-size:11px;color:${COLORS.muted};">Yesterday</th>
      <th style="padding:8px 10px;text-align:center;font-size:11px;color:${COLORS.muted};">Prev Day</th>
      <th style="padding:8px 10px;text-align:center;font-size:11px;color:${COLORS.muted};border-radius:0 6px 6px 0;">Change</th>
    </tr>`;
  const body = rows.map((r) => `
    <tr style="border-bottom:1px solid ${COLORS.light};">
      <td style="padding:8px 10px;font-size:12px;color:${COLORS.text};font-weight:500;">${r.label}</td>
      <td style="padding:8px 10px;text-align:center;font-size:13px;color:${COLORS.text};font-weight:600;">${fmt(r.current)}</td>
      <td style="padding:8px 10px;text-align:center;font-size:12px;color:${COLORS.muted};">${fmt(r.previous)}</td>
      <td style="padding:8px 10px;text-align:center;font-size:12px;color:${deltaColor(r.current, r.previous)};font-weight:600;">${delta(r.current, r.previous)}</td>
    </tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse;margin-top:4px;">${header}${body}</table>`;
}

function weekComparisonTable(rows) {
  const header = `
    <tr style="background:${COLORS.panel};">
      <th style="padding:8px 10px;text-align:left;font-size:11px;color:${COLORS.muted};border-radius:6px 0 0 6px;">Metric</th>
      <th style="padding:8px 10px;text-align:center;font-size:11px;color:${COLORS.muted};">This Week</th>
      <th style="padding:8px 10px;text-align:center;font-size:11px;color:${COLORS.muted};">Last Week</th>
      <th style="padding:8px 10px;text-align:center;font-size:11px;color:${COLORS.muted};border-radius:0 6px 6px 0;">Change</th>
    </tr>`;
  const body = rows.map((r) => `
    <tr style="border-bottom:1px solid ${COLORS.light};">
      <td style="padding:8px 10px;font-size:12px;color:${COLORS.text};font-weight:500;">${r.label}</td>
      <td style="padding:8px 10px;text-align:center;font-size:13px;color:${COLORS.text};font-weight:600;">${fmt(r.current)}</td>
      <td style="padding:8px 10px;text-align:center;font-size:12px;color:${COLORS.muted};">${fmt(r.previous)}</td>
      <td style="padding:8px 10px;text-align:center;font-size:12px;color:${deltaColor(r.current, r.previous)};font-weight:600;">${delta(r.current, r.previous)}</td>
    </tr>`).join('');
  return `<table style="width:100%;border-collapse:collapse;margin-top:4px;">${header}${body}</table>`;
}

export function buildAnalyticsHtml(data) {
  const { reportDate, yesterday, week, allTime, dailyTrend, actsTrend, milestonesTrend, topFeatures, topEvents } = data;

  const maxFeature = topFeatures.length ? Math.max(...topFeatures.map((f) => f.count)) : 1;

  const yesterdayRows = [
    { label: 'Active users', current: yesterday.activeUsers, previous: yesterday.prevDayActiveUsers },
    { label: 'Total events', current: yesterday.totalEvents, previous: yesterday.prevDayTotalEvents },
    { label: 'New users', current: yesterday.newUsers, previous: yesterday.prevDayNewUsers },
    { label: 'New reviews', current: yesterday.newReviews, previous: yesterday.prevDayNewReviews },
    { label: 'New purchases', current: yesterday.newPurchases, previous: yesterday.prevDayNewPurchases },
    { label: 'New support msgs', current: yesterday.newSupportMessages, previous: yesterday.prevDayNewSupportMessages },
  ];

  const weekRows = [
    { label: 'Active users', current: week.activeUsers, previous: week.prevWeekActiveUsers },
    { label: 'Total events', current: week.totalEvents, previous: week.prevWeekTotalEvents },
    { label: 'New users', current: week.newUsers, previous: week.prevWeekNewUsers },
    { label: 'New reviews', current: week.newReviews, previous: week.prevWeekNewReviews },
    { label: 'New purchases', current: week.newPurchases, previous: week.prevWeekNewPurchases },
    { label: 'New support msgs', current: week.newSupportMessages, previous: week.prevWeekNewSupportMessages },
  ];

  const contentTotals = [
    { label: 'Total users', value: allTime.totalUsers },
    { label: 'People', value: allTime.totalPeople },
    { label: 'Pets', value: allTime.totalPets },
    { label: 'Acts of support', value: allTime.totalActs },
    { label: 'Events', value: allTime.totalEvents },
    { label: 'Gift ideas', value: allTime.totalGiftIdeas },
    { label: 'Groups', value: allTime.totalGroups },
    { label: 'Trips', value: allTime.totalTrips },
    { label: 'Prayer requests', value: allTime.totalPrayerRequests },
    { label: 'Milestones', value: allTime.totalMilestones },
    { label: 'Personal notes', value: allTime.totalPersonalNotes },
    { label: 'Goals', value: allTime.totalGoals },
  ];

  const totalsGrid = contentTotals.map((t) =>
    `<div style="display:inline-block;width:48%;margin:0 1% 8px 0;background:${COLORS.panel};border:1px solid ${COLORS.panelBorder};border-radius:8px;padding:10px 12px;box-sizing:border-box;">
      <span style="font-size:11px;color:${COLORS.muted};">${t.label}</span>
      <span style="float:right;font-size:16px;font-weight:700;color:${COLORS.text};">${fmt(t.value)}</span>
    </div>`
  ).join('');

  const maxDaily = dailyTrend.length ? Math.max(...dailyTrend.map((d) => d.count)) : 1;
  const maxActs = actsTrend?.length ? Math.max(...actsTrend.map((d) => d.count), 1) : 1;
  const maxMilestones = milestonesTrend?.length ? Math.max(...milestonesTrend.map((d) => d.count), 1) : 1;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLORS.text};">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="text-align:center;padding:20px 0 16px;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${COLORS.primary};">FinBump Analytics Report</h1>
      <p style="margin:4px 0 0;font-size:13px;color:${COLORS.muted};">${reportDate}</p>
    </div>

    <!-- Yesterday summary cards -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
      <tr>
        ${statCard('Active yesterday', yesterday.activeUsers, delta(yesterday.activeUsers, yesterday.prevDayActiveUsers), deltaColor(yesterday.activeUsers, yesterday.prevDayActiveUsers))}
        ${statCard('Events yesterday', yesterday.totalEvents, delta(yesterday.totalEvents, yesterday.prevDayTotalEvents), deltaColor(yesterday.totalEvents, yesterday.prevDayTotalEvents))}
      </tr>
      <tr>
        ${statCard('Active (7 days)', week.activeUsers, delta(week.activeUsers, week.prevWeekActiveUsers), deltaColor(week.activeUsers, week.prevWeekActiveUsers))}
        ${statCard('Events (7 days)', week.totalEvents, delta(week.totalEvents, week.prevWeekTotalEvents), deltaColor(week.totalEvents, week.prevWeekTotalEvents))}
      </tr>
    </table>

    <!-- Yesterday vs previous day -->
    ${section('Yesterday vs Previous Day', comparisonTable(yesterdayRows))}

    <!-- This week vs last week -->
    ${section('This Week vs Last Week', weekComparisonTable(weekRows))}

    <!-- Daily active users trend (7-day) -->
    ${section('Daily Active Users — Last 7 Days', verticalBars(dailyTrend, maxDaily))}

    <!-- Acts completed trend (7-day) -->
    ${section('Acts Completed — Last 7 Days', lineChart(actsTrend, maxActs, COLORS.bar, 'rgba(208,122,106,0.15)'))}

    <!-- Milestones completed trend (7-day) -->
    ${section('Milestones Completed — Last 7 Days', lineChart(milestonesTrend, maxMilestones, COLORS.green, 'rgba(122,156,144,0.15)'))}

    <!-- Top features (7-day) -->
    ${section('Top Features — Last 7 Days',
      topFeatures.length === 0
        ? '<p style="margin:0;font-size:12px;color:' + COLORS.muted + ';">No usage data yet.</p>'
        : topFeatures.map((f) => barChartRow(escapeHtml(f.feature.replace(/_/g, ' ')), f.count, maxFeature, COLORS.bar)).join('')
    )}

    <!-- Top events (7-day) -->
    ${section('Top Actions — Last 7 Days',
      topEvents.length === 0
        ? '<p style="margin:0;font-size:12px;color:' + COLORS.muted + ';">No event data yet.</p>'
        : topEvents.slice(0, 10).map((e) =>
            `<div style="display:inline-block;margin:0 4px 6px 0;padding:4px 10px;background:${COLORS.panel};border:1px solid ${COLORS.panelBorder};border-radius:14px;font-size:12px;">
              <span style="font-weight:500;color:${COLORS.text};">${escapeHtml(e.eventName.replace(/_/g, ' '))}</span>
              <span style="color:${COLORS.muted};margin-left:6px;">${fmt(e.count)}</span>
            </div>`
          ).join('')
    )}

    <!-- Content totals -->
    ${section('All-Time Content Totals', totalsGrid)}

    <!-- Reviews & Revenue -->
    ${section('Reviews & Revenue', `
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          ${statCard('Avg rating', allTime.avgRating ? allTime.avgRating.toFixed(1) + '★' : '—', `${fmt(allTime.totalReviews)} total reviews`, COLORS.muted)}
          ${statCard('Active subscriptions', allTime.activeSubscriptions, `${fmt(allTime.totalPurchases)} total purchases`, COLORS.muted)}
        </tr>
      </table>
    `)}

    <p style="text-align:center;font-size:11px;color:${COLORS.muted};margin-top:16px;padding-top:12px;border-top:1px solid ${COLORS.light};">
      Generated by FinBump · Daily Analytics Report
    </p>
  </div>
</body>
</html>`;
}

export function buildAnalyticsText(data) {
  const { reportDate, yesterday, week, allTime, topFeatures, topEvents } = data;
  const lines = [
    `FinBump Analytics Report — ${reportDate}`,
    ``,
    `=== YESTERDAY ===`,
    `Active users: ${yesterday.activeUsers} (prev: ${yesterday.prevDayActiveUsers})`,
    `Total events: ${yesterday.totalEvents} (prev: ${yesterday.prevDayTotalEvents})`,
    `New users: ${yesterday.newUsers} (prev: ${yesterday.prevDayNewUsers})`,
    `New reviews: ${yesterday.newReviews} (prev: ${yesterday.prevDayNewReviews})`,
    `New purchases: ${yesterday.newPurchases} (prev: ${yesterday.prevDayNewPurchases})`,
    ``,
    `=== THIS WEEK (7 days) ===`,
    `Active users: ${week.activeUsers} (prev week: ${week.prevWeekActiveUsers})`,
    `Total events: ${week.totalEvents} (prev week: ${week.prevWeekTotalEvents})`,
    `New users: ${week.newUsers} (prev week: ${week.prevWeekNewUsers})`,
    `New reviews: ${week.newReviews} (prev week: ${week.prevWeekNewReviews})`,
    `New purchases: ${week.newPurchases} (prev week: ${week.prevWeekNewPurchases})`,
    ``,
    `=== ALL-TIME TOTALS ===`,
    `Users: ${allTime.totalUsers} | People: ${allTime.totalPeople} | Pets: ${allTime.totalPets}`,
    `Acts: ${allTime.totalActs} | Events: ${allTime.totalEvents} | Gift ideas: ${allTime.totalGiftIdeas}`,
    `Groups: ${allTime.totalGroups} | Trips: ${allTime.totalTrips} | Prayer: ${allTime.totalPrayerRequests}`,
    `Reviews: ${allTime.totalReviews} (avg ${allTime.avgRating?.toFixed(1) || 0}/5)`,
    `Purchases: ${allTime.totalPurchases} | Active subs: ${allTime.activeSubscriptions}`,
    ``,
    // feature/eventName come from AnalyticsEvent records any approved user can
    // create, and this body may be rendered as HTML by the sending integration —
    // so the labels are escaped here exactly as they are in the HTML form.
    `=== TOP FEATURES (7 days) ===`,
    ...topFeatures.slice(0, 8).map((f) => `  ${escapeHtml(f.feature.replace(/_/g, ' '))}: ${f.count}`),
    ``,
    `=== TOP ACTIONS (7 days) ===`,
    ...topEvents.slice(0, 10).map((e) => `  ${escapeHtml(e.eventName.replace(/_/g, ' '))}: ${e.count}`),
  ];
  return lines.join('\n');
}