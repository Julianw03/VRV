import {BugPlay, Clock, HardDrive, Zap} from 'lucide-react'
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader,} from '@/components/ui/sidebar'
import {type NavItem, NavMain} from '@/components/NavMain'
import {ConnectionStatus} from '@/components/ConnectionStatus'

const navItems: NavItem[] = [
    {title: 'Recent Matches', path: '/recent', icon: Clock},
    {title: 'Saved Replays', path: '/saved', icon: HardDrive},
    {title: 'Injector', path: '/injector', icon: BugPlay},
]

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                        <Zap className="size-4 text-primary-foreground"/>
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-none">VRV</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Replay Viewer</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems}/>
            </SidebarContent>
            <SidebarFooter>
                <ConnectionStatus/>
            </SidebarFooter>
        </Sidebar>
    )
}
