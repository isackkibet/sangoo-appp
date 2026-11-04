// Backwards-compatible type barrel.
// SIHU Media now loads every record from the live database; no demo data is
// bundled with the app.
export * from "./types";

import type {
  Conversation,
  MediaNotification,
  MediaPost,
  MediaUser,
  SuggestedUser,
} from "./types";

export const EXPLORE_POSTS: MediaPost[] = [];
export const MEDIA_POSTS: MediaPost[] = [];
export const MEDIA_NOTIFICATIONS: MediaNotification[] = [];
export const MEDIA_USER: MediaUser & {
  posts: number;
  followers: number;
  following: number;
} = {
  id: "member",
  username: "member",
  full_name: "SIHU member",
  avatar_url: "",
  bio: null,
  posts: 0,
  is_verified: false,
  is_private: false,
  followers: 0,
  following: 0,
  website: null,
};

export const MEDIA_STORIES = [
  {
    userId: "user_1",
    username: "member",
    avatarUrl: "",
    hasUnseen: false,
  },
];

export const MEDIA_CONVERSATIONS: Conversation[] = [];
export const MEDIA_SUGGESTED_USERS: SuggestedUser[] = [];
