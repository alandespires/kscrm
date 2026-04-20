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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          client_id: string | null
          created_at: string
          descricao: string
          id: string
          lead_id: string | null
          metadata: Json | null
          tipo: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          tipo: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          tipo?: Database["public"]["Enums"]["activity_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          lead_id: string | null
          lido: boolean | null
          prioridade: Database["public"]["Enums"]["task_priority"] | null
          tipo: string
          titulo: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          id?: string
          lead_id?: string | null
          lido?: boolean | null
          prioridade?: Database["public"]["Enums"]["task_priority"] | null
          tipo: string
          titulo: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          lido?: boolean | null
          prioridade?: Database["public"]["Enums"]["task_priority"] | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          automation_id: string
          created_at: string
          id: string
          lead_id: string | null
          resultado: Json | null
        }
        Insert: {
          automation_id: string
          created_at?: string
          id?: string
          lead_id?: string | null
          resultado?: Json | null
        }
        Update: {
          automation_id?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          resultado?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          acoes: Json
          ativo: boolean
          created_at: string
          created_by: string
          descricao: string | null
          execucoes: number
          id: string
          nome: string
          trigger_tipo: Database["public"]["Enums"]["automation_trigger"]
          trigger_valor: string | null
          updated_at: string
        }
        Insert: {
          acoes?: Json
          ativo?: boolean
          created_at?: string
          created_by: string
          descricao?: string | null
          execucoes?: number
          id?: string
          nome: string
          trigger_tipo: Database["public"]["Enums"]["automation_trigger"]
          trigger_valor?: string | null
          updated_at?: string
        }
        Update: {
          acoes?: Json
          ativo?: boolean
          created_at?: string
          created_by?: string
          descricao?: string | null
          execucoes?: number
          id?: string
          nome?: string
          trigger_tipo?: Database["public"]["Enums"]["automation_trigger"]
          trigger_valor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          contrato_inicio: string | null
          contrato_valor: number | null
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          lead_id: string | null
          nome: string
          observacoes: string | null
          owner_id: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          contrato_inicio?: string | null
          contrato_valor?: number | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          lead_id?: string | null
          nome: string
          observacoes?: string | null
          owner_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          contrato_inicio?: string | null
          contrato_valor?: number | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          lead_id?: string | null
          nome?: string
          observacoes?: string | null
          owner_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          created_at: string
          fechado_em: string | null
          id: string
          lead_id: string | null
          motivo_perda: string | null
          owner_id: string | null
          probabilidade: number | null
          stage: Database["public"]["Enums"]["lead_status"]
          titulo: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          fechado_em?: string | null
          id?: string
          lead_id?: string | null
          motivo_perda?: string | null
          owner_id?: string | null
          probabilidade?: number | null
          stage?: Database["public"]["Enums"]["lead_status"]
          titulo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          created_at?: string
          fechado_em?: string | null
          id?: string
          lead_id?: string | null
          motivo_perda?: string | null
          owner_id?: string | null
          probabilidade?: number | null
          stage?: Database["public"]["Enums"]["lead_status"]
          titulo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_resumo: string | null
          ai_score: number | null
          ai_sugestao: string | null
          created_at: string
          created_by: string
          email: string | null
          empresa: string | null
          id: string
          interesse: string | null
          nome: string
          observacoes: string | null
          origem: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          ultimo_contato_em: string | null
          updated_at: string
          valor_estimado: number | null
          whatsapp: string | null
        }
        Insert: {
          ai_resumo?: string | null
          ai_score?: number | null
          ai_sugestao?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          empresa?: string | null
          id?: string
          interesse?: string | null
          nome: string
          observacoes?: string | null
          origem?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          ultimo_contato_em?: string | null
          updated_at?: string
          valor_estimado?: number | null
          whatsapp?: string | null
        }
        Update: {
          ai_resumo?: string | null
          ai_score?: number | null
          ai_sugestao?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          empresa?: string | null
          id?: string
          interesse?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          ultimo_contato_em?: string | null
          updated_at?: string
          valor_estimado?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          client_id: string | null
          concluida_em: string | null
          created_at: string
          created_by: string
          descricao: string | null
          id: string
          lead_id: string | null
          prazo: string | null
          prioridade: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          client_id?: string | null
          concluida_em?: string | null
          created_at?: string
          created_by: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          client_id?: string | null
          concluida_em?: string | null
          created_at?: string
          created_by?: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_automations: {
        Args: {
          _lead: Database["public"]["Tables"]["leads"]["Row"]
          _trigger: Database["public"]["Enums"]["automation_trigger"]
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "ligacao"
        | "email"
        | "whatsapp"
        | "reuniao"
        | "nota"
        | "movimentacao"
        | "tarefa"
      app_role: "admin" | "gerente" | "vendedor"
      automation_trigger:
        | "lead_criado"
        | "status_mudou"
        | "score_alto"
        | "score_baixou"
      lead_status:
        | "novo"
        | "contato_inicial"
        | "qualificacao"
        | "proposta"
        | "negociacao"
        | "fechado"
        | "perdido"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      task_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
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
      activity_type: [
        "ligacao",
        "email",
        "whatsapp",
        "reuniao",
        "nota",
        "movimentacao",
        "tarefa",
      ],
      app_role: ["admin", "gerente", "vendedor"],
      automation_trigger: [
        "lead_criado",
        "status_mudou",
        "score_alto",
        "score_baixou",
      ],
      lead_status: [
        "novo",
        "contato_inicial",
        "qualificacao",
        "proposta",
        "negociacao",
        "fechado",
        "perdido",
      ],
      task_priority: ["baixa", "media", "alta", "urgente"],
      task_status: ["pendente", "em_andamento", "concluida", "cancelada"],
    },
  },
} as const
