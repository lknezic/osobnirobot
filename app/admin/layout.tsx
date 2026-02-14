import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin-auth';
import { AdminNav } from './components/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');
  if (!isAdmin(user.email)) redirect('/dashboard');

  return (
    <div className="flex h-screen" style={{ background: '#0a0a0a', color: '#e5e5e5' }}>
      <AdminNav />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
