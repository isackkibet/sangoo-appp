export interface MediaUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  is_verified: boolean;
  is_private: boolean;
  reporter_verified?: boolean;
  is_following?: boolean;
  follows_you?: boolean;
  follow_pending?: boolean;
  follower_count?: number;
  following_count?: number;
  post_count?: number;
}

export interface MediaComment {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  is_liked?: boolean;
  is_owner?: boolean;
  parent_id?: string | null;
  user: { id: string; username: string; avatar_url: string };
  replies: MediaComment[];
}

export interface MediaImage {
  id: string;
  url: string;
  width: number;
  height: number;
  alt_text: string;
  kind: 'image' | 'video';
  duration_ms?: number | null;
}

export interface MediaPost {
  id: string;
  type: 'post' | 'reel';
  caption: string;
  category: string;
  created_at: string;
  aspect_ratio: number;
  hide_likes: boolean;
  comments_off: boolean;
  visibility?: 'public' | 'followers' | 'private';
  location_name: string | null;
  like_count: number;
  comment_count: number;
  repost_count?: number;
  images: MediaImage[];
  videos: MediaImage[];
  user: MediaUser;
  comments: MediaComment[];
  hashtags?: string[];
  is_liked: boolean;
  is_saved: boolean;
  is_reposted: boolean;
  is_owner?: boolean;
  is_real?: boolean;
}

export interface StoryItem {
  id: string;
  kind: 'image' | 'video';
  url: string;
  width: number;
  height: number;
  duration_ms: number | null;
  caption: string;
  created_at: string;
  expires_at: string;
  view_count: number;
  is_viewed: boolean;
  reaction: string | null;
  is_owner?: boolean;
}

export interface StoryGroup {
  userId: string;
  username: string;
  avatarUrl: string;
  hasUnseen: boolean;
  items: StoryItem[];
}

export interface SuggestedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  is_verified: boolean;
  mutual_count: number;
  is_following?: boolean;
  follow_pending?: boolean;
}

export interface MediaNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'follow_request' | 'mention' | 'reply' | 'message' | 'repost';
  actor: { id?: string; username: string; avatar_url: string };
  text: string;
  post_id?: string | null;
  post_image?: string | null;
  conversation_id?: string | null;
  created_at: string;
  read: boolean;
}

export interface MediaMessage {
  id: string;
  conversation_id?: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_own: boolean;
  media_url?: string | null;
  media_kind?: 'image' | 'video' | null;
}

export interface Conversation {
  id: string;
  username: string;
  full_name?: string;
  avatar_url: string;
  user_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  unread: boolean;
  is_group: boolean;
  messages: MediaMessage[];
}

export interface TrendingHashtag {
  tag: string;
  post_count: number;
}

export interface SearchResults {
  users: MediaUser[];
  posts: MediaPost[];
  hashtags: TrendingHashtag[];
  locations: { name: string; post_count: number }[];
}

export interface ProfileResponse {
  user: MediaUser;
  locked: boolean;
  is_self: boolean;
  posts: MediaPost[];
  nextCursor: number | null;
}

export interface FeedResponse {
  posts: MediaPost[];
  nextCursor: number | null;
}

export interface AdminReport {
  id: string;
  target_type: 'post' | 'comment' | 'user' | 'story';
  target_id: string;
  reason: string;
  details: string | null;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  reporter: { id: string; username: string; avatar_url: string } | null;
  target_preview: string | null;
}

export interface AdminStats {
  users: number;
  posts: number;
  comments: number;
  stories: number;
  messages: number;
  open_reports: number;
  suspended_users: number;
}
