export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  extension_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export type LinkStatus = "unread" | "digested" | "archived";
export type ContentType = "article" | "video" | "tweet" | "pdf";

export interface Link {
  id: string;
  user_id: string;
  folder_id: string | null;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  status: LinkStatus;
  content_type: ContentType;
  digested_at: string | null;
  notes: string | null;
  scroll_progress: number;
  reading_time_minutes: number | null;
  is_dead: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  link_id: string;
  text: string;
  color: string;
  created_at: string;
}

export interface LinkTag {
  id: string;
  link_id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// Supabase Database type shape compatible with @supabase/ssr generics
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      folders: {
        Row: Folder;
        Insert: Omit<Folder, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Folder, "id" | "user_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      links: {
        Row: Link;
        Insert: Omit<Link, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Link, "id" | "user_id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      link_tags: {
        Row: LinkTag;
        Insert: Omit<LinkTag, "id" | "created_at">;
        Update: Partial<Omit<LinkTag, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
