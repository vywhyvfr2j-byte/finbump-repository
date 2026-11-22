import React from 'react';
import { TEMPLATE_MAP } from '@/lib/cardTemplates';
import { formatDate } from '@/lib/keepsakeUtils';
import { Image } from '@/components/ui/image';

// Renders a single digital card. `big` is the full-screen open view; the
// default is the compact preview/list tile. Falls back to a sensible template
// when the card's templateKey is missing. When the card has an AI-generated
// imageUrl (Premium), the art is rendered as the background with a legibility
// scrim, overriding the template gradient.
export default function CardView({ card, big = false }) {
  const tpl = TEMPLATE_MAP[card.templateKey] || TEMPLATE_MAP[card.occasion] || TEMPLATE_MAP['justbecause'];
  const hasArt = !!card.imageUrl;
  return (
    <div className={`relative overflow-hidden rounded-3xl ${big ? 'p-8' : 'p-5'} ${hasArt ? 'min-h-[200px]' : `bg-gradient-to-br ${tpl.gradient} ${tpl.ink}`}`}>
      {hasArt ? (
        <>
          <Image src={card.imageUrl} alt={tpl.label} fittingType="fill" className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/25 to-black/50" />
        </>
      ) : (
        <div className="absolute -top-6 -right-6 text-[120px] opacity-20 select-none leading-none">{tpl.emoji}</div>
      )}
      <div className={`relative ${hasArt ? 'text-white' : tpl.ink}`}>
        <p className="text-xs uppercase tracking-widest font-semibold opacity-90">{tpl.label}</p>
        <p className={`mt-1 ${big ? 'text-5xl' : 'text-3xl'}`}>{tpl.emoji}</p>
        <p className={`font-display ${big ? 'text-2xl' : 'text-base'} leading-relaxed mt-4 whitespace-pre-wrap`}>
          {card.message || 'Your card message will appear here…'}
        </p>
        <p className={`mt-5 opacity-90 font-medium ${big ? 'text-base' : 'text-sm'}`}>
          — {card.senderLabel || card.senderName || 'Someone who cares'}
        </p>
        {/* A chosen signature is a greeting, not proof of who sent the card: when
            it differs from the sender's account name, the real sender is shown
            too, so a card never wears someone else's name alone. */}
        {card.senderLabel && card.senderName
          && card.senderLabel.trim().toLowerCase() !== card.senderName.trim().toLowerCase() && (
          <p className={`mt-1 opacity-75 ${big ? 'text-xs' : 'text-[11px]'}`}>Sent by {card.senderName}</p>
        )}
        {card.deliveredAt && (
          <p className="text-[11px] mt-2 opacity-75">{formatDate(card.deliveredAt)}</p>
        )}
      </div>
    </div>
  );
}