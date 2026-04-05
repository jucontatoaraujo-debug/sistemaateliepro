'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/store/auth.store';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login');
  }, []);

  if (!isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn('fixed top-4 z-50 p-2 bg-gray-900 text-white rounded-lg transition-all lg:hidden', collapsed ? 'left-4' : 'left-[232px]')}
      >
        <Menu size={18} />
      </button>

      <main className={cn('transition-all duration-300', collapsed ? 'ml-16' : 'ml-60')}>
        <div className="p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
