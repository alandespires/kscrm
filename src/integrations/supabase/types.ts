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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "ai_insights_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          id?: string
          lead_id?: string | null
          resultado?: Json | null
          tenant_id: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          resultado?: Json | null
          tenant_id?: string
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
          {
            foreignKeyName: "automation_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
          trigger_tipo?: Database["public"]["Enums"]["automation_trigger"]
          trigger_valor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_commissions: {
        Row: {
          base_valor: number
          competencia: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          descricao: string
          entry_id: string | null
          id: string
          observacoes: string | null
          paga_em: string | null
          percentual: number | null
          status: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          base_valor?: number
          competencia?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          descricao: string
          entry_id?: string | null
          id?: string
          observacoes?: string | null
          paga_em?: string | null
          percentual?: number | null
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          base_valor?: number
          competencia?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          descricao?: string
          entry_id?: string | null
          id?: string
          observacoes?: string | null
          paga_em?: string | null
          percentual?: number | null
          status?: Database["public"]["Enums"]["commission_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          categoria: Database["public"]["Enums"]["financial_entry_category"]
          client_id: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          descricao: string
          forma_pagamento:
            | Database["public"]["Enums"]["financial_payment_method"]
            | null
          id: string
          lead_id: string | null
          observacoes: string | null
          origem: string | null
          recebido_em: string | null
          status: Database["public"]["Enums"]["financial_status"]
          tenant_id: string
          updated_at: string
          valor: number
          valor_pago: number
          vencimento: string | null
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["financial_entry_category"]
          client_id?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          descricao: string
          forma_pagamento?:
            | Database["public"]["Enums"]["financial_payment_method"]
            | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          origem?: string | null
          recebido_em?: string | null
          status?: Database["public"]["Enums"]["financial_status"]
          tenant_id: string
          updated_at?: string
          valor?: number
          valor_pago?: number
          vencimento?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["financial_entry_category"]
          client_id?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          descricao?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["financial_payment_method"]
            | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          origem?: string | null
          recebido_em?: string | null
          status?: Database["public"]["Enums"]["financial_status"]
          tenant_id?: string
          updated_at?: string
          valor?: number
          valor_pago?: number
          vencimento?: string | null
        }
        Relationships: []
      }
      financial_expenses: {
        Row: {
          categoria: Database["public"]["Enums"]["financial_expense_category"]
          created_at: string
          created_by: string
          descricao: string
          forma_pagamento:
            | Database["public"]["Enums"]["financial_payment_method"]
            | null
          fornecedor: string | null
          id: string
          observacoes: string | null
          pago_em: string | null
          recorrente: boolean
          status: Database["public"]["Enums"]["financial_status"]
          tenant_id: string
          updated_at: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["financial_expense_category"]
          created_at?: string
          created_by: string
          descricao: string
          forma_pagamento?:
            | Database["public"]["Enums"]["financial_payment_method"]
            | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["financial_status"]
          tenant_id: string
          updated_at?: string
          valor?: number
          vencimento?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["financial_expense_category"]
          created_at?: string
          created_by?: string
          descricao?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["financial_payment_method"]
            | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["financial_status"]
          tenant_id?: string
          updated_at?: string
          valor?: number
          vencimento?: string | null
        }
        Relationships: []
      }
      financial_payments: {
        Row: {
          created_at: string
          created_by: string
          entry_id: string
          forma_pagamento:
            | Database["public"]["Enums"]["financial_payment_method"]
            | null
          id: string
          observacoes: string | null
          pago_em: string
          tenant_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          created_by: string
          entry_id: string
          forma_pagamento?:
            | Database["public"]["Enums"]["financial_payment_method"]
            | null
          id?: string
          observacoes?: string | null
          pago_em?: string
          tenant_id: string
          valor?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          entry_id?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["financial_payment_method"]
            | null
          id?: string
          observacoes?: string | null
          pago_em?: string
          tenant_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_payments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "financial_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_subscriptions: {
        Row: {
          cancelado_em: string | null
          client_id: string | null
          created_at: string
          created_by: string
          id: string
          inicio: string
          motivo_cancelamento: string | null
          observacoes: string | null
          plano: string
          proximo_vencimento: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          cancelado_em?: string | null
          client_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          inicio?: string
          motivo_cancelamento?: string | null
          observacoes?: string | null
          plano: string
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          cancelado_em?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          inicio?: string
          motivo_cancelamento?: string | null
          observacoes?: string | null
          plano?: string
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      kassia_conversations: {
        Row: {
          created_at: string
          id: string
          tenant_id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tenant_id: string
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kassia_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          tenant_id: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kassia_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "kassia_conversations"
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
          ultimo_contato_em?: string | null
          updated_at?: string
          valor_estimado?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          lida: boolean
          lida_em: string | null
          link: string | null
          metadata: Json | null
          prioridade: Database["public"]["Enums"]["task_priority"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["notification_type"]
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          lida?: boolean
          lida_em?: string | null
          link?: string | null
          metadata?: Json | null
          prioridade?: Database["public"]["Enums"]["task_priority"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["notification_type"]
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          lida?: boolean
          lida_em?: string | null
          link?: string | null
          metadata?: Json | null
          prioridade?: Database["public"]["Enums"]["task_priority"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["notification_type"]
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          ativo: boolean
          created_at: string
          features: Json
          id: string
          max_leads: number | null
          max_usuarios: number | null
          nome: string
          ordem: number
          preco_mensal: number
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          features?: Json
          id?: string
          max_leads?: number | null
          max_usuarios?: number | null
          nome: string
          ordem?: number
          preco_mensal?: number
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          features?: Json
          id?: string
          max_leads?: number | null
          max_usuarios?: number | null
          nome?: string
          ordem?: number
          preco_mensal?: number
          slug?: string
          updated_at?: string
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
      subscriptions: {
        Row: {
          cancelada_em: string | null
          created_at: string
          id: string
          iniciada_em: string
          metadata: Json
          motivo_cancelamento: string | null
          plan_id: string
          proximo_vencimento: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          tenant_id: string
          updated_at: string
          valor: number
        }
        Insert: {
          cancelada_em?: string | null
          created_at?: string
          id?: string
          iniciada_em?: string
          metadata?: Json
          motivo_cancelamento?: string | null
          plan_id: string
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          tenant_id: string
          updated_at?: string
          valor?: number
        }
        Update: {
          cancelada_em?: string | null
          created_at?: string
          id?: string
          iniciada_em?: string
          metadata?: Json
          motivo_cancelamento?: string | null
          plan_id?: string
          proximo_vencimento?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          tenant_id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string
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
          tenant_id: string
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
          tenant_id?: string
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
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          created_by: string | null
          email_principal: string | null
          id: string
          logo_url: string | null
          nome: string
          observacoes: string | null
          plan_id: string | null
          proximo_vencimento: string | null
          responsavel: string | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          trial_ate: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email_principal?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          observacoes?: string | null
          plan_id?: string | null
          proximo_vencimento?: string | null
          responsavel?: string | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          trial_ate?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email_principal?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          observacoes?: string | null
          plan_id?: string | null
          proximo_vencimento?: string | null
          responsavel?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          trial_ate?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
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
      create_tenant_with_owner: {
        Args: {
          _email_principal?: string
          _nome: string
          _responsavel?: string
          _slug: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          email_principal: string | null
          id: string
          logo_url: string | null
          nome: string
          observacoes: string | null
          plan_id: string | null
          proximo_vencimento: string | null
          responsavel: string | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          trial_ate: string | null
          updated_at: string
          whatsapp: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      mark_overdue_financial: { Args: never; Returns: undefined }
      notify_tenant: {
        Args: {
          _descricao?: string
          _link?: string
          _metadata?: Json
          _prioridade?: Database["public"]["Enums"]["task_priority"]
          _tenant_id: string
          _tipo: Database["public"]["Enums"]["notification_type"]
          _titulo: string
        }
        Returns: undefined
      }
      user_tenant_ids: { Args: { _user_id: string }; Returns: string[] }
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
      app_role: "super_admin" | "tenant_admin" | "tenant_user"
      automation_trigger:
        | "lead_criado"
        | "status_mudou"
        | "score_alto"
        | "score_baixou"
      commission_status: "pendente" | "aprovada" | "paga" | "cancelada"
      financial_entry_category:
        | "venda"
        | "assinatura"
        | "servico"
        | "consultoria"
        | "outros"
      financial_expense_category:
        | "salario"
        | "ferramenta"
        | "marketing"
        | "operacao"
        | "imposto"
        | "fornecedor"
        | "comissao"
        | "outros"
      financial_payment_method:
        | "pix"
        | "boleto"
        | "cartao_credito"
        | "cartao_debito"
        | "transferencia"
        | "dinheiro"
        | "outros"
      financial_status: "pendente" | "pago" | "atrasado" | "cancelado"
      lead_status:
        | "novo"
        | "contato_inicial"
        | "qualificacao"
        | "proposta"
        | "negociacao"
        | "fechado"
        | "perdido"
      notification_type:
        | "lead_novo"
        | "lead_quente"
        | "lead_frio"
        | "status_mudou"
        | "tarefa_criada"
        | "tarefa_atrasada"
        | "tarefa_concluida"
        | "financeiro_vencendo"
        | "financeiro_atrasado"
        | "financeiro_recebido"
        | "cliente_novo"
        | "automacao_executada"
        | "insight_ia"
        | "sistema"
      subscription_status:
        | "trial"
        | "ativo"
        | "suspenso"
        | "cancelado"
        | "inadimplente"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      task_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
      tenant_role: "tenant_admin" | "tenant_user"
      tenant_status: "trial" | "ativo" | "suspenso" | "cancelado"
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
      app_role: ["super_admin", "tenant_admin", "tenant_user"],
      automation_trigger: [
        "lead_criado",
        "status_mudou",
        "score_alto",
        "score_baixou",
      ],
      commission_status: ["pendente", "aprovada", "paga", "cancelada"],
      financial_entry_category: [
        "venda",
        "assinatura",
        "servico",
        "consultoria",
        "outros",
      ],
      financial_expense_category: [
        "salario",
        "ferramenta",
        "marketing",
        "operacao",
        "imposto",
        "fornecedor",
        "comissao",
        "outros",
      ],
      financial_payment_method: [
        "pix",
        "boleto",
        "cartao_credito",
        "cartao_debito",
        "transferencia",
        "dinheiro",
        "outros",
      ],
      financial_status: ["pendente", "pago", "atrasado", "cancelado"],
      lead_status: [
        "novo",
        "contato_inicial",
        "qualificacao",
        "proposta",
        "negociacao",
        "fechado",
        "perdido",
      ],
      notification_type: [
        "lead_novo",
        "lead_quente",
        "lead_frio",
        "status_mudou",
        "tarefa_criada",
        "tarefa_atrasada",
        "tarefa_concluida",
        "financeiro_vencendo",
        "financeiro_atrasado",
        "financeiro_recebido",
        "cliente_novo",
        "automacao_executada",
        "insight_ia",
        "sistema",
      ],
      subscription_status: [
        "trial",
        "ativo",
        "suspenso",
        "cancelado",
        "inadimplente",
      ],
      task_priority: ["baixa", "media", "alta", "urgente"],
      task_status: ["pendente", "em_andamento", "concluida", "cancelada"],
      tenant_role: ["tenant_admin", "tenant_user"],
      tenant_status: ["trial", "ativo", "suspenso", "cancelado"],
    },
  },
} as const
