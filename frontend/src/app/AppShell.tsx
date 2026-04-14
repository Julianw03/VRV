import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/Sidebar'
import { useIsConnected } from '@/lib/queries'

const PAGE_TITLES: Record<string, string> = {
  '/recent': 'Recent Matches',
  '/saved': 'Saved Replays',
  '/injector': 'Injector',
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: isConnected, isLoading, isError } = useIsConnected()

  useEffect(() => {
    if (!isLoading && (isConnected === false || isError)) {
      navigate('/connect', { replace: true })
    }
  }, [isConnected, isLoading, isError, navigate])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Checking connection…
      </div>
    )
  }

  // Will redirect in the effect — render nothing to avoid flash
  if (!isConnected) return null

  const title = PAGE_TITLES[location.pathname] ?? 'VRV'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 flex-center">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
          />
          <h1 className="text-sm font-semibold">{title}</h1>
        </header>
        <main className="flex flex-1 flex-col p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
