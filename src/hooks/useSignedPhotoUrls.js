import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Pictures kept with a memory moment live in private storage, so each one is
// turned into a short-lived signed URL before it can be shown. Returns a map of
// stored URI -> signed URL; a URI missing from the map is still being signed.
export default function useSignedPhotoUrls(uris) {
  const [urls, setUrls] = useState({});
  const key = (uris || []).join('|');

  useEffect(() => {
    const list = (uris || []).filter(Boolean);
    if (!list.length) {
      setUrls({});
      return;
    }
    let cancelled = false;
    Promise.all(
      list.map(async (uri) => {
        try {
          const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
            file_uri: uri,
            expires_in: 3600,
          });
          return [uri, signed_url || null];
        } catch {
          return [uri, null];
        }
      })
    ).then((pairs) => {
      if (!cancelled) setUrls(Object.fromEntries(pairs.filter(([, url]) => url)));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return urls;
}