import PostFeed from '@/components/media/PostFeed';
import StoriesRow from '@/components/media/StoriesRow';
import RightSidebar from '@/components/media/RightSidebar';
import MediaComposer from '@/components/media/MediaComposer';

export default function FeedPage() {
  return (
    <div className="flex justify-center gap-8 px-0 sm:px-4 pt-4 pb-24 lg:pb-6">
      <div className="w-full max-w-[630px] min-w-0">
        <MediaComposer />
        <StoriesRow />
        <PostFeed />
      </div>
      <aside className="hidden xl:block w-[330px] shrink-0 pt-2">
        <RightSidebar />
      </aside>
    </div>
  );
}
