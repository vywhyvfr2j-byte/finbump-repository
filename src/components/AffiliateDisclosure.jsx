// FTC affiliate disclosure. Shown in Settings and next to any shopping /
// affiliate buy link so the app stays compliant when affiliate marketing
// is enabled.
export default function AffiliateDisclosure({ className = '' }) {
  return (
    <p className={`text-[10px] leading-relaxed text-muted-foreground ${className}`}>
      Affiliate disclosure: We may earn a commission from purchases made through our links, at no extra cost to you.
    </p>
  );
}