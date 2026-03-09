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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_sessions: {
        Row: {
          createdAt: string | null
          expiresAt: string
          id: string
          ipAddress: string | null
          lastActiveAt: string | null
          token: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string | null
          expiresAt: string
          id?: string
          ipAddress?: string | null
          lastActiveAt?: string | null
          token: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string | null
          expiresAt?: string
          id?: string
          ipAddress?: string | null
          lastActiveAt?: string | null
          token?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_sessions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          createdAt: string
          entityId: string
          entityType: string
          fileName: string
          fileSize: number
          fileType: string
          id: string
          storagePath: string
          uploadedById: string | null
        }
        Insert: {
          createdAt?: string
          entityId: string
          entityType: string
          fileName: string
          fileSize?: number
          fileType?: string
          id?: string
          storagePath: string
          uploadedById?: string | null
        }
        Update: {
          createdAt?: string
          entityId?: string
          entityType?: string
          fileName?: string
          fileSize?: number
          fileType?: string
          id?: string
          storagePath?: string
          uploadedById?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_uploadedById_fkey"
            columns: ["uploadedById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          createdAt: string
          details: string | null
          entity: string
          entityId: string
          id: string
          metadata: Json | null
          userId: string
        }
        Insert: {
          action: string
          createdAt?: string
          details?: string | null
          entity: string
          entityId: string
          id?: string
          metadata?: Json | null
          userId: string
        }
        Update: {
          action?: string
          createdAt?: string
          details?: string | null
          entity?: string
          entityId?: string
          id?: string
          metadata?: Json | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assignedToId: string | null
          createdAt: string
          email: string | null
          expectedValue: number | null
          id: string
          name: string
          notes: string | null
          partnerName: string
          phone: string | null
          probability: number
          source: string | null
          stageId: string
          updatedAt: string
        }
        Insert: {
          assignedToId?: string | null
          createdAt?: string
          email?: string | null
          expectedValue?: number | null
          id?: string
          name: string
          notes?: string | null
          partnerName: string
          phone?: string | null
          probability?: number
          source?: string | null
          stageId: string
          updatedAt?: string
        }
        Update: {
          assignedToId?: string | null
          createdAt?: string
          email?: string | null
          expectedValue?: number | null
          id?: string
          name?: string
          notes?: string | null
          partnerName?: string
          phone?: string | null
          probability?: number
          source?: string | null
          stageId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_assignedToId_fkey"
            columns: ["assignedToId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_stageId_fkey"
            columns: ["stageId"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stages: {
        Row: {
          createdAt: string
          id: string
          name: string
          probability: number
          sequence: number
        }
        Insert: {
          createdAt?: string
          id?: string
          name: string
          probability?: number
          sequence?: number
        }
        Update: {
          createdAt?: string
          id?: string
          name?: string
          probability?: number
          sequence?: number
        }
        Relationships: []
      }
      employees: {
        Row: {
          createdAt: string
          department: string | null
          id: string
          joinDate: string | null
          phone: string | null
          position: string | null
          salary: number | null
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          department?: string | null
          id?: string
          joinDate?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          department?: string | null
          id?: string
          joinDate?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amountTax: number
          amountTotal: number
          amountUntaxed: number
          createdAt: string
          dueDate: string | null
          id: string
          invoiceDate: string | null
          milestoneId: string | null
          name: string
          notes: string | null
          partnerEmail: string | null
          partnerName: string
          projectId: string | null
          state: Database["public"]["Enums"]["InvoiceState"]
          type: Database["public"]["Enums"]["InvoiceType"]
          updatedAt: string
        }
        Insert: {
          amountTax?: number
          amountTotal?: number
          amountUntaxed?: number
          createdAt?: string
          dueDate?: string | null
          id?: string
          invoiceDate?: string | null
          milestoneId?: string | null
          name: string
          notes?: string | null
          partnerEmail?: string | null
          partnerName: string
          projectId?: string | null
          state?: Database["public"]["Enums"]["InvoiceState"]
          type?: Database["public"]["Enums"]["InvoiceType"]
          updatedAt?: string
        }
        Update: {
          amountTax?: number
          amountTotal?: number
          amountUntaxed?: number
          createdAt?: string
          dueDate?: string | null
          id?: string
          invoiceDate?: string | null
          milestoneId?: string | null
          name?: string
          notes?: string | null
          partnerEmail?: string | null
          partnerName?: string
          projectId?: string | null
          state?: Database["public"]["Enums"]["InvoiceState"]
          type?: Database["public"]["Enums"]["InvoiceType"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_milestoneId_fkey"
            columns: ["milestoneId"]
            isOneToOne: false
            referencedRelation: "sale_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          createdAt: string
          id: string
          invoiceId: string
          method: string | null
          note: string | null
          paymentDate: string
        }
        Insert: {
          amount: number
          createdAt?: string
          id?: string
          invoiceId: string
          method?: string | null
          note?: string | null
          paymentDate: string
        }
        Update: {
          amount?: number
          createdAt?: string
          id?: string
          invoiceId?: string
          method?: string | null
          note?: string | null
          paymentDate?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoiceId_fkey"
            columns: ["invoiceId"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          createdAt: string
          endDate: string | null
          id: string
          milestoneId: string | null
          name: string
          projectId: string
          sequence: number
          startDate: string | null
          state: Database["public"]["Enums"]["PhaseState"]
        }
        Insert: {
          createdAt?: string
          endDate?: string | null
          id?: string
          milestoneId?: string | null
          name: string
          projectId: string
          sequence?: number
          startDate?: string | null
          state?: Database["public"]["Enums"]["PhaseState"]
        }
        Update: {
          createdAt?: string
          endDate?: string | null
          id?: string
          milestoneId?: string | null
          name?: string
          projectId?: string
          sequence?: number
          startDate?: string | null
          state?: Database["public"]["Enums"]["PhaseState"]
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_milestoneId_fkey"
            columns: ["milestoneId"]
            isOneToOne: false
            referencedRelation: "sale_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assignedToId: string | null
          createdAt: string
          deadline: string | null
          description: string | null
          estimatedHours: number | null
          id: string
          name: string
          phaseId: string | null
          priority: Database["public"]["Enums"]["Priority"]
          projectId: string
          state: Database["public"]["Enums"]["TaskState"]
          updatedAt: string
        }
        Insert: {
          assignedToId?: string | null
          createdAt?: string
          deadline?: string | null
          description?: string | null
          estimatedHours?: number | null
          id?: string
          name: string
          phaseId?: string | null
          priority?: Database["public"]["Enums"]["Priority"]
          projectId: string
          state?: Database["public"]["Enums"]["TaskState"]
          updatedAt?: string
        }
        Update: {
          assignedToId?: string | null
          createdAt?: string
          deadline?: string | null
          description?: string | null
          estimatedHours?: number | null
          id?: string
          name?: string
          phaseId?: string | null
          priority?: Database["public"]["Enums"]["Priority"]
          projectId?: string
          state?: Database["public"]["Enums"]["TaskState"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assignedToId_fkey"
            columns: ["assignedToId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_phaseId_fkey"
            columns: ["phaseId"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          code: string | null
          createdAt: string
          description: string | null
          endDate: string | null
          id: string
          managerId: string | null
          name: string
          partnerName: string | null
          saleOrderId: string | null
          startDate: string | null
          state: Database["public"]["Enums"]["ProjectState"]
          updatedAt: string
        }
        Insert: {
          budget?: number | null
          code?: string | null
          createdAt?: string
          description?: string | null
          endDate?: string | null
          id?: string
          managerId?: string | null
          name: string
          partnerName?: string | null
          saleOrderId?: string | null
          startDate?: string | null
          state?: Database["public"]["Enums"]["ProjectState"]
          updatedAt?: string
        }
        Update: {
          budget?: number | null
          code?: string | null
          createdAt?: string
          description?: string | null
          endDate?: string | null
          id?: string
          managerId?: string | null
          name?: string
          partnerName?: string | null
          saleOrderId?: string | null
          startDate?: string | null
          state?: Database["public"]["Enums"]["ProjectState"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_managerId_fkey"
            columns: ["managerId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_saleOrderId_fkey"
            columns: ["saleOrderId"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_milestones: {
        Row: {
          amount: number
          dueDate: string | null
          id: string
          name: string
          orderId: string
          percent: number
          sequence: number
          state: Database["public"]["Enums"]["MilestoneState"]
        }
        Insert: {
          amount: number
          dueDate?: string | null
          id?: string
          name: string
          orderId: string
          percent: number
          sequence?: number
          state?: Database["public"]["Enums"]["MilestoneState"]
        }
        Update: {
          amount?: number
          dueDate?: string | null
          id?: string
          name?: string
          orderId?: string
          percent?: number
          sequence?: number
          state?: Database["public"]["Enums"]["MilestoneState"]
        }
        Relationships: [
          {
            foreignKeyName: "sale_milestones_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_order_lines: {
        Row: {
          description: string
          id: string
          orderId: string
          qty: number
          sequence: number
          subtotal: number
          unitPrice: number
        }
        Insert: {
          description: string
          id?: string
          orderId: string
          qty?: number
          sequence?: number
          subtotal: number
          unitPrice: number
        }
        Update: {
          description?: string
          id?: string
          orderId?: string
          qty?: number
          sequence?: number
          subtotal?: number
          unitPrice?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_order_lines_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_orders: {
        Row: {
          approvedAt: string | null
          createdAt: string
          createdById: string | null
          docType: string | null
          id: string
          leadId: string | null
          name: string
          notes: string | null
          partnerEmail: string | null
          partnerName: string
          partnerPhone: string | null
          quotationId: string | null
          rejectedReason: string | null
          revision: number | null
          sentAt: string | null
          signedAt: string | null
          state: Database["public"]["Enums"]["SaleOrderState"]
          totalAmount: number
          updatedAt: string
          validityDate: string | null
        }
        Insert: {
          approvedAt?: string | null
          createdAt?: string
          createdById?: string | null
          docType?: string | null
          id?: string
          leadId?: string | null
          name: string
          notes?: string | null
          partnerEmail?: string | null
          partnerName: string
          partnerPhone?: string | null
          quotationId?: string | null
          rejectedReason?: string | null
          revision?: number | null
          sentAt?: string | null
          signedAt?: string | null
          state?: Database["public"]["Enums"]["SaleOrderState"]
          totalAmount?: number
          updatedAt?: string
          validityDate?: string | null
        }
        Update: {
          approvedAt?: string | null
          createdAt?: string
          createdById?: string | null
          docType?: string | null
          id?: string
          leadId?: string | null
          name?: string
          notes?: string | null
          partnerEmail?: string | null
          partnerName?: string
          partnerPhone?: string | null
          quotationId?: string | null
          rejectedReason?: string | null
          revision?: number | null
          sentAt?: string | null
          signedAt?: string | null
          state?: Database["public"]["Enums"]["SaleOrderState"]
          totalAmount?: number
          updatedAt?: string
          validityDate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_orders_createdById_fkey"
            columns: ["createdById"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_orders_leadId_fkey"
            columns: ["leadId"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_orders_quotationId_fkey"
            columns: ["quotationId"]
            isOneToOne: false
            referencedRelation: "sale_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          id?: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updatedAt: string | null
          value: string
        }
        Insert: {
          key: string
          updatedAt?: string | null
          value: string
        }
        Update: {
          key?: string
          updatedAt?: string | null
          value?: string
        }
        Relationships: []
      }
      timesheets: {
        Row: {
          createdAt: string
          date: string
          description: string | null
          employeeId: string | null
          hours: number
          id: string
          projectId: string
          taskId: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          date: string
          description?: string | null
          employeeId?: string | null
          hours: number
          id?: string
          projectId: string
          taskId?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          date?: string
          description?: string | null
          employeeId?: string | null
          hours?: number
          id?: string
          projectId?: string
          taskId?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_employeeId_fkey"
            columns: ["employeeId"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_taskId_fkey"
            columns: ["taskId"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          createdAt: string
          email: string
          id: string
          isActive: boolean
          name: string | null
          password: string | null
          role: Database["public"]["Enums"]["UserRole"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          id?: string
          isActive?: boolean
          name?: string | null
          password?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
          isActive?: boolean
          name?: string | null
          password?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
        }
        Relationships: []
      }
      verification_tokens: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      InvoiceState: "DRAFT" | "POSTED" | "PAID" | "CANCELLED"
      InvoiceType: "OUT_INVOICE" | "OUT_REFUND"
      MilestoneState: "PENDING" | "INVOICED" | "PAID"
      PhaseState: "TODO" | "IN_PROGRESS" | "DONE"
      Priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
      ProjectState: "DRAFT" | "ACTIVE" | "PAUSED" | "DONE" | "CANCELLED"
      SaleOrderState:
        | "DRAFT"
        | "SENT"
        | "SALE"
        | "DONE"
        | "CANCEL"
        | "APPROVED"
        | "REJECTED"
        | "EXPIRED"
        | "NEGOTIATING"
        | "SIGNED"
      TaskState: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
      UserRole:
        | "DIRECTOR"
        | "PROJECT_MANAGER"
        | "ARCHITECT"
        | "FINANCE"
        | "SALES"
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
      InvoiceState: ["DRAFT", "POSTED", "PAID", "CANCELLED"],
      InvoiceType: ["OUT_INVOICE", "OUT_REFUND"],
      MilestoneState: ["PENDING", "INVOICED", "PAID"],
      PhaseState: ["TODO", "IN_PROGRESS", "DONE"],
      Priority: ["LOW", "NORMAL", "HIGH", "URGENT"],
      ProjectState: ["DRAFT", "ACTIVE", "PAUSED", "DONE", "CANCELLED"],
      SaleOrderState: [
        "DRAFT",
        "SENT",
        "SALE",
        "DONE",
        "CANCEL",
        "APPROVED",
        "REJECTED",
        "EXPIRED",
        "NEGOTIATING",
        "SIGNED",
      ],
      TaskState: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
      UserRole: [
        "DIRECTOR",
        "PROJECT_MANAGER",
        "ARCHITECT",
        "FINANCE",
        "SALES",
      ],
    },
  },
} as const

