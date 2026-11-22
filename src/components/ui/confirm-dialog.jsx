import React, { useCallback, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/I18nContext';

// In-app replacement for window.confirm: the same question, asked in the app's
// own dialog instead of the browser's grey box (which reads as a web page and
// is blocked entirely inside some in-app browsers).
//
//   const { confirm, confirmDialog } = useConfirm();
//   const handleRemove = async () => {
//     if (!(await confirm({ title: 'Remove this?', confirmLabel: 'Remove' }))) return;
//     …
//   };
//   return (<div>{…}{confirmDialog}</div>);
export function useConfirm() {
  const { t } = useI18n();
  const [options, setOptions] = useState(null);
  const resolver = useRef(null);

  const settle = useCallback((answer) => {
    const resolve = resolver.current;
    resolver.current = null;
    setOptions(null);
    resolve?.(answer);
  }, []);

  const confirm = useCallback(
    (next) =>
      new Promise((resolve) => {
        // A second question supersedes one still on screen rather than stacking.
        resolver.current?.(false);
        resolver.current = resolve;
        setOptions(next);
      }),
    [],
  );

  const confirmDialog = (
    <AlertDialog open={!!options} onOpenChange={(open) => { if (!open) settle(false); }}>
      <AlertDialogContent className="max-w-[min(24rem,calc(100vw-2rem))] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">{options?.title}</AlertDialogTitle>
          {options?.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11" onClick={() => settle(false)}>
            {options?.cancelLabel || t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              buttonVariants({ variant: options?.destructive === false ? 'default' : 'destructive' }),
              'h-11',
            )}
            onClick={() => settle(true)}
          >
            {options?.confirmLabel || t('common.remove')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, confirmDialog };
}

export default useConfirm;