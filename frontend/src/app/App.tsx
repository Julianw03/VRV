import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell'
import { ConnectPage } from '@/pages/ConnectPage'
import { RecentMatchesPage } from '@/pages/RecentMatchesPage'
import { SavedReplaysPage } from '@/pages/SavedReplaysPage'
import { InjectorPage } from '@/pages/InjectorPage'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useMapRegistry } from '@/lib/queries'

function App() {
  useWebSocket()
  useMapRegistry()

  return (
    <HashRouter>
      <Routes>
        {/* Connection gate — shown before the Riot Client is connected */}
        <Route path="/connect" element={<ConnectPage />} />

        {/* Main app shell — redirects to /connect if not connected */}
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/saved" replace />} />
          <Route path="/recent" element={<RecentMatchesPage />} />
          <Route path="/saved" element={<SavedReplaysPage />} />
          <Route path="/injector" element={<InjectorPage />} />
          <Route path="*" element={<Navigate to="/recent" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
