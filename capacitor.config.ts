import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finbump.app',
  appName: 'FinBump',
  webDir: 'dist',
  ios: {
    webContentsDebuggingEnabled: true
  }
};

export default config;