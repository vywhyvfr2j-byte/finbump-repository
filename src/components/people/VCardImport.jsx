import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useToast } from '@/components/ui/use-toast';

export default function VCardImport() {
  const { reloadPeople } = useKeepsake();
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      const res = await base44.functions.invoke('import-vcard-contacts', { text });
      setResult(res.data);
      if (reloadPeople) await reloadPeople();
      toast({
        title: `${res.data.created} added, ${res.data.updated} updated`,
        description: `Checked ${res.data.imported} contacts from your file`,
      });
    } catch (err) {
      toast({ title: 'Import failed', description: err?.response?.data?.error || err?.message });
    }
    setImporting(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Import a contacts file exported from your phone or iCloud (.vcf). Names, birthdays, anniversaries, emails, and phones come in — and nothing you've already entered is overwritten.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".vcf,text/vcard,text/x-vcard"
        onChange={handleFile}
        className="hidden"
      />
      <Button onClick={() => inputRef.current?.click()} disabled={importing} className="w-full h-11 gap-2">
        {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
        {importing ? 'Importing…' : 'Choose contacts file'}
      </Button>
      {result && (
        <p className="text-xs text-center text-muted-foreground">
          {result.created} added · {result.updated} updated · {Math.max(result.imported - result.created - result.updated, 0)} already here
        </p>
      )}
    </div>
  );
}