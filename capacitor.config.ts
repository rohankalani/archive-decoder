import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f86db1e5759345df877e419eb2558006',
  appName: 'ROSAIQ Air Quality',
  webDir: 'dist',
  server: {
    url: 'https://f86db1e5-7593-45df-877e-419eb2558006.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0f',
      showSpinner: true,
      spinnerColor: '#8b5cf6'
    }
  }
};

export default config;
