import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');
  if (!isAdmin(user.email)) redirect('/dashboard');

  return <>{children}</>;
}
