'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plane,
  BookOpen,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/flights', label: 'Flights', icon: Plane },
  { href: '/bookings', label: 'Bookings', icon: BookOpen }
];

export function SidebarNav({ userEmail, userRole }: { userEmail: string; userRole: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile header bar */}
      <div className="flex items-center justify-between border-b bg-card p-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
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
            <NavContent pathname={pathname} userEmail={userEmail} userRole={userRole} onNav={() => setMobileOpen(false)} />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r bg-card">
        <nav className="flex flex-1 flex-col p-4">
          <NavContent pathname={pathname} userEmail={userEmail} userRole={userRole} />
        </nav>
      </aside>
    </>
  );
}

function NavContent({
  pathname,
  userEmail,
  userRole,
  onNav
}: {
  pathname: string;
  userEmail: string;
  userRole: string;
  onNav?: () => void;
}) {
  return (
    <>
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 font-bold text-xl text-primary" onClick={onNav}>
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
              pathname === item.href
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
          <p className="text-sm font-medium truncate">{userEmail}</p>
          <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
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
