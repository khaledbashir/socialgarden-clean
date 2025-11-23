'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Package, Users, BarChart3, ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const adminLinks = [
    { href: '/admin/services', label: 'Services', icon: Package },
    { href: '/admin/settings', label: 'AI Settings', icon: Settings },
    { href: '/admin/users', label: 'Users', icon: Users, disabled: true },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, disabled: true },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-[#1FE18E]/20 shadow-2xl relative flex flex-col">
        {/* Logo/Back */}
        <div className="p-6 border-b border-[#1FE18E]/20">
          <Link href="/" className="flex items-center gap-2 text-[#1FE18E] hover:text-[#1FE18E]/80 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to App</span>
          </Link>
        </div>

        {/* Admin Title */}
        <div className="p-6 border-b border-[#1FE18E]/20">
          <h2 className="text-lg font-bold text-white mb-1">Admin Panel</h2>
          <p className="text-xs text-gray-500">Manage your application</p>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2 flex-1">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            
            if (link.disabled) {
              return (
                <div
                  key={link.href}
                  className="px-4 py-3 rounded-lg text-gray-600 flex items-center gap-3 opacity-50 cursor-not-allowed"
                  title="Coming soon"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{link.label}</span>
                  <span className="ml-auto text-xs bg-gray-900 px-2 py-1 rounded">Soon</span>
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                  active
                    ? 'bg-[#1FE18E]/20 text-[#1FE18E] border border-[#1FE18E]/30'
                    : 'text-gray-400 hover:bg-[#1FE18E]/10 hover:text-[#1FE18E]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-6 border-t border-[#1FE18E]/20 bg-black/80 backdrop-blur">
          <div className="text-xs text-gray-500 space-y-2">
            <p className="font-medium text-gray-400">Need help?</p>
            <p>Contact support or check documentation for admin features.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
