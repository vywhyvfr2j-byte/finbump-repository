import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  // Absolute, so the client never falls back to paths relative to the page —
  // inside the native WebView that is capacitor://localhost, not the API.
  serverUrl: API_BASE_URL,
  requiresAuth: false,
  appBaseUrl
});