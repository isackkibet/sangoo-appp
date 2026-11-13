import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import MediaSidebar from '@/components/media/MediaSidebar';
import MediaOverlays from '@/components/media/MediaOverlays';
import { getSessionUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Media',
  description: 'Share and discover photos, videos and stories from the Lake Victoria Basin community.',
};

export const dynamic = 'force-dynamic';

export default async function MediaLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/media/feed');

  return (
    <div className="flex min-h-screen bg-white">
      <MediaSidebar />
      <main className="flex-1 ml-0 lg:ml-[244px] xl:ml-[280px] min-h-screen pb-14 lg:pb-0">
        {children}
      </main>
      <MediaOverlays />
    </div>
  );
}
