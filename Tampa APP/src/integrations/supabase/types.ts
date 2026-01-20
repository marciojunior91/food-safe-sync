export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      allergens: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_common: boolean
          name: string
          severity: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_common?: boolean
          name: string
          severity?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_common?: boolean
          name?: string
          severity?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          due_date: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_date: string
          invoice_pdf: string | null
          line_items: Json | null
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          payment_method_details: Json | null
          status: string
          stripe_invoice_id: string
          stripe_payment_intent_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_date: string
          invoice_pdf?: string | null
          line_items?: Json | null
          organization_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          status: string
          stripe_invoice_id: string
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_date?: string
          invoice_pdf?: string | null
          line_items?: Json | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_method_details?: Json | null
          status?: string
          stripe_invoice_id?: string
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_checks: {
        Row: {
          area: string
          check_type: string
          checked_at: string
          checked_by: string
          corrective_action: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string | null
          resolved_at: string | null
          status: string
          temperature_reading: number | null
        }
        Insert: {
          area: string
          check_type: string
          checked_at?: string
          checked_by: string
          corrective_action?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          resolved_at?: string | null
          status?: string
          temperature_reading?: number | null
        }
        Update: {
          area?: string
          check_type?: string
          checked_at?: string
          checked_by?: string
          corrective_action?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          resolved_at?: string | null
          status?: string
          temperature_reading?: number | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_departments_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_attachments: {
        Row: {
          file_name: string
          file_size: number
          file_type: string
          height: number | null
          id: string
          post_id: string
          storage_path: string
          thumbnail_path: string | null
          uploaded_at: string | null
          uploaded_by: string
          width: number | null
        }
        Insert: {
          file_name: string
          file_size: number
          file_type: string
          height?: number | null
          id?: string
          post_id: string
          storage_path: string
          thumbnail_path?: string | null
          uploaded_at?: string | null
          uploaded_by: string
          width?: number | null
        }
        Update: {
          file_name?: string
          file_size?: number
          file_type?: string
          height?: number | null
          id?: string
          post_id?: string
          storage_path?: string
          thumbnail_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "feed_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "feed_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_items: {
        Row: {
          channel: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          organization_id: string
          priority: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          target_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          organization_id: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          target_user_id?: string | null
          title: string
          type: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          organization_id?: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feed_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feed_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feed_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feed_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feed_items_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feed_items_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feed_items_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      feed_mentions: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          mentioned_by_id: string
          mentioned_user_id: string
          post_id: string | null
          read_at: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          mentioned_by_id: string
          mentioned_user_id: string
          post_id?: string | null
          read_at?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          mentioned_by_id?: string
          mentioned_user_id?: string
          post_id?: string | null
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_mentions_mentioned_by_id_fkey"
            columns: ["mentioned_by_id"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "feed_mentions_mentioned_by_id_fkey"
            columns: ["mentioned_by_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "feed_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_id: string
          comment_count: number | null
          content: string
          content_type: string | null
          created_at: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean | null
          organization_id: string
          pinned_at: string | null
          pinned_by: string | null
          reaction_count: number | null
          updated_at: string | null
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          content: string
          content_type?: string | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          organization_id: string
          pinned_at?: string | null
          pinned_by?: string | null
          reaction_count?: number | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          content?: string
          content_type?: string | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          organization_id?: string
          pinned_at?: string | null
          pinned_by?: string | null
          reaction_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "feed_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "feed_posts_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "feed_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reads: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          feed_item_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          feed_item_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          feed_item_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reads_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feed_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feed_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "feed_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      label_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_label_categories_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      label_drafts: {
        Row: {
          created_at: string | null
          draft_name: string
          form_data: Json
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          draft_name: string
          form_data: Json
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          draft_name?: string
          form_data?: Json
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      label_subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_label_subcategories_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "label_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      label_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          zpl_code: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          zpl_code?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          zpl_code?: string | null
        }
        Relationships: []
      }
      measuring_units: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_measuring_units_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          abn: string | null
          acn: string | null
          address: Json | null
          address_city: string | null
          address_country: string | null
          address_postcode: string | null
          address_state: string | null
          address_street: string | null
          business_type: string | null
          created_at: string | null
          email: string | null
          food_safety_registration: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          settings: Json | null
          slug: string | null
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          abn?: string | null
          acn?: string | null
          address?: Json | null
          address_city?: string | null
          address_country?: string | null
          address_postcode?: string | null
          address_state?: string | null
          address_street?: string | null
          business_type?: string | null
          created_at?: string | null
          email?: string | null
          food_safety_registration?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          settings?: Json | null
          slug?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          abn?: string | null
          acn?: string | null
          address?: Json | null
          address_city?: string | null
          address_country?: string | null
          address_postcode?: string | null
          address_state?: string | null
          address_street?: string | null
          business_type?: string | null
          created_at?: string | null
          email?: string | null
          food_safety_registration?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          settings?: Json | null
          slug?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      pin_verification_log: {
        Row: {
          attempted_at: string
          id: string
          ip_address: string | null
          notes: string | null
          team_member_id: string
          unlocked_at: string | null
          unlocked_by: string | null
          user_agent: string | null
          verification_status: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          team_member_id: string
          unlocked_at?: string | null
          unlocked_by?: string | null
          user_agent?: string | null
          verification_status: string
        }
        Update: {
          attempted_at?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          team_member_id?: string
          unlocked_at?: string | null
          unlocked_by?: string | null
          user_agent?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_verification_log_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "pin_verification_log_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pin_verification_log_unlocked_by_fkey"
            columns: ["unlocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pin_verification_log_unlocked_by_fkey"
            columns: ["unlocked_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pin_verification_log_unlocked_by_fkey"
            columns: ["unlocked_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pin_verification_log_unlocked_by_fkey"
            columns: ["unlocked_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      print_queue: {
        Row: {
          allergens: string[] | null
          batch_number: string | null
          category_id: string | null
          condition: string
          created_at: string
          expiry_date: string
          id: string
          notes: string | null
          organization_id: string
          prep_date: string
          prepared_by_name: string
          priority: number | null
          product_id: string | null
          quantity: string | null
          status: string
          template_id: string | null
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergens?: string[] | null
          batch_number?: string | null
          category_id?: string | null
          condition: string
          created_at?: string
          expiry_date: string
          id?: string
          notes?: string | null
          organization_id: string
          prep_date?: string
          prepared_by_name: string
          priority?: number | null
          product_id?: string | null
          quantity?: string | null
          status?: string
          template_id?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergens?: string[] | null
          batch_number?: string | null
          category_id?: string | null
          condition?: string
          created_at?: string
          expiry_date?: string
          id?: string
          notes?: string | null
          organization_id?: string
          prep_date?: string
          prepared_by_name?: string
          priority?: number | null
          product_id?: string | null
          quantity?: string | null
          status?: string
          template_id?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_queue_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "label_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_queue_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "label_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      printed_labels: {
        Row: {
          allergens: string[] | null
          category_id: string | null
          category_name: string | null
          condition: string
          created_at: string | null
          expiry_date: string
          id: string
          organization_id: string
          prep_date: string
          prepared_by: string | null
          prepared_by_name: string | null
          product_id: string | null
          product_name: string
          quantity: string | null
          subcategory_id: string | null
          unit: string | null
        }
        Insert: {
          allergens?: string[] | null
          category_id?: string | null
          category_name?: string | null
          condition: string
          created_at?: string | null
          expiry_date: string
          id?: string
          organization_id?: string
          prep_date: string
          prepared_by?: string | null
          prepared_by_name?: string | null
          product_id?: string | null
          product_name: string
          quantity?: string | null
          subcategory_id?: string | null
          unit?: string | null
        }
        Update: {
          allergens?: string[] | null
          category_id?: string | null
          category_name?: string | null
          condition?: string
          created_at?: string | null
          expiry_date?: string
          id?: string
          organization_id?: string
          prep_date?: string
          prepared_by?: string | null
          prepared_by_name?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: string | null
          subcategory_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_printed_labels_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printed_labels_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "label_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printed_labels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printed_labels_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "label_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_allergens: {
        Row: {
          allergen_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          allergen_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          allergen_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_allergens_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_allergens_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_metrics: {
        Row: {
          actual_time_minutes: number
          created_at: string
          id: string
          notes: string | null
          organization_id: string | null
          planned_time_minutes: number | null
          prep_session_id: string | null
          quality_rating: number | null
          quantity_produced: number
          recipe_id: string | null
          recorded_at: string
          recorded_by: string
          staff_count: number | null
        }
        Insert: {
          actual_time_minutes: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          planned_time_minutes?: number | null
          prep_session_id?: string | null
          quality_rating?: number | null
          quantity_produced: number
          recipe_id?: string | null
          recorded_at?: string
          recorded_by: string
          staff_count?: number | null
        }
        Update: {
          actual_time_minutes?: number
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          planned_time_minutes?: number | null
          prep_session_id?: string | null
          quality_rating?: number | null
          quantity_produced?: number
          recipe_id?: string | null
          recorded_at?: string
          recorded_by?: string
          staff_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_metrics_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          measuring_unit_id: string | null
          name: string
          organization_id: string | null
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          measuring_unit_id?: string | null
          name: string
          organization_id?: string | null
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          measuring_unit_id?: string | null
          name?: string
          organization_id?: string | null
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "label_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_measuring_unit_id_fkey"
            columns: ["measuring_unit_id"]
            isOneToOne: false
            referencedRelation: "measuring_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "label_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: Json | null
          admission_date: string | null
          created_at: string
          date_of_birth: string | null
          department_id: string | null
          display_name: string | null
          email: string | null
          employment_status: string | null
          hire_date: string | null
          id: string
          last_pin_change: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          organization_id: string | null
          phone: string | null
          position: string | null
          profile_completion_percentage: number | null
          tfn_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json | null
          admission_date?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          display_name?: string | null
          email?: string | null
          employment_status?: string | null
          hire_date?: string | null
          id?: string
          last_pin_change?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          profile_completion_percentage?: number | null
          tfn_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json | null
          admission_date?: string | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          display_name?: string | null
          email?: string | null
          employment_status?: string | null
          hire_date?: string | null
          id?: string
          last_pin_change?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          profile_completion_percentage?: number | null
          tfn_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          allergens: string[] | null
          category: string | null
          created_at: string
          created_by: string
          dietary_requirements: string[] | null
          estimated_prep_minutes: number | null
          hold_time_days: number | null
          id: string
          ingredients: Json
          name: string
          organization_id: string | null
          prep_steps: Json
          service_gap_minutes: number | null
          updated_at: string
          updated_by: string | null
          yield_amount: number
          yield_unit: string
        }
        Insert: {
          allergens?: string[] | null
          category?: string | null
          created_at?: string
          created_by: string
          dietary_requirements?: string[] | null
          estimated_prep_minutes?: number | null
          hold_time_days?: number | null
          id?: string
          ingredients?: Json
          name: string
          organization_id?: string | null
          prep_steps?: Json
          service_gap_minutes?: number | null
          updated_at?: string
          updated_by?: string | null
          yield_amount: number
          yield_unit?: string
        }
        Update: {
          allergens?: string[] | null
          category?: string | null
          created_at?: string
          created_by?: string
          dietary_requirements?: string[] | null
          estimated_prep_minutes?: number | null
          hold_time_days?: number | null
          id?: string
          ingredients?: Json
          name?: string
          organization_id?: string | null
          prep_steps?: Json
          service_gap_minutes?: number | null
          updated_at?: string
          updated_by?: string | null
          yield_amount?: number
          yield_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recipes_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_task_assignments: {
        Row: {
          assigned_date: string
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          photo_url: string | null
          started_at: string | null
          status: string | null
          task_id: string
          team_member_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_date: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          started_at?: string | null
          status?: string | null
          task_id: string
          team_member_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_date?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          started_at?: string | null
          status?: string | null
          task_id?: string
          team_member_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "routine_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_task_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "routine_task_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_task_completions: {
        Row: {
          assignment_id: string | null
          checklist_responses: Json | null
          completed_at: string | null
          completed_by: string | null
          id: string
          notes: string | null
          photo_url: string | null
          task_id: string
          team_member_id: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assignment_id?: string | null
          checklist_responses?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          task_id: string
          team_member_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assignment_id?: string | null
          checklist_responses?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          task_id?: string
          team_member_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_task_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "routine_task_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "routine_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_task_completions_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "routine_task_completions_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_task_templates: {
        Row: {
          checklist_items: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_duration_minutes: number | null
          frequency: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          photo_instructions: string | null
          requires_photo: boolean | null
          task_type: string
          updated_at: string | null
        }
        Insert: {
          checklist_items?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          photo_instructions?: string | null
          requires_photo?: boolean | null
          task_type: string
          updated_at?: string | null
        }
        Update: {
          checklist_items?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          photo_instructions?: string | null
          requires_photo?: boolean | null
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_task_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_tasks: {
        Row: {
          actual_minutes: number | null
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          notes: string | null
          organization_id: string
          priority: string | null
          recurrence_pattern: Json | null
          requires_approval: boolean | null
          scheduled_date: string
          scheduled_time: string | null
          skip_reason: string | null
          started_at: string | null
          status: string | null
          subtasks: Json | null
          task_type: string
          team_member_id: string
          template_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_minutes?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          priority?: string | null
          recurrence_pattern?: Json | null
          requires_approval?: boolean | null
          scheduled_date: string
          scheduled_time?: string | null
          skip_reason?: string | null
          started_at?: string | null
          status?: string | null
          subtasks?: Json | null
          task_type: string
          team_member_id: string
          template_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_minutes?: number | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          priority?: string | null
          recurrence_pattern?: Json | null
          requires_approval?: boolean | null
          scheduled_date?: string
          scheduled_time?: string | null
          skip_reason?: string | null
          started_at?: string | null
          status?: string | null
          subtasks?: Json | null
          task_type?: string
          team_member_id?: string
          template_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_tasks_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_tasks_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "routine_tasks_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          organization_id: string | null
          plan_type: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          organization_id?: string | null
          plan_type: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id?: string | null
          plan_type?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity_log: {
        Row: {
          activity_type: string
          created_at: string
          field_name: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          notes: string | null
          old_value: string | null
          organization_id: string
          performed_by: string | null
          performed_by_name: string | null
          task_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          organization_id: string
          performed_by?: string | null
          performed_by_name?: string | null
          task_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          organization_id?: string
          performed_by?: string | null
          performed_by_name?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "routine_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          metadata: Json | null
          task_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          metadata?: Json | null
          task_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          metadata?: Json | null
          task_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "routine_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      task_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          task_type: string
          tasks: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          task_type: string
          tasks?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          task_type?: string
          tasks?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_certificates: {
        Row: {
          certificate_name: string
          certificate_number: string | null
          certificate_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expiration_date: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          issue_date: string | null
          issued_by: string | null
          rejection_reason: string | null
          status: string | null
          team_member_id: string
          updated_at: string | null
          updated_by: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          certificate_name: string
          certificate_number?: string | null
          certificate_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expiration_date?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          team_member_id: string
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          certificate_name?: string
          certificate_number?: string | null
          certificate_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expiration_date?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          rejection_reason?: string | null
          status?: string | null
          team_member_id?: string
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_member_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "pin_security_dashboard"
            referencedColumns: ["team_member_id"]
          },
          {
            foreignKeyName: "team_member_certificates_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_certificates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_certificates_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      team_members: {
        Row: {
          address: string | null
          auth_role_id: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          department_id: string | null
          display_name: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          failed_pin_attempts: number | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          is_locked_out: boolean | null
          last_failed_attempt: string | null
          location_id: string | null
          lockout_until: string | null
          organization_id: string
          phone: string | null
          pin_hash: string | null
          position: string | null
          profile_complete: boolean | null
          required_fields_missing: string[] | null
          role_type: Database["public"]["Enums"]["team_member_role"]
          tfn_number: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          auth_role_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          display_name: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          failed_pin_attempts?: number | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          is_locked_out?: boolean | null
          last_failed_attempt?: string | null
          location_id?: string | null
          lockout_until?: string | null
          organization_id: string
          phone?: string | null
          pin_hash?: string | null
          position?: string | null
          profile_complete?: boolean | null
          required_fields_missing?: string[] | null
          role_type?: Database["public"]["Enums"]["team_member_role"]
          tfn_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          auth_role_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          department_id?: string | null
          display_name?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          failed_pin_attempts?: number | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          is_locked_out?: boolean | null
          last_failed_attempt?: string | null
          location_id?: string | null
          lockout_until?: string | null
          organization_id?: string
          phone?: string | null
          pin_hash?: string | null
          position?: string | null
          profile_complete?: boolean | null
          required_fields_missing?: string[] | null
          role_type?: Database["public"]["Enums"]["team_member_role"]
          tfn_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_auth_role_id_fkey"
            columns: ["auth_role_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_auth_role_id_fkey"
            columns: ["auth_role_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_auth_role_id_fkey"
            columns: ["auth_role_id"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_auth_role_id_fkey"
            columns: ["auth_role_id"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          expiration_date: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          issue_date: string | null
          issuing_organization: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          expiration_date?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          expiration_date?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          personal_message: string | null
          role: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          personal_message?: string | null
          role: string
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          personal_message?: string | null
          role?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pins: {
        Row: {
          created_at: string | null
          failed_attempts: number | null
          id: string
          locked_until: string | null
          pin_hash: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          pin_hash: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          pin_hash?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_email"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_context"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_roles_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_logs: {
        Row: {
          category: string | null
          created_at: string
          estimated_cost: number | null
          id: string
          item_name: string
          logged_at: string
          logged_by: string
          notes: string | null
          organization_id: string | null
          quantity: number
          reason: string
          unit: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          item_name: string
          logged_at?: string
          logged_by: string
          notes?: string | null
          organization_id?: string | null
          quantity: number
          reason: string
          unit: string
        }
        Update: {
          category?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          item_name?: string
          logged_at?: string
          logged_by?: string
          notes?: string | null
          organization_id?: string | null
          quantity?: number
          reason?: string
          unit?: string
        }
        Relationships: []
      }
      zebra_printers: {
        Row: {
          connection_type: string
          created_at: string
          default_darkness: number | null
          default_print_speed: number | null
          enabled: boolean
          id: string
          ip_address: string | null
          is_default: boolean
          label_height_mm: number | null
          label_width_mm: number | null
          last_seen_at: string | null
          model: string
          name: string
          organization_id: string
          port: number | null
          print_density_dpi: number | null
          serial_number: string
          status: string
          updated_at: string
          websocket_port: number | null
        }
        Insert: {
          connection_type?: string
          created_at?: string
          default_darkness?: number | null
          default_print_speed?: number | null
          enabled?: boolean
          id?: string
          ip_address?: string | null
          is_default?: boolean
          label_height_mm?: number | null
          label_width_mm?: number | null
          last_seen_at?: string | null
          model: string
          name: string
          organization_id: string
          port?: number | null
          print_density_dpi?: number | null
          serial_number: string
          status?: string
          updated_at?: string
          websocket_port?: number | null
        }
        Update: {
          connection_type?: string
          created_at?: string
          default_darkness?: number | null
          default_print_speed?: number | null
          enabled?: boolean
          id?: string
          ip_address?: string | null
          is_default?: boolean
          label_height_mm?: number | null
          label_width_mm?: number | null
          last_seen_at?: string | null
          model?: string
          name?: string
          organization_id?: string
          port?: number | null
          print_density_dpi?: number | null
          serial_number?: string
          status?: string
          updated_at?: string
          websocket_port?: number | null
        }
        Relationships: []
      }
      zebra_print_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          job_id: string
          label_data: Json | null
          latency_ms: number | null
          organization_id: string
          printed_at: string
          printer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_id: string
          label_data?: Json | null
          latency_ms?: number | null
          organization_id: string
          printed_at?: string
          printer_id: string
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string
          label_data?: Json | null
          latency_ms?: number | null
          organization_id?: string
          printed_at?: string
          printer_id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      compliance_summary: {
        Row: {
          area: string | null
          check_type: string | null
          date: string | null
          failed_count: number | null
          needs_attention_count: number | null
          organization_id: string | null
          passed_count: number | null
          total_checks: number | null
        }
        Relationships: []
      }
      efficiency_analytics: {
        Row: {
          avg_quality: number | null
          organization_id: string | null
          production_count: number | null
          recipe_category: string | null
          recipe_name: string | null
          time_efficiency_ratio: number | null
          total_produced: number | null
        }
        Relationships: []
      }
      pin_security_dashboard: {
        Row: {
          attempts_last_24h: number | null
          display_name: string | null
          failed_attempts_last_24h: number | null
          failed_pin_attempts: number | null
          is_locked_out: boolean | null
          last_failed_attempt: string | null
          last_successful_login: string | null
          lockout_until: string | null
          organization_id: string | null
          position: string | null
          role_type: Database["public"]["Enums"]["team_member_role"] | null
          team_member_id: string | null
        }
        Insert: {
          attempts_last_24h?: never
          display_name?: string | null
          failed_attempts_last_24h?: never
          failed_pin_attempts?: number | null
          is_locked_out?: boolean | null
          last_failed_attempt?: string | null
          last_successful_login?: never
          lockout_until?: string | null
          organization_id?: string | null
          position?: string | null
          role_type?: Database["public"]["Enums"]["team_member_role"] | null
          team_member_id?: string | null
        }
        Update: {
          attempts_last_24h?: never
          display_name?: string | null
          failed_attempts_last_24h?: never
          failed_pin_attempts?: number | null
          is_locked_out?: boolean | null
          last_failed_attempt?: string | null
          last_successful_login?: never
          lockout_until?: string | null
          organization_id?: string | null
          position?: string | null
          role_type?: Database["public"]["Enums"]["team_member_role"] | null
          team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_with_email: {
        Row: {
          address: Json | null
          admission_date: string | null
          created_at: string | null
          date_of_birth: string | null
          department_id: string | null
          display_name: string | null
          email: string | null
          employment_status: string | null
          hire_date: string | null
          id: string | null
          last_pin_change: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          organization_id: string | null
          phone: string | null
          position: string | null
          profile_completion_percentage: number | null
          tfn_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_context: {
        Row: {
          display_name: string | null
          organization_id: string | null
          organization_name: string | null
          user_id: string | null
          user_role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_primary_roles: {
        Row: {
          display_name: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles_summary: {
        Row: {
          display_name: string | null
          email: string | null
          organization_id: string | null
          role: string | null
          team_member_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_analytics: {
        Row: {
          category: string | null
          date: string | null
          log_count: number | null
          organization_id: string | null
          reason: string | null
          total_cost: number | null
          total_quantity: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_edit_team_member: {
        Args: { target_member_id: string }
        Returns: boolean
      }
      can_manage_categories: { Args: { p_user_id?: string }; Returns: boolean }
      can_manage_subcategories: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      check_duplicate_product: {
        Args: {
          p_category_id: string
          p_exclude_product_id?: string
          p_name: string
          p_organization_id?: string
        }
        Returns: {
          category_name: string
          is_duplicate: boolean
          product_id: string
          product_name: string
          similarity_score: number
        }[]
      }
      cleanup_expired_invitations: { Args: never; Returns: undefined }
      cleanup_old_pin_logs: { Args: never; Returns: number }
      find_similar_products: {
        Args: { min_similarity?: number; org_id: string; search_name: string }
        Returns: {
          allergen_count: number
          category_name: string
          last_printed: string
          product_id: string
          product_name: string
          similarity_score: number
          subcategory_name: string
        }[]
      }
      get_current_org_team_members: {
        Args: never
        Returns: {
          address: string | null
          auth_role_id: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          department_id: string | null
          display_name: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          failed_pin_attempts: number | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          is_locked_out: boolean | null
          last_failed_attempt: string | null
          location_id: string | null
          lockout_until: string | null
          organization_id: string
          phone: string | null
          pin_hash: string | null
          position: string | null
          profile_complete: boolean | null
          required_fields_missing: string[] | null
          role_type: Database["public"]["Enums"]["team_member_role"]
          tfn_number: string | null
          updated_at: string | null
          updated_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "team_members"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_current_user_context: {
        Args: never
        Returns: {
          department_id: string
          display_name: string
          email: string
          organization_id: string
          organization_name: string
          role: string
          user_id: string
        }[]
      }
      get_duplicate_stats: {
        Args: { org_id: string }
        Returns: {
          duplicate_groups: Json
          potential_duplicates: number
          total_products: number
        }[]
      }
      get_locked_out_team_members: {
        Args: { _organization_id: string }
        Returns: {
          display_name: string
          failed_attempts: number
          is_permanent_lockout: boolean
          last_failed_attempt: string
          lockout_until: string
          position: string
          team_member_id: string
        }[]
      }
      get_plan_limits: {
        Args: { org_id: string }
        Returns: {
          has_api_access: boolean
          has_feed: boolean
          has_knowledge_base: boolean
          has_training_center: boolean
          max_locations: number
          max_users: number
        }[]
      }
      get_product_allergens: {
        Args: { p_product_id: string }
        Returns: {
          icon: string
          id: string
          is_common: boolean
          name: string
          severity: string
        }[]
      }
      get_product_full_details: {
        Args: { p_product_id: string }
        Returns: Json
      }
      get_recent_failed_attempts: {
        Args: { _hours_back?: number; _team_member_id: string }
        Returns: {
          attempted_at: string
          ip_address: string
          user_agent: string
        }[]
      }
      get_subtasks_completion_percentage: {
        Args: { task_id: string }
        Returns: number
      }
      get_task_activity: {
        Args: { p_limit?: number; p_task_id: string }
        Returns: {
          activity_type: string
          created_at: string
          field_name: string
          id: string
          new_value: string
          notes: string
          old_value: string
          performed_by_name: string
        }[]
      }
      get_user_email: { Args: { user_uuid: string }; Returns: string }
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      get_user_organization_id: { Args: never; Returns: string }
      get_user_plan_limits: {
        Args: { p_user_id: string }
        Returns: {
          has_allergen_management: boolean
          has_api_access: boolean
          has_cost_control: boolean
          has_nutritional_calculator: boolean
          has_priority_support: boolean
          max_products: number
          max_recipes: number
          max_suppliers: number
          max_team_members: number
          plan_type: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_simple: {
        Args: { user_id_param: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_subscription: {
        Args: { p_user_id: string }
        Returns: {
          current_period_end: string
          has_organization: boolean
          id: string
          organization_id: string
          plan_type: string
          status: string
          trial_end: string
        }[]
      }
      has_active_subscription: { Args: { org_id: string }; Returns: boolean }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_critical_allergens: {
        Args: { p_product_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_channel_member: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      is_duplicate_product: {
        Args: { check_name: string; exclude_id?: string; org_id: string }
        Returns: boolean
      }
      is_organization_admin: { Args: never; Returns: boolean }
      is_organization_manager: { Args: never; Returns: boolean }
      is_team_member_locked_out: {
        Args: { _team_member_id: string }
        Returns: boolean
      }
      is_user_admin: { Args: never; Returns: boolean }
      is_user_manager_or_admin: { Args: never; Returns: boolean }
      link_subscription_to_organization: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      log_pin_verification: {
        Args: {
          _ip_address?: string
          _team_member_id: string
          _user_agent?: string
          _verification_status: string
        }
        Returns: undefined
      }
      merge_products: {
        Args: {
          org_id: string
          source_product_id: string
          target_product_id: string
        }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      suggest_existing_products: {
        Args: {
          p_limit?: number
          p_organization_id?: string
          p_partial_name: string
        }
        Returns: {
          category_name: string
          product_id: string
          product_name: string
          similarity_score: number
          subcategory_name: string
        }[]
      }
      unlock_team_member: {
        Args: { _manager_notes?: string; _team_member_id: string }
        Returns: boolean
      }
      user_has_active_subscription: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      validate_routine_task_team_member: {
        Args: { task_id_param: string; team_member_id_param: string }
        Returns: boolean
      }
      validate_user_relationships: {
        Args: never
        Returns: {
          details: string
          issue_type: string
          user_id: string
        }[]
      }
      verify_team_member_pin: {
        Args: { member_id: string; pin_input: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "leader_chef"
        | "staff"
        | "owner"
        | "cook"
        | "barista"
      team_member_role: "cook" | "barista" | "manager" | "leader_chef" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "manager",
        "leader_chef",
        "staff",
        "owner",
        "cook",
        "barista",
      ],
      team_member_role: ["cook", "barista", "manager", "leader_chef", "admin"],
    },
  },
} as const
