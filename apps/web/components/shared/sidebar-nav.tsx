'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plane,
  BookOpen,
  LogOut,
  Menu,
  X,
  UserCircle,
  Building2,
  Users,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ThemeToggle } from '@/components/shared/theme-toggle';

type NavUser = {
  sub: string;
  email: string;
  role: 'agent' | 'admin';
  agencyId?: string | null;
  name?: string | null;
  phone?: string | null;
  agency?: { id: string; name: string } | null;
};

const agentNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/flights', label: 'Flights', icon: Plane },
  { href: '/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/profile', label: 'Profile', icon: UserCircle }
];

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/agencies', label: 'Agencies', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/roles', label: 'Roles & Access', icon: ShieldCheck },
  { href: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/admin/audit', label: 'Audit Logs', icon: ShieldCheck },
  { href: '/profile', label: 'Profile', icon: UserCircle }
];

export function SidebarNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user.role === 'admin' ? adminNavItems : agentNavItems;
  const homeHref = user.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <>
      {/* Mobile header bar */}
      <div className="flex items-center justify-between border-b bg-card p-4 lg:hidden">
        <Link href={homeHref} className="flex items-center gap-2 font-bold text-primary">
          <Plane className="h-6 w-6" />
          <span>AirTicket</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <nav className="flex h-full w-64 flex-col bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <NavContent pathname={pathname} user={user} onNav={() => setMobileOpen(false)} />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-card">
        <nav className="flex flex-1 flex-col p-4">
          <NavContent pathname={pathname} user={user} />
        </nav>
      </aside>
    </>
  );
}

function NavContent({
  pathname,
  user,
  onNav
}: {
  pathname: string;
  user: NavUser;
  onNav?: () => void;
}) {
  const displayName = user.name || user.email;
  const navItems = user.role === 'admin' ? adminNavItems : agentNavItems;
  const homeHref = user.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <>
      <Link href={homeHref} className="mb-8 flex items-center gap-2 font-bold text-xl text-primary" onClick={onNav}>
        <Plane className="h-7 w-7" />
        <span>AirTicket</span>
      </Link>

      <div className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-auto border-t pt-4">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          {user.agency && (
            <p className="text-xs text-muted-foreground truncate">{user.agency.name}</p>
          )}
        </div>
        <div className="px-3 py-2">
          <ThemeToggle />
        </div>
        <form action="/logout" method="get">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}
