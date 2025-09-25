import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { DeviceProvider } from './contexts/DeviceContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { RealtimeDataProvider } from './contexts/RealtimeDataContext';
import { Toaster } from './components/ui/toaster';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <DeviceProvider>
          <RealtimeDataProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
              <Toaster />
            </Router>
          </RealtimeDataProvider>
        </DeviceProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;