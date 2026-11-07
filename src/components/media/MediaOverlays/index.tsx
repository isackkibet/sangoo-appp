'use client';

import PostViewModal from '@/components/media/PostViewModal';
import NotificationsPanel from '@/components/media/NotificationsPanel';
import SearchPanel from '@/components/media/SearchPanel';
import CreatePostModal from '@/components/media/CreatePostModal';
import CreateStoryModal from '@/components/media/CreateStoryModal';
import StoryViewer from '@/components/media/StoryViewer';

export default function MediaOverlays() {
  return (
    <>
      <CreatePostModal />
      <CreateStoryModal />
      <StoryViewer />
      <PostViewModal />
      <NotificationsPanel />
      <SearchPanel />
    </>
  );
}
