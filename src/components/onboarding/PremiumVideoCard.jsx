import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Crown, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// A premium feature card for the onboarding tour that shows a short demo
// video of the feature. The builder records real screen captures of each
// premium feature and drops the URL in as `videoUrl` (in featureData.js);
// until then the poster image is shown with a play button and a friendly
// "coming soon" toast, so the card always looks intentional.
//
// `posterUrl` is a single shared still that conveys "premium video here".
export default function PremiumVideoCard({ name, desc, to, videoUrl, posterUrl }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const { toast } = useToast();

  const handlePlay = () => {
    if (!videoUrl) {
      toast({
        title: 'Demo coming soon',
        description: "We're adding the screen recordings shortly.",
      });
      return;
    }
    setPlaying(true);
    // Start playback once the <video> mounts.
    setTimeout(() => videoRef.current?.play?.(), 0);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="relative aspect-video bg-muted">
        {playing && videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={handlePlay}
            className="group block w-full h-full relative"
            aria-label={`Play demo for ${name}`}
          >
            <img
              src={posterUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-12 h-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                <Play size={22} className="ml-0.5" fill="currentColor" />
              </span>
            </span>
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
              <Crown size={10} /> Premium
            </span>
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="font-semibold text-sm text-foreground mb-1.5">{name}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{desc}</p>
        {to && (
          <Link
            to={to}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            Try it <ExternalLink size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}