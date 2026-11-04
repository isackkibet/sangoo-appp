'use client';

import PostViewModal from '@/components/media/PostViewModal';
import NotificationsPanel from '@/components/media/NotificationsPanel';
import SearchPanel from '@/components/media/SearchPanel';
import CreatePostModal from '@/components/media/CreatePostModal';

export default function MediaOverlays() {
  return (
    <>
      <CreatePostModal />
      <PostViewModal />
      <NotificationsPanel />
      <SearchPanel />
    </>
  );
}
