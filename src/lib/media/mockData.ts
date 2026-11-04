// Backwards-compatible type barrel.
// SIHU Media now loads every record from the live database; no demo data is
// bundled with the app.
export * from "./types";

export const EXPLORE_POSTS = [];
export const MEDIA_POSTS = [];
export const MEDIA_NOTIFICATIONS = [];
export const MEDIA_USER = {
  username: "member",
  full_name: "SIHU member",
  avatar_url: "",
  posts: [],
  is_verified: false,
  followers: 0,
  following: 0,
  website: "",
};

export const MEDIA_STORIES = [
  {
    userId: "user_1",
    username: "member",
    avatarUrl: "",
    hasUnseen: false,
  },
];

export const MEDIA_CONVERSATIONS = [];
  {
    id: "user_1",
    username: "member",
    full_name: "SIHU member",
    avatar_url: "",
    is_verified: false,
  },
];
