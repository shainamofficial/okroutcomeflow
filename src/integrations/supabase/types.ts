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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      automations: {
        Row: {
          action_config: Json
          action_type: Database["public"]["Enums"]["automation_action"]
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          name: string
          organization_id: string
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
        }
        Insert: {
          action_config?: Json
          action_type: Database["public"]["Enums"]["automation_action"]
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          name: string
          organization_id: string
          trigger_config?: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
        }
        Update: {
          action_config?: Json
          action_type?: Database["public"]["Enums"]["automation_action"]
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          name?: string
          organization_id?: string
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["automation_trigger"]
        }
        Relationships: [
          {
            foreignKeyName: "automations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          created_by: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          field_type: Database["public"]["Enums"]["custom_field_type"]
          id: string
          name: string
          options: Json | null
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          field_type: Database["public"]["Enums"]["custom_field_type"]
          id?: string
          name: string
          options?: Json | null
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          field_type?: Database["public"]["Enums"]["custom_field_type"]
          id?: string
          name?: string
          options?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          field_definition_id: string
          id: string
          updated_at: string
          value: Json
        }
        Insert: {
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          field_definition_id: string
          id?: string
          updated_at?: string
          value?: Json
        }
        Update: {
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          field_definition_id?: string
          id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      file_attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          file_name: string
          file_size: number
          file_type: string | null
          id: string
          organization_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          file_name: string
          file_size?: number
          file_type?: string | null
          id?: string
          organization_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          file_name?: string
          file_size?: number
          file_type?: string | null
          id?: string
          organization_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      generic_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
        }
        Relationships: []
      }
      initiative_kr_links: {
        Row: {
          created_at: string
          id: string
          initiative_id: string
          key_result_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          initiative_id: string
          key_result_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          initiative_id?: string
          key_result_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "initiative_kr_links_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_kr_links_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      initiatives: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          organization_id: string
          owner_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["initiative_status"]
          title: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          organization_id: string
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["initiative_status"]
          title: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          organization_id?: string
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["initiative_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          objective_id: string | null
          organization_id: string
          owner_id: string | null
          parent_kr_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          objective_id?: string | null
          organization_id: string
          owner_id?: string | null
          parent_kr_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          objective_id?: string | null
          organization_id?: string
          owner_id?: string | null
          parent_kr_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_parent_kr_id_fkey"
            columns: ["parent_kr_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      kr_metric_config: {
        Row: {
          direction: Database["public"]["Enums"]["metric_direction"]
          end_date: string
          id: string
          key_result_id: string
          metric_name: string
          start_date: string
          start_value: number
          target_value: number
          unit: string
        }
        Insert: {
          direction: Database["public"]["Enums"]["metric_direction"]
          end_date: string
          id?: string
          key_result_id: string
          metric_name: string
          start_date: string
          start_value: number
          target_value: number
          unit: string
        }
        Update: {
          direction?: Database["public"]["Enums"]["metric_direction"]
          end_date?: string
          id?: string
          key_result_id?: string
          metric_name?: string
          start_date?: string
          start_value?: number
          target_value?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "kr_metric_config_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: true
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      kr_metric_values: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          kr_metric_config_id: string
          value: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          kr_metric_config_id: string
          value: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          kr_metric_config_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kr_metric_values_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kr_metric_values_kr_metric_config_id_fkey"
            columns: ["kr_metric_config_id"]
            isOneToOne: false
            referencedRelation: "kr_metric_config"
            referencedColumns: ["id"]
          },
        ]
      }
      kr_review_cadence: {
        Row: {
          created_at: string
          day_of_week: number | null
          frequency: Database["public"]["Enums"]["review_frequency"]
          id: string
          key_result_id: string
          next_review_date: string
          time: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          frequency: Database["public"]["Enums"]["review_frequency"]
          id?: string
          key_result_id: string
          next_review_date: string
          time?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          frequency?: Database["public"]["Enums"]["review_frequency"]
          id?: string
          key_result_id?: string
          next_review_date?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "kr_review_cadence_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: true
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      kr_review_participants: {
        Row: {
          id: string
          review_session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          review_session_id: string
          user_id: string
        }
        Update: {
          id?: string
          review_session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kr_review_participants_review_session_id_fkey"
            columns: ["review_session_id"]
            isOneToOne: false
            referencedRelation: "kr_review_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kr_review_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      kr_review_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          key_result_id: string
          notes: string | null
          review_date: string
          status: Database["public"]["Enums"]["review_session_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          key_result_id: string
          notes?: string | null
          review_date: string
          status?: Database["public"]["Enums"]["review_session_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          key_result_id?: string
          notes?: string | null
          review_date?: string
          status?: Database["public"]["Enums"]["review_session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "kr_review_sessions_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["entity_type"] | null
          id: string
          message: string
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"] | null
          id?: string
          message: string
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"] | null
          id?: string
          message?: string
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          organization_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          organization_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          organization_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "organization_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      task_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_team_id: string | null
          assignee_user_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          initiative_id: string
          parent_task_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Insert: {
          assignee_team_id?: string | null
          assignee_user_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          initiative_id: string
          parent_task_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Update: {
          assignee_team_id?: string | null
          assignee_user_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          initiative_id?: string
          parent_task_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_team_id_fkey"
            columns: ["assignee_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      update_mentions: {
        Row: {
          id: string
          mentioned_user_id: string
          update_id: string
        }
        Insert: {
          id?: string
          mentioned_user_id: string
          update_id: string
        }
        Update: {
          id?: string
          mentioned_user_id?: string
          update_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "update_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "update_mentions_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "updates"
            referencedColumns: ["id"]
          },
        ]
      }
      update_reactions: {
        Row: {
          id: string
          reaction_type: string
          update_id: string
          user_id: string
        }
        Insert: {
          id?: string
          reaction_type: string
          update_id: string
          user_id: string
        }
        Update: {
          id?: string
          reaction_type?: string
          update_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "update_reactions_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "update_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      updates: {
        Row: {
          content: string
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          organization_id: string
          pinned: boolean
          update_kind: Database["public"]["Enums"]["update_kind"]
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          organization_id: string
          pinned?: boolean
          update_kind: Database["public"]["Enums"]["update_kind"]
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          organization_id?: string
          pinned?: boolean
          update_kind?: Database["public"]["Enums"]["update_kind"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "updates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string | null
          token_hash: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string | null
          token_hash?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string | null
          token_hash?: string | null
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users_profile: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          organization_id: string | null
          status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
        }
        Relationships: [
          {
            foreignKeyName: "users_profile_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_invitations_safe: {
        Row: {
          created_at: string | null
          email: string | null
          expires_at: string | null
          id: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          status: Database["public"]["Enums"]["invitation_status"] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
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
    }
    Functions: {
      accept_invitation: {
        Args: { _invitation_token: string; _name: string; _user_id: string }
        Returns: boolean
      }
      can_manage_entity: {
        Args: {
          _entity_id: string
          _entity_type: Database["public"]["Enums"]["entity_type"]
          _user_id: string
        }
        Returns: boolean
      }
      can_manage_initiative: {
        Args: { _initiative_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_kr: {
        Args: { _kr_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_task: {
        Args: { _task_id: string; _user_id: string }
        Returns: boolean
      }
      count_org_admins: { Args: { _org_id: string }; Returns: number }
      count_platform_admins: { Args: never; Returns: number }
      domain_exists_for_other_org: {
        Args: { _domain: string; _org_id: string }
        Returns: boolean
      }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          email: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
        }[]
      }
      get_org_id_from_metric_config: {
        Args: { _config_id: string }
        Returns: string
      }
      get_org_id_from_notification: {
        Args: { _notification_id: string }
        Returns: string
      }
      get_org_id_from_task: { Args: { _task_id: string }; Returns: string }
      get_org_id_from_update: { Args: { _update_id: string }; Returns: string }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_generic_domain: { Args: { _domain: string }; Returns: boolean }
      is_last_admin: { Args: { _user_id: string }; Returns: boolean }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "contributor" | "viewer"
      automation_action:
        | "change_initiative_status"
        | "change_task_status"
        | "send_notification"
        | "create_update"
      automation_trigger:
        | "task_status_change"
        | "all_tasks_done"
        | "initiative_status_change"
        | "due_date_passed"
      custom_field_type:
        | "text"
        | "number"
        | "select"
        | "multi_select"
        | "date"
        | "checkbox"
      entity_type: "kr" | "initiative" | "task"
      initiative_status: "not_started" | "in_progress" | "completed" | "blocked"
      invitation_status: "pending" | "accepted" | "revoked"
      metric_direction: "increase" | "decrease" | "maintain"
      notification_type:
        | "mention"
        | "review_reminder"
        | "task_assigned"
        | "task_overdue"
      review_frequency: "weekly" | "biweekly" | "monthly" | "quarterly"
      review_session_status: "scheduled" | "completed" | "cancelled"
      task_status: "todo" | "in_progress" | "blocked" | "done"
      update_kind: "comment" | "progress" | "blocker" | "decision"
      user_status: "pending" | "active" | "inactive"
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
      app_role: ["admin", "manager", "contributor", "viewer"],
      automation_action: [
        "change_initiative_status",
        "change_task_status",
        "send_notification",
        "create_update",
      ],
      automation_trigger: [
        "task_status_change",
        "all_tasks_done",
        "initiative_status_change",
        "due_date_passed",
      ],
      custom_field_type: [
        "text",
        "number",
        "select",
        "multi_select",
        "date",
        "checkbox",
      ],
      entity_type: ["kr", "initiative", "task"],
      initiative_status: ["not_started", "in_progress", "completed", "blocked"],
      invitation_status: ["pending", "accepted", "revoked"],
      metric_direction: ["increase", "decrease", "maintain"],
      notification_type: [
        "mention",
        "review_reminder",
        "task_assigned",
        "task_overdue",
      ],
      review_frequency: ["weekly", "biweekly", "monthly", "quarterly"],
      review_session_status: ["scheduled", "completed", "cancelled"],
      task_status: ["todo", "in_progress", "blocked", "done"],
      update_kind: ["comment", "progress", "blocker", "decision"],
      user_status: ["pending", "active", "inactive"],
    },
  },
} as const
