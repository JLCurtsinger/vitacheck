export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      experiences: {
        Row: {
          contributing_factors: string | null
          created_at: string
          description: string
          downvotes: number
          id: string
          medication_name: string
          sentiment: string
          upvotes: number
        }
        Insert: {
          contributing_factors?: string | null
          created_at?: string
          description: string
          downvotes?: number
          id?: string
          medication_name: string
          sentiment?: string
          upvotes?: number
        }
        Update: {
          contributing_factors?: string | null
          created_at?: string
          description?: string
          downvotes?: number
          id?: string
          medication_name?: string
          sentiment?: string
          upvotes?: number
        }
        Relationships: []
      }
      interactions: {
        Row: {
          api_responses: Json | null
          confidence_level: number | null
          first_detected: string
          flagged_by_user: boolean | null
          id: string
          interaction_detected: boolean
          last_checked: string
          notes: string | null
          risk_score: number | null
          severity: string | null
          sources: string[] | null
          substance_a_id: string
          substance_b_id: string
          updated_at: string
        }
        Insert: {
          api_responses?: Json | null
          confidence_level?: number | null
          first_detected?: string
          flagged_by_user?: boolean | null
          id?: string
          interaction_detected?: boolean
          last_checked?: string
          notes?: string | null
          risk_score?: number | null
          severity?: string | null
          sources?: string[] | null
          substance_a_id: string
          substance_b_id: string
          updated_at?: string
        }
        Update: {
          api_responses?: Json | null
          confidence_level?: number | null
          first_detected?: string
          flagged_by_user?: boolean | null
          id?: string
          interaction_detected?: boolean
          last_checked?: string
          notes?: string | null
          risk_score?: number | null
          severity?: string | null
          sources?: string[] | null
          substance_a_id?: string
          substance_b_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_substance_a_id_fkey"
            columns: ["substance_a_id"]
            isOneToOne: false
            referencedRelation: "substances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_substance_b_id_fkey"
            columns: ["substance_b_id"]
            isOneToOne: false
            referencedRelation: "substances"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_names: {
        Row: {
          created_at: string | null
          id: string
          name: string
          rxcui: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          rxcui: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          rxcui?: string
        }
        Relationships: []
      }
      ml_models: {
        Row: {
          created_at: string
          id: string
          model_data: Json
          model_name: string
          model_version: string
          sample_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_data: Json
          model_name: string
          model_version: string
          sample_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          model_data?: Json
          model_name?: string
          model_version?: string
          sample_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      ml_risk_predictions: {
        Row: {
          actual_risk: string | null
          created_at: string
          features: Json
          feedback: string | null
          id: string
          medications: string[]
          model_version: string
          predicted_risk: string
          score: number
        }
        Insert: {
          actual_risk?: string | null
          created_at?: string
          features: Json
          feedback?: string | null
          id?: string
          medications: string[]
          model_version: string
          predicted_risk: string
          score: number
        }
        Update: {
          actual_risk?: string | null
          created_at?: string
          features?: Json
          feedback?: string | null
          id?: string
          medications?: string[]
          model_version?: string
          predicted_risk?: string
          score?: number
        }
        Relationships: []
      }
      nutrient_depletions: {
        Row: {
          created_at: string
          depleted_nutrient: string
          id: string
          medication_name: string
          source: string
          substance_id: string | null
        }
        Insert: {
          created_at?: string
          depleted_nutrient: string
          id?: string
          medication_name: string
          source: string
          substance_id?: string | null
        }
        Update: {
          created_at?: string
          depleted_nutrient?: string
          id?: string
          medication_name?: string
          source?: string
          substance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrient_depletions_substance_id_fkey"
            columns: ["substance_id"]
            isOneToOne: false
            referencedRelation: "substances"
            referencedColumns: ["id"]
          },
        ]
      }
      substances: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          name: string
          origin: Database["public"]["Enums"]["substance_origin"]
          rxcui: string | null
          type: Database["public"]["Enums"]["substance_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          name: string
          origin: Database["public"]["Enums"]["substance_origin"]
          rxcui?: string | null
          type: Database["public"]["Enums"]["substance_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          origin?: Database["public"]["Enums"]["substance_origin"]
          rxcui?: string | null
          type?: Database["public"]["Enums"]["substance_type"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      substance_experiences: {
        Row: {
          created_at: string | null
          description: string | null
          downvotes: number | null
          id: string | null
          medication_name: string | null
          upvotes: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          downvotes?: number | null
          id?: string | null
          medication_name?: string | null
          upvotes?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          downvotes?: number | null
          id?: string | null
          medication_name?: string | null
          upvotes?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      substance_origin: "RxNorm" | "SUPP.AI" | "openFDA" | "Erowid" | "User"
      substance_type: "medication" | "supplement"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      substance_origin: ["RxNorm", "SUPP.AI", "openFDA", "Erowid", "User"],
      substance_type: ["medication", "supplement"],
    },
  },
} as const
