import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ConnectPage } from '@/pages/ConnectPage';
import { RecentMatchesPage } from '@/pages/RecentMatchesPage';
import { SavedReplaysPage } from '@/pages/SavedReplaysPage';
import { InjectorPage } from '@/pages/InjectorPage';
import { ConfigPage } from '@/pages/ConfigPage';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMapRegistry } from '@/lib/queries';
import { RequireSessionGuard } from '@/components/RequireSessionGuard.tsx';

function App() {
    useWebSocket();
    useMapRegistry();

    return (
        <HashRouter>
            <Routes>
                <Route path="/connect" element={<ConnectPage />} />

                <Route element={<AppShell />}>
                    { /* Todo use proper routing definition */}
                    <Route index element={<Navigate to="/recent" replace />} />
                    <Route path="/saved" element={<SavedReplaysPage />} />
                    <Route path="/recent" element={
                        <RequireSessionGuard productId={'valorant'}>
                            {() => <RecentMatchesPage />}
                        </RequireSessionGuard>} />
                    <Route path="/injector" element={
                        <RequireSessionGuard productId={'valorant'}>
                            {() => <InjectorPage />}
                        </RequireSessionGuard>
                    } />
                    <Route path="/config" element={<ConfigPage />} />
                    <Route path="*" element={<Navigate to="/recent" replace />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}

export default App;
