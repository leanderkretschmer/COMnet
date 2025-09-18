export interface User {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Community {
  id: string;
  name: string;
  title: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  member_count: number;
  post_count: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
  owner?: User;
}

export interface Post {
  id: string;
  title: string;
  content?: string;
  type: 'text' | 'image' | 'video' | 'link';
  media_url?: string;
  link_url?: string;
  author_id: string;
  community_id: string;
  upvotes: number;
  downvotes: number;
  score: number;
  comment_count: number;
  is_locked: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: User;
  community?: Community;
  user_vote?: number; // -1 for downvote, 1 for upvote, 0 for no vote
}

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  parent_id?: string;
  upvotes: number;
  downvotes: number;
  score: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author_username: string;
  author_display_name?: string;
  author_avatar_url?: string;
  user_vote?: number; // -1 for downvote, 1 for upvote, 0 for no vote
}

export interface Network {
  id: string;
  name: string;
  domain: string;
  description?: string;
  icon_url?: string;
  is_public: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
