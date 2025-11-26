export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
          total_purchases: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
          total_purchases?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
          total_purchases?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          base_unit: string
          category: string
          cost: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_archived: boolean
          is_variable_price: boolean | null
          low_stock_threshold: number
          name: string
          price: number | null
          purchase_unit: string
          sku: string
          stock_quantity: number
          tenant_id: string
          unit_conversion_ratio: number
          updated_at: string
        }
        Insert: {
          base_unit: string
          category: string
          cost?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean
          is_variable_price?: boolean | null
          low_stock_threshold?: number
          name: string
          price?: number | null
          purchase_unit: string
          sku: string
          stock_quantity?: number
          tenant_id: string
          unit_conversion_ratio?: number
          updated_at?: string
        }
        Update: {
          base_unit?: string
          category?: string
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean
          is_variable_price?: boolean | null
          low_stock_threshold?: number
          name?: string
          price?: number | null
          purchase_unit?: string
          sku?: string
          stock_quantity?: number
          tenant_id?: string
          unit_conversion_ratio?: number
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          product_id: string
          product_name: string
          purchase_order_id: string
          quantity: number
          tenant_id: string
          total_cost: number
        }
        Insert: {
          cost_per_unit: number
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          purchase_order_id: string
          quantity: number
          tenant_id: string
          total_cost: number
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          purchase_order_id?: string
          quantity?: number
          tenant_id?: string
          total_cost?: number
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          po_number: string
          status: string
          supplier_contact: string | null
          supplier_name: string
          tenant_id: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          po_number: string
          status?: string
          supplier_contact?: string | null
          supplier_name: string
          tenant_id: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          status?: string
          supplier_contact?: string | null
          supplier_name?: string
          tenant_id?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      return_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          return_id: string
          subtotal: number
          tenant_id: string
          transaction_item_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantity: number
          return_id: string
          subtotal: number
          tenant_id: string
          transaction_item_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          return_id?: string
          subtotal?: number
          tenant_id?: string
          transaction_item_id?: string
          unit_price?: number
        }
        Relationships: []
      }
      returns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          id: string
          reason: string
          return_number: string
          status: string
          tenant_id: string
          total_amount: number
          transaction_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          reason: string
          return_number: string
          status?: string
          tenant_id: string
          total_amount: number
          transaction_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          return_number?: string
          status?: string
          tenant_id?: string
          total_amount?: number
          transaction_id?: string
        }
        Relationships: []
      }
      stock_history: {
        Row: {
          created_at: string
          created_by: string
          id: string
          product_id: string
          quantity_after: number
          quantity_change: number
          reason: string | null
          reference_id: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          product_id: string
          quantity_after: number
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          product_id?: string
          quantity_after?: number
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
        }
        Relationships: []
      }
      tour_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          step_id: string | null
          tenant_id: string
          tour_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          step_id?: string | null
          tenant_id: string
          tour_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          step_id?: string | null
          tenant_id?: string
          tour_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          subtotal: number
          tenant_id: string
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          subtotal: number
          tenant_id: string
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          product_sku?: string
          quantity?: number
          subtotal?: number
          tenant_id?: string
          transaction_id?: string
          unit_price?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string | null
          discount_amount: number
          discount_type: string
          discount_value: number
          id: string
          payment_method: string
          served_by: string | null
          status: string
          subtotal: number
          tenant_id: string
          total: number
          transaction_number: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id?: string | null
          discount_amount?: number
          discount_type: string
          discount_value?: number
          id?: string
          payment_method: string
          served_by?: string | null
          status?: string
          subtotal: number
          tenant_id: string
          total: number
          transaction_number: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string | null
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          id?: string
          payment_method?: string
          served_by?: string | null
          status?: string
          subtotal?: number
          tenant_id?: string
          total?: number
          transaction_number?: string
        }
        Relationships: []
      }
      user_tour_hints_dismissed: {
        Row: {
          dismissed_at: string | null
          hint_id: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string | null
          hint_id: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          dismissed_at?: string | null
          hint_id?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tour_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          started_at: string | null
          status: string
          tenant_id: string
          time_spent_seconds: number | null
          total_steps: number | null
          tour_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          started_at?: string | null
          status: string
          tenant_id: string
          time_spent_seconds?: number | null
          total_steps?: number | null
          tour_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          time_spent_seconds?: number | null
          total_steps?: number | null
          tour_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_po_number: { Args: { p_tenant_id: string }; Returns: string }
      generate_return_number: { Args: { p_tenant_id: string }; Returns: string }
      generate_transaction_number: { Args: { p_tenant_id: string }; Returns: string }
      get_user_tour_stats: {
        Args: { p_user_id: string }
        Returns: {
          completed_tours: number
          completion_percentage: number
          in_progress_tours: number
          skipped_tours: number
          total_tours: number
        }[]
      }
      track_tour_event: {
        Args: {
          p_event_type: string
          p_metadata?: Json
          p_step_id: string
          p_tenant_id: string
          p_tour_id: string
          p_user_id: string
        }
        Returns: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          step_id: string | null
          tenant_id: string
          tour_id: string
          user_id: string | null
        }
      }
      update_tour_progress: {
        Args: {
          p_current_step: number
          p_status: string
          p_tenant_id: string
          p_total_steps: number
          p_tour_id: string
          p_user_id: string
        }
        Returns: {
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          started_at: string | null
          status: string
          tenant_id: string
          time_spent_seconds: number | null
          total_steps: number | null
          tour_id: string
          updated_at: string | null
          user_id: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
