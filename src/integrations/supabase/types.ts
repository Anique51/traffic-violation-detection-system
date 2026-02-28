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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      camera_feeds: {
        Row: {
          camera_location_id: string
          created_at: string | null
          description: string | null
          feed_url: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          camera_location_id: string
          created_at?: string | null
          description?: string | null
          feed_url: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          camera_location_id?: string
          created_at?: string | null
          description?: string | null
          feed_url?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_feeds_camera_location_id_fkey"
            columns: ["camera_location_id"]
            isOneToOne: false
            referencedRelation: "camera_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_locations: {
        Row: {
          id: string
          last_active: string | null
          latitude: number
          location_name: string
          longitude: number
          status: string | null
          violation_count: number | null
        }
        Insert: {
          id?: string
          last_active?: string | null
          latitude: number
          location_name: string
          longitude: number
          status?: string | null
          violation_count?: number | null
        }
        Update: {
          id?: string
          last_active?: string | null
          latitude?: number
          location_name?: string
          longitude?: number
          status?: string | null
          violation_count?: number | null
        }
        Relationships: []
      }
      custom_violations: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          image_url: string | null
          location: string
          remarks: string | null
          vehicle_number: string
          violation_type: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          image_url?: string | null
          location: string
          remarks?: string | null
          vehicle_number: string
          violation_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          image_url?: string | null
          location?: string
          remarks?: string | null
          vehicle_number?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_violations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          created_by: string
          end_date: string
          file_url: string | null
          id: string
          report_type: string
          start_date: string
          total_fines: number | null
          total_violations: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          end_date: string
          file_url?: string | null
          id?: string
          report_type: string
          start_date: string
          total_fines?: number | null
          total_violations?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          end_date?: string
          file_url?: string | null
          id?: string
          report_type?: string
          start_date?: string
          total_fines?: number | null
          total_violations?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_owners: {
        Row: {
          address: string | null
          chassis_no: string | null
          city: string | null
          created_at: string | null
          email: string
          engine_no: string | null
          father_name: string | null
          first_name: string
          last_name: string
          middle_name: string | null
          phone_number: string | null
          registration_no: string
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_make_year: number | null
        }
        Insert: {
          address?: string | null
          chassis_no?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          engine_no?: string | null
          father_name?: string | null
          first_name: string
          last_name: string
          middle_name?: string | null
          phone_number?: string | null
          registration_no: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_make_year?: number | null
        }
        Update: {
          address?: string | null
          chassis_no?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          engine_no?: string | null
          father_name?: string | null
          first_name?: string
          last_name?: string
          middle_name?: string | null
          phone_number?: string | null
          registration_no?: string
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_make_year?: number | null
        }
        Relationships: []
      }
      vehicle_penalty_summary: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          month: string
          total_penalty_points: number
          vehicle_number: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          month: string
          total_penalty_points?: number
          vehicle_number: string
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          month?: string
          total_penalty_points?: number
          vehicle_number?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string | null
          id: string
          license_points: number | null
          number_plate: string
          owner_contact: string | null
          owner_name: string | null
          total_fines: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          license_points?: number | null
          number_plate: string
          owner_contact?: string | null
          owner_name?: string | null
          total_fines?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          license_points?: number | null
          number_plate?: string
          owner_contact?: string | null
          owner_name?: string | null
          total_fines?: number | null
        }
        Relationships: []
      }
      violation_types: {
        Row: {
          created_at: string | null
          default_fine: number
          description: string | null
          id: string
          name: string
          penalty_points: number
        }
        Insert: {
          created_at?: string | null
          default_fine: number
          description?: string | null
          id?: string
          name: string
          penalty_points?: number
        }
        Update: {
          created_at?: string | null
          default_fine?: number
          description?: string | null
          id?: string
          name?: string
          penalty_points?: number
        }
        Relationships: []
      }
      violations: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          due_date: string | null
          email_status: string | null
          fine_amount: number
          id: string
          image_url: string | null
          location: string
          officer_id: string | null
          penalty_points: number
          status: string | null
          ticket_no: string | null
          timestamp: string | null
          vehicle_number: string
          video_url: string | null
          violation_type: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          email_status?: string | null
          fine_amount: number
          id?: string
          image_url?: string | null
          location: string
          officer_id?: string | null
          penalty_points?: number
          status?: string | null
          ticket_no?: string | null
          timestamp?: string | null
          vehicle_number: string
          video_url?: string | null
          violation_type: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          email_status?: string | null
          fine_amount?: number
          id?: string
          image_url?: string | null
          location?: string
          officer_id?: string | null
          penalty_points?: number
          status?: string | null
          ticket_no?: string | null
          timestamp?: string | null
          vehicle_number?: string
          video_url?: string | null
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "violations_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_ticket_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "officer"
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
      app_role: ["admin", "officer"],
    },
  },
} as const
