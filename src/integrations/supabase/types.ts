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
          created_at: string
          description: string
          downvotes: number
          id: string
          medication_name: string
          sentiment: string
          upvotes: number
        }
        Insert: {
          created_at?: string
          description: string
          downvotes?: number
          id?: string
          medication_name: string
          sentiment?: string
          upvotes?: number
        }
        Update: {
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
            referencedRelation: "substance_experiences"
            referencedColumns: ["substance_id"]
          },
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
            referencedRelation: "substance_experiences"
            referencedColumns: ["substance_id"]
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
            referencedRelation: "substance_experiences"
            referencedColumns: ["substance_id"]
          },
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
          sentiment: string | null
          substance_id: string | null
          upvotes: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
