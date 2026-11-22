import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Store, X, Plus } from 'lucide-react';

const PRESET_LOCATIONS = [
  'Amazon',
  'Etsy',
  'Target',
  'Walmart',
  'Local boutiques',
  'eBay',
  'Uncommon Goods',
  'Bookshop.org',
  'Williams Sonoma',
  'Crate & Barrel',
];

export default function ShoppingLocationsSection() {
  const { myPreferences, updateMyPreferences } = useKeepsake();
  const [custom, setCustom] = useState('');

  const locations = myPreferences.shoppingLocations || [];

  const toggle = (loc) => {
    const next = locations.includes(loc)
      ? locations.filter((l) => l !== loc)
      : [...locations, loc];
    updateMyPreferences({ shoppingLocations: next });
  };

  const addCustom = () => {
    const val = custom.trim();
    if (!val) return;
    if (locations.some((l) => l.toLowerCase() === val.toLowerCase())) {
      setCustom('');
      return;
    }
    updateMyPreferences({ shoppingLocations: [...locations, val] });
    setCustom('');
  };

  const remove = (loc) => {
    updateMyPreferences({ shoppingLocations: locations.filter((l) => l !== loc) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Store size={14} className="text-muted-foreground" />
        <label className="text-xs font-medium text-muted-foreground">Preferred shopping locations</label>
      </div>
      <p className="text-xs text-muted-foreground -mt-0.5">
        The AI gift finder will pick 1–2 of these and prioritize finding product links from them. It still researches broadly — this just steers where the links point.
      </p>

      {locations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {locations.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1 pl-3 pr-1.5 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              {loc}
              <button
                type="button"
                onClick={() => remove(loc)}
                className="hover:bg-primary/20 rounded-full p-0.5"
                aria-label={`Remove ${loc}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {PRESET_LOCATIONS.filter((p) => !locations.some((l) => l.toLowerCase() === p.toLowerCase())).map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => toggle(loc)}
            className="px-3 h-8 rounded-full text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            + {loc}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Add a store (e.g. REI, Sephora)"
          aria-label="Add a custom store"
          className="h-10"
        />
        <Button variant="outline" onClick={addCustom} disabled={!custom.trim()} aria-label="Add store" className="h-10 shrink-0">
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
}