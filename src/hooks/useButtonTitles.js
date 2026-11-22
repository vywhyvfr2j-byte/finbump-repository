import { useEffect } from 'react';

/**
 * Scans the DOM for <button> elements and sets a native `title` attribute
 * from the button's visible text content, so users can hover to read the
 * full label (especially helpful when text is truncated).
 * Skips buttons that already have an explicit title (e.g. the Button
 * component, which derives one at render time).
 */
export function useButtonTitles() {
  useEffect(() => {
    const setTitle = (el) => {
      if (!el || el.tagName !== 'BUTTON') return;
      if (el.hasAttribute('title')) return;
      const text = (el.textContent || '').trim();
      if (text) el.setAttribute('title', text);
    };

    const scan = (root) => {
      if (!root || !root.querySelectorAll) return;
      root.querySelectorAll('button').forEach(setTitle);
    };

    scan(document);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          setTitle(node);
          scan(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}