
'use client';

import { cn } from '@/lib/utils';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { TokoKilatLogo } from '../icons/logo';
import { usePathname } from 'next/navigation';
import { navItems } from './app-sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { CircleUser, LogOut } from 'lucide-react';
import { type User } from 'firebase/auth';
import { logout } from '@/app/auth/actions';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


function getPageTitle(pathname: string): string {
    for (const item of navItems) {
        if (item.href && pathname.startsWith(item.href)) {
            return item.label;
        }
        if (item.subItems) {
            for (const subItem of item.subItems) {
                if (subItem.href && pathname.startsWith(subItem.href)) {
                    return subItem.label;
                }
            }
        }
    }
    return "Dashboard";
}


export function AppHeader({ companyName, user }: { companyName: string, user: User | null }) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6'
      )}
    >
      <SidebarTrigger className="-ml-2" />
       <div className="flex w-full items-center justify-between">
          <h1 className="text-xl font-semibold md:text-2xl font-headline">{pageTitle}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                    <Avatar>
                        <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.displayName || user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => await logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
