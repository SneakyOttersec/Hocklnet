import { HashRouter, Routes, Route } from 'react-router-dom';
import { GenealogyProvider } from './store/GenealogyContext';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { TreeWorkspace } from './components/tree/TreeWorkspace';
import { SettingsPage } from './components/settings/SettingsPage';
import './i18n';
import './styles/global.css';

function App() {
  return (
    <GenealogyProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tree" element={<TreeWorkspace />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </GenealogyProvider>
  );
}

export default App;
