// Auto-generate full types with:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
//
// This is a hand-authored stub that satisfies @supabase/postgrest-js's GenericTable
// shape (Row + Insert + Update + Relationships).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          avatar_colour: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          avatar_colour?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          name?: string;
          avatar_colour?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      books: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          price_digital_cents: number;
          price_physical_cents: number;
          page_count: number;
          author_id: string | null;
          is_public: boolean;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          price_digital_cents?: number;
          price_physical_cents?: number;
          page_count?: number;
          author_id?: string | null;
          is_public?: boolean;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          cover_image_url?: string | null;
          price_digital_cents?: number;
          price_physical_cents?: number;
          page_count?: number;
          author_id?: string | null;
          is_public?: boolean;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      pages: {
        Row: {
          id: string;
          book_id: string;
          page_number: number;
          outline_url: string;
          animatable_elements_url: string;
          completion_threshold: number;
          page_title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          page_number: number;
          outline_url?: string;
          animatable_elements_url?: string;
          completion_threshold?: number;
          page_title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          page_number?: number;
          outline_url?: string;
          animatable_elements_url?: string;
          completion_threshold?: number;
          page_title?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pages_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      user_libraries: {
        Row: {
          id: string;
          parent_id: string;
          book_id: string;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          book_id: string;
          purchased_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          book_id?: string;
          purchased_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_libraries_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_libraries_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      user_saved_pages: {
        Row: {
          id: string;
          child_id: string;
          page_id: string;
          coloured_image_url: string | null;
          fill_percentage: number;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          page_id: string;
          coloured_image_url?: string | null;
          fill_percentage?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          page_id?: string;
          coloured_image_url?: string | null;
          fill_percentage?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_saved_pages_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_saved_pages_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
