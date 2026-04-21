'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, BookOpen, ShieldCheck, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: ChevronLeft, exact: true },
  { href: '/admin/agencies', label: 'Agencies', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/admin/audit', label: 'Audit Logs', icon: ShieldCheck }
];

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b pb-3">
      {adminNavItems.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href + '/') || pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
