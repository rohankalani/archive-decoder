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
      air_quality_thresholds: {
        Row: {
          created_at: string | null
          good_max: number | null
          hazardous_min: number | null
          id: string
          moderate_max: number | null
          region: string | null
          sensor_type: Database["public"]["Enums"]["sensor_type"]
          unhealthy_max: number | null
          unhealthy_sensitive_max: number | null
          unit: string
          updated_at: string | null
          very_unhealthy_max: number | null
        }
        Insert: {
          created_at?: string | null
          good_max?: number | null
          hazardous_min?: number | null
          id?: string
          moderate_max?: number | null
          region?: string | null
          sensor_type: Database["public"]["Enums"]["sensor_type"]
          unhealthy_max?: number | null
          unhealthy_sensitive_max?: number | null
          unit: string
          updated_at?: string | null
          very_unhealthy_max?: number | null
        }
        Update: {
          created_at?: string | null
          good_max?: number | null
          hazardous_min?: number | null
          id?: string
          moderate_max?: number | null
          region?: string | null
          sensor_type?: Database["public"]["Enums"]["sensor_type"]
          unhealthy_max?: number | null
          unhealthy_sensitive_max?: number | null
          unit?: string
          updated_at?: string | null
          very_unhealthy_max?: number | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          sensor_type: Database["public"]["Enums"]["sensor_type"]
          severity: Database["public"]["Enums"]["alert_severity"]
          threshold_value: number
          value: number
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          sensor_type: Database["public"]["Enums"]["sensor_type"]
          severity: Database["public"]["Enums"]["alert_severity"]
          threshold_value: number
          value: number
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          sensor_type?: Database["public"]["Enums"]["sensor_type"]
          severity?: Database["public"]["Enums"]["alert_severity"]
          threshold_value?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          created_at: string | null
          description: string | null
          floor_count: number | null
          id: string
          name: string
          site_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          floor_count?: number | null
          id?: string
          name: string
          site_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          floor_count?: number | null
          id?: string
          name?: string
          site_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          battery_level: number | null
          calibration_due_date: string | null
          created_at: string | null
          device_type: string | null
          firmware_version: string | null
          floor_id: string
          id: string
          installation_date: string | null
          mac_address: string | null
          name: string
          room_id: string | null
          serial_number: string | null
          signal_strength: number | null
          status: Database["public"]["Enums"]["device_status"] | null
          updated_at: string | null
        }
        Insert: {
          battery_level?: number | null
          calibration_due_date?: string | null
          created_at?: string | null
          device_type?: string | null
          firmware_version?: string | null
          floor_id: string
          id?: string
          installation_date?: string | null
          mac_address?: string | null
          name: string
          room_id?: string | null
          serial_number?: string | null
          signal_strength?: number | null
          status?: Database["public"]["Enums"]["device_status"] | null
          updated_at?: string | null
        }
        Update: {
          battery_level?: number | null
          calibration_due_date?: string | null
          created_at?: string | null
          device_type?: string | null
          firmware_version?: string | null
          floor_id?: string
          id?: string
          installation_date?: string | null
          mac_address?: string | null
          name?: string
          room_id?: string | null
          serial_number?: string | null
          signal_strength?: number | null
          status?: Database["public"]["Enums"]["device_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      floors: {
        Row: {
          area_sqm: number | null
          building_id: string
          created_at: string | null
          floor_number: number
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          area_sqm?: number | null
          building_id: string
          created_at?: string | null
          floor_number: number
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          area_sqm?: number | null
          building_id?: string
          created_at?: string | null
          floor_number?: number
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          alert_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          area_sqm: number | null
          capacity: number | null
          created_at: string | null
          description: string | null
          floor_id: string
          id: string
          name: string
          room_number: string | null
          room_type: string | null
          updated_at: string | null
        }
        Insert: {
          area_sqm?: number | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          floor_id: string
          id?: string
          name: string
          room_number?: string | null
          room_type?: string | null
          updated_at?: string | null
        }
        Update: {
          area_sqm?: number | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          floor_id?: string
          id?: string
          name?: string
          room_number?: string | null
          room_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          sensor_type: Database["public"]["Enums"]["sensor_type"]
          timestamp: string | null
          unit: string
          value: number
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          sensor_type: Database["public"]["Enums"]["sensor_type"]
          timestamp?: string | null
          unit: string
          value: number
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          sensor_type?: Database["public"]["Enums"]["sensor_type"]
          timestamp?: string | null
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string
          created_at: string | null
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_ip: {
        Args: { ip_address: unknown }
        Returns: unknown
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_failed_logins: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_latest_sensor_readings_optimized: {
        Args: Record<PropertyKey, never>
        Returns: {
          device_id: string
          device_name: string
          device_status: Database["public"]["Enums"]["device_status"]
          reading_timestamp: string
          sensor_type: Database["public"]["Enums"]["sensor_type"]
          unit: string
          value: number
        }[]
      }
      get_user_highest_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_severity: string
          p_user_id?: string
        }
        Returns: string
      }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      device_status: "online" | "offline" | "maintenance" | "error"
      sensor_type:
        | "temperature"
        | "humidity"
        | "pm25"
        | "pm10"
        | "co2"
        | "no2"
        | "voc"
        | "pm03"
        | "pm05"
        | "pm1"
        | "pm5"
        | "pc03"
        | "pc05"
        | "pc1"
        | "pc25"
        | "pc5"
        | "hcho"
        | "nox"
        | "aqi_overall"
        | "dominant_pollutant"
      user_role: "super_admin" | "admin" | "viewer" | "supervisor"
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
      alert_severity: ["low", "medium", "high", "critical"],
      device_status: ["online", "offline", "maintenance", "error"],
      sensor_type: [
        "temperature",
        "humidity",
        "pm25",
        "pm10",
        "co2",
        "no2",
        "voc",
        "pm03",
        "pm05",
        "pm1",
        "pm5",
        "pc03",
        "pc05",
        "pc1",
        "pc25",
        "pc5",
        "hcho",
        "nox",
        "aqi_overall",
        "dominant_pollutant",
      ],
      user_role: ["super_admin", "admin", "viewer", "supervisor"],
    },
  },
} as const
