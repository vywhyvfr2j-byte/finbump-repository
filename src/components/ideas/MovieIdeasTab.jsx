import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Clapperboard } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Input-only tab: saved movies flow to the contact's profile page.
export default function MovieIdeasTab({ personId }) {
  const { addMovieIdea, people } = useKeepsake();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const person = people.find((p) => p.id === personId);
  const personName = person?.name;

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setLoading(true);
    setTitle('');
    try {
      const result = await base44.functions.invoke('invoke-premium-llm', {
        prompt: `Find where the movie "${trimmed}" is currently available to stream or watch online. Give the single best streaming platform (e.g. Netflix, Prime Video, Disney+, Hulu, HBO Max, Apple TV+) and a direct URL to watch or find it on that platform.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            url: { type: 'string' },
          },
          required: ['platform', 'url'],
        },
      });
      addMovieIdea({ title: trimmed, platform: result?.data?.platform, url: result?.data?.url, personId });
      toast({ title: personName ? `Saved to ${personName}'s profile` : 'Saved to contact', duration: 2500 });
    } catch (err) {
      console.error('MovieIdeasTab: premium LLM call failed', err?.message || err);
      addMovieIdea({ title: trimmed, personId });
      toast({ title: 'Saved (streaming lookup unavailable)', duration: 2500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Movie title"
          className="h-11"
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={!title.trim() || loading} className="h-11 px-4 shrink-0">
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Add'}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2.5">
        <Clapperboard size={14} className="shrink-0" />
        <span>Saved movies appear on the contact's profile page.</span>
      </div>
    </div>
  );
}