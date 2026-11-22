import React, { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCw } from 'lucide-react';

const THRESHOLD = 70;
const MAX_PULL = 120;
const RESISTANCE = 0.5;

// Lightweight touch gesture pull-to-refresh. Attaches to window scroll: only
// activates when the gesture starts with the page already scrolled to the top,
// so normal scrolling and horizontal swipes are never hijacked.
// True when the gesture starts inside a nested list that is already scrolled
// (a chat thread, a panel): pulling there belongs to that list, not the page.
const startsInScrolledList = (el) => {
  let node = el;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const oy = style.overflowY;
    if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight && node.scrollTop > 0) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
};

export default function PullToRefresh({ onRefresh, children, disabled = false }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState(false);
  const wrapRef = useRef(null);
  const startY = useRef(null);
  const pulling = useRef(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);

  // The app layout already wraps every screen in one of these. A screen that
  // also wrapped itself would otherwise run two gestures at once — two spinners
  // and twice the travel — so the inner one steps aside and lets the outer own
  // the pull.
  const [nested, setNested] = useState(false);
  useEffect(() => {
    if (wrapRef.current?.parentElement?.closest('[data-pull-refresh]')) setNested(true);
  }, []);
  const off = disabled || nested;

  useEffect(() => {
    if (off) return undefined;
    const onStart = (e) => {
      if (refreshingRef.current) return;
      if (window.scrollY <= 0 && !startsInScrolledList(e.target)) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
        setActive(true);
      } else {
        startY.current = null;
        pulling.current = false;
      }
    };
    const onMove = (e) => {
      if (!pulling.current || startY.current == null || refreshingRef.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        if (pullRef.current !== 0) {
          pullRef.current = 0;
          setPull(0);
        }
        return;
      }
      if (e.cancelable) e.preventDefault();
      const eased = Math.min(MAX_PULL, delta * RESISTANCE);
      pullRef.current = eased;
      setPull(eased);
    };
    const onEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      startY.current = null;
      setActive(false);
      const reached = pullRef.current >= THRESHOLD;
      if (reached) {
        setRefreshing(true);
        refreshingRef.current = true;
        setPull(THRESHOLD);
        pullRef.current = THRESHOLD;
        try {
          await (onRefresh ? onRefresh() : new Promise((res) => setTimeout(res, 700)));
        } finally {
          setRefreshing(false);
          refreshingRef.current = false;
          setPull(0);
          pullRef.current = 0;
        }
      } else {
        setPull(0);
        pullRef.current = 0;
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [onRefresh, off]);

  // Off for screens that own a full-bleed overlay of their own: the pull
  // wrapper's transform would re-anchor their fixed layers, so it steps aside
  // completely rather than wrapping them.
  if (off) return <>{children}</>;

  const progress = Math.min(1, pull / THRESHOLD);
  const transition = active ? 'none' : 'transform 220ms ease-out';

  return (
    <div className="relative" ref={wrapRef} data-pull-refresh>
      <div
        className="absolute left-1/2 top-0 z-20 flex items-center justify-center pointer-events-none"
        style={{ transform: `translate(-50%, ${pull - 44}px)`, transition }}
      >
        {refreshing ? (
          <Loader2 size={26} className="animate-spin text-primary" />
        ) : (
          <RotateCw
            size={24}
            className="text-primary/70"
            style={{ transform: `rotate(${progress * 360}deg)`, transition: active ? 'none' : 'transform 120ms' }}
          />
        )}
      </div>
      <div style={{ transform: `translateY(${pull}px)`, transition }} className="will-change-transform">
        {children}
      </div>
    </div>
  );
}