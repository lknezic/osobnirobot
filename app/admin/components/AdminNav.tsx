'use client';

import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: '◆' },
  { href: '/admin/workers', label: 'My Workers', icon: '⚡' },
  { href: '/admin/health', label: 'Health', icon: '♥' },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className="shrink-0 flex flex-col border-r"
      style={{ width: 200, background: '#111', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="font-bold text-sm tracking-tight">
          Instant<span style={{ color: '#7c6bf0' }}>Worker</span>
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: '#555' }}>Admin Hub</div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors text-left"
              style={{
                background: isActive ? 'rgba(124,107,240,0.12)' : 'transparent',
                color: isActive ? '#a78bfa' : '#888',
              }}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors text-left"
          style={{ color: '#555' }}
        >
          <span className="text-sm">←</span>
          Client Dashboard
        </button>
      </div>
    </aside>
  );
}
